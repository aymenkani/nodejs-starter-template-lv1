import { google } from '@ai-sdk/google';
import { streamText, embed, generateText } from 'ai';
import { prisma } from '../config/db';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Config } from '../config/config';
import logger from '../utils/logger';
import { prompts } from '../config/prompts';
import { aiModels } from '../config/ai-models';

export const createAgentService = (config: Config) => {
  const s3Client = new S3Client({
    region: config.aws.region,
    endpoint: process.env.AWS_ENDPOINT,
    credentials: {
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
    },
  });

  const chat = async (messages: any[], userId: string) => {
    const lastMessage = messages[messages.length - 1];

    if (!lastMessage || !lastMessage.content) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Messages content is required');
    }

    // 1. Refine Search Query (Contextual Query Rewriter)
    let searchQuery = lastMessage.content;

    if (messages.length > 1) {
      try {
        const { text } = await generateText({
          model: google(aiModels.agent.queryRewriter),
          messages: messages, // Pass full history
          system: prompts.agent.queryRewriter,
        });
        searchQuery = text;
        logger.info(`Rewrote query: "${lastMessage.content}" -> "${searchQuery}"`);
      } catch (error) {
        logger.error(`Query rewriting failed: ${error}`);
        // Fallback to original content on error
      }
    }

    // 2. Convert refined query to embedding
    const { embedding } = await embed({
      model: google.textEmbeddingModel(aiModels.agent.embedding),
      value: searchQuery,
    });

    const vectorQuery = `[${embedding.join(',')}]`;

    // 4. Retrieve (Hybrid Search: User's Private + Public Knowledge Base)
    // We join with "File" table to check isPublic flag and get file details for citations.
    const documents = (await prisma.$queryRaw`
      SELECT d.content, d.metadata, f."originalName", f."fileKey", f."isPublic", (d.embedding <=> ${vectorQuery}::vector) as distance
      FROM "Document" d
      LEFT JOIN "File" f ON d."fileId" = f.id
      WHERE (d."userId" = ${userId} OR f."isPublic" = true)
      ORDER BY distance ASC
      LIMIT 5
    `) as any[];

    // 5. Package Context with Smart Citations
    const docsMap = documents.map(async (doc) => {
      // Generate Presigned URL for "Source Link"
      let signedUrl = 'unavailable';
      if (doc.fileKey) {
        try {
          const command = new GetObjectCommand({
            Bucket: config.aws.s3.bucket,
            Key: doc.fileKey,
          });
          // URL valid for 1 hour (3600s)
          signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        } catch (e) {
          logger.error(`Failed to generate signed URL for ${doc.fileKey}: ${e}`);
        }
      }

      const visibilityLabel = doc.isPublic ? '[Public Doc]' : '[Your Private Doc]';

      return `Source Name: ${doc.originalName} ${visibilityLabel} (Link: ${signedUrl})\nContent: ${doc.content}`;
    });

    const contextArray = await Promise.all(docsMap);
    const context = contextArray.join('\n\n');

    // 6. Generate Response
    const systemPrompt = prompts.agent.systemPrompt.replace('{{context}}', context);

    // 4. Generate Response (Stream)
    const result = streamText({
      // check the Docs at https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai
      /*
        list of gemini models you can use for free:
        - gemini-2.5-flash
        - gemini-2.5-flash-tts
        - gemma-3-12b
      */
      model: google(aiModels.agent.chat), // Be aware! some models cost money or not available in free tier
      messages,
      system: systemPrompt,
    });

    return result;
  };

  return {
    chat,
  };
};
