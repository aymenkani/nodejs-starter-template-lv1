import { Job, Worker } from 'bullmq';
import { S3Client, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getConfig } from '../config/config';
import { prisma } from '../config/db';
import logger from '../utils/logger';
import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

const config = getConfig(process.env);
import { google } from '@ai-sdk/google';
import { embed, generateText } from 'ai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { extractText, getDocumentProxy } from 'unpdf';
import { redisConnection } from './queue';
import { prompts } from '../config/prompts';
import { aiModels } from '../config/ai-models';

// Start of worker implementation
const WORKER_NAME = 'ai-ingestion';

const s3Client = new S3Client({
  region: config.aws.region, // Cloudflare R2 uses 'auto'
  endpoint: process.env.AWS_ENDPOINT,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

interface IngestionJobData {
  fileId: string;
}

export const processJob = async (job: Job<IngestionJobData>) => {
  const { fileId } = job.data;
  logger.info(`Starting ingestion job ${job.id} for fileId: ${fileId}`);

  try {
    // 0. Fetch File Record
    const fileRecord = await prisma.file.findUnique({ where: { id: fileId } });
    if (!fileRecord) {
      throw new Error(`File record not found: ${fileId}`);
    }

    const { fileKey, userId, mimeType, originalName } = fileRecord;

    await prisma.file.update({
      where: { id: fileId },
      data: { status: 'PROCESSING' },
    });

    // 1. Download from S3
    const command = new GetObjectCommand({
      Bucket: config.aws.s3.bucket,
      Key: fileKey,
    });

    let s3Response;
    try {
      s3Response = await s3Client.send(command);
    } catch (error: any) {
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        logger.warn(`File not found in S3 for fileId: ${fileId}. Cleaning up reservation...`);
        await prisma.file.delete({ where: { id: fileId } });
        return; // Exit successfully (cleanup complete)
      }
      throw error; // Retry other errors
    }

    if (!s3Response.Body) throw new Error('Empty body from S3');

    // Convert stream to buffer
    const byteArray = await s3Response.Body.transformToByteArray();
    const buffer = Buffer.from(byteArray);

    // 2. Hash Calculation & Idempotency Check
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

    const duplicate = await prisma.file.findFirst({
      where: {
        userId,
        fileHash,
        status: 'COMPLETED',
        id: { not: fileId },
      },
    });

    if (duplicate) {
      logger.warn(
        `Duplicate file detected for user ${userId}. Hash: ${fileHash}. Cleaning up S3...`,
      );

      // Reactive Cleanup: Delete from S3
      const deleteCommand = new DeleteObjectCommand({
        Bucket: config.aws.s3.bucket,
        Key: fileKey,
      });
      await s3Client.send(deleteCommand);
      logger.info(`Deleted duplicate file from S3: ${fileKey}`);

      await prisma.file.update({
        where: { id: fileId },
        data: {
          status: 'DUPLICATE',
          fileHash,
        },
      });
      return;
    }

    // Update hash on current file
    await prisma.file.update({
      where: { id: fileId },
      data: { fileHash },
    });

    let text = '';

    // 3. Parse Text
    if (mimeType === 'application/pdf') {
      const pdfBuffer = new Uint8Array(byteArray);
      const pdf = await getDocumentProxy(pdfBuffer);
      const result = await extractText(pdf, { mergePages: true });
      text = Array.isArray(result.text) ? result.text.join('\n') : result.text;
    } else if (mimeType.startsWith('image/')) {
      // Visual RAG: Analyze image with Gemini
      logger.info(`Processing image file: ${fileKey}`);
      const { text: imageDesc } = await generateText({
        model: google(aiModels.ingestion.imageAnalysis), // use gemini-2.5-flash-lite for free tier
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompts.ingestion.imageAnalysis,
              },
              {
                type: 'image',
                image: buffer,
              },
            ],
          },
        ],
      });
      text = imageDesc;
    } else {
      // Assume text/plain or similar
      text = buffer.toString('utf-8');
    }

    if (!text.trim()) {
      logger.warn(`No text extracted from file: ${fileKey}`);
      await prisma.file.update({ where: { id: fileId }, data: { status: 'FAILED' } });
      return;
    }

    // 4. Chunk Text
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const chunks = await splitter.createDocuments([text]);

    logger.info(`Generated ${chunks.length} chunks for file: ${fileKey}`);

    // 5. Generate Embeddings & Save
    for (const chunk of chunks) {
      const { embedding } = await embed({
        model: google.textEmbeddingModel(aiModels.ingestion.embedding),
        value: chunk.pageContent,
      });

      // 6. Save to Postgres (with vector type)
      await prisma.$executeRaw`
        INSERT INTO "Document" ("id", "content", "metadata", "userId", "fileId", "embedding", "createdAt")
        VALUES (gen_random_uuid(), ${chunk.pageContent}, ${JSON.stringify({ ...chunk.metadata, originalName })}::jsonb, ${userId}, ${fileId}, ${embedding}::vector, NOW())
      `;
    }

    // 7. Mark Completed
    await prisma.file.update({
      where: { id: fileId },
      data: { status: 'COMPLETED' },
    });

    logger.info(`Successfully ingested file: ${fileId}`);
  } catch (error) {
    logger.error(`Error processing ingestion job ${job.id}: ${error}`);
    // Mark Failed
    await prisma.file
      .update({
        where: { id: fileId },
        data: { status: 'FAILED' },
      })
      .catch((e: unknown) => logger.error(`Failed to update status to FAILED: ${e}`));

    throw error;
  }
};
