import { Request, Response, NextFunction } from 'express';
import { google } from '@ai-sdk/google';
import { streamText, embed } from 'ai';
import { prisma } from '../config/db';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

const chat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messages } = req.body;
    const lastMessage = messages[messages.length - 1];
    const userId = (req.user as any).id;

    if (!lastMessage || !lastMessage.content) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Messages content is required');
    }

    // 1. Convert user question to embedding
    const { embedding } = await embed({
      model: google.textEmbeddingModel('text-embedding-004'),
      value: lastMessage.content,
    });

    // 2. Search for similar documents
    // Note: Prisma raw query allows casting to vector using ::vector
    // We assume the embedding is valid array of numbers.
    const vectorQuery = `[${embedding.join(',')}]`;

    // Perform similarity search
    const documents = await prisma.$queryRaw`
      SELECT content, 1 - (embedding <=> ${vectorQuery}::vector) as similarity
      FROM "Document"
      WHERE "userId" = ${userId}
      ORDER BY embedding <=> ${vectorQuery}::vector
      LIMIT 5
    `;

    // 3. Construct System Prompt
    const context = (documents as any[]).map((doc) => doc.content).join('\n\n');

    const systemPrompt = `You are a helpful assistant. Use the following context to answer the user's question. If the answer is not in the context, say you define knw.
    
    Context:
    ${context}
    `;

    // 4. Generate Response (Stream)
    const result = streamText({
      // check the Docs at https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai
      model: google('gemini-2.5-flash'), // Be aware! some models cost money or not available in free tier
      messages,
      system: systemPrompt,
    });

    result.pipeTextStreamToResponse(res);
  } catch (error) {
    next(error);
  }
};

export const agentController = {
  chat,
};
