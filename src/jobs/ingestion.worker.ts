import { Job, Worker } from 'bullmq';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getConfig } from '../config/config';
import { prisma } from '../config/db';
import logger from '../utils/logger';
import dotenv from 'dotenv';
dotenv.config();

const config = getConfig(process.env);
import { google } from '@ai-sdk/google';
import { embed } from 'ai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { extractText, getDocumentProxy } from 'unpdf';
import { redisConnection } from './queue';
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
  fileKey: string;
  mimeType: string;
  originalName: string;
  userId: string;
}

export const processJob = async (job: Job<IngestionJobData>) => {
  const { fileKey, mimeType, originalName, userId } = job.data;
  logger.info(`Starting ingestion for file: ${fileKey} user: ${userId}`);

  try {
    // 1. Download from S3
    const command = new GetObjectCommand({
      Bucket: config.aws.s3.bucket,
      Key: fileKey,
    });
    const s3Response = await s3Client.send(command);
    if (!s3Response.Body) throw new Error('Empty body from S3');

    // Convert stream to buffer
    const byteArray = await s3Response.Body.transformToByteArray();
    const buffer = Buffer.from(byteArray);

    let text = '';

    // 2. Parse Text
    if (mimeType === 'application/pdf') {
      const pdfBuffer = new Uint8Array(byteArray);
      const pdf = await getDocumentProxy(pdfBuffer);
      const result = await extractText(pdf, { mergePages: true }); // ✅ One-liner
      text = Array.isArray(result.text) ? result.text.join('\n') : result.text;
    } else {
      // Assume text/plain or similar
      text = buffer.toString('utf-8');
    }

    if (!text.trim()) {
      logger.warn(`No text extracted from file: ${fileKey}`);
      return;
    }

    // 3. Chunk Text
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const chunks = await splitter.createDocuments([text]);

    logger.info(`Generated ${chunks.length} chunks for file: ${fileKey}`);

    // 4. Generate Embeddings & Save
    for (const chunk of chunks) {
      const { embedding } = await embed({
        model: google.textEmbeddingModel('text-embedding-004'),
        value: chunk.pageContent,
      });

      // 5. Save to Postgres (with vector type)
      // Prisma doesn't support vector type natively in the client for creating/updating easily with type safety yet for typed queries mixed with raw,
      // but we can use $executeRaw for the insertion logic or strongly typed extension if we set it up.
      // The plan specified using $executeRaw.

      await prisma.$executeRaw`
        INSERT INTO "Document" ("id", "content", "metadata", "userId", "embedding", "createdAt")
        VALUES (gen_random_uuid(), ${chunk.pageContent}, ${JSON.stringify({ ...chunk.metadata, originalName })}::jsonb, ${userId}, ${embedding}::vector, NOW())
      `;
    }

    logger.info(`Successfully ingested file: ${fileKey}`);
  } catch (error) {
    logger.error(`Error processing ingestion job ${job.id}: ${error}`);
    throw error;
  }
};
