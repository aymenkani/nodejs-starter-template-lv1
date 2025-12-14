import { Queue, QueueOptions, RedisOptions } from 'bullmq';
import { getConfig } from '../config/config';
import dotenv from 'dotenv';

dotenv.config();

const config = getConfig(process.env);

export const tokenCleanupQueueName = 'tokenCleanup';
export const ingestionQueueName = 'ai-ingestion';
export const fileCleanupQueueName = 'fileCleanup';

export const redisConnection: RedisOptions = {
  host: config.redis.host,
  port: config.redis.port,
  password: process.env.REDIS_PASSWORD || undefined, // Config might not have password strictly typed if optional, checking config.ts
};

const defaultQueueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: 1000,
  },
};

// Singleton Queue Instances
export const tokenCleanupQueue = new Queue(tokenCleanupQueueName, defaultQueueOptions);
export const ingestionQueue = new Queue(ingestionQueueName, defaultQueueOptions);
export const fileCleanupQueue = new Queue('fileCleanup', defaultQueueOptions);

export const closeQueues = async () => {
  await tokenCleanupQueue.close();
  await ingestionQueue.close();
  await fileCleanupQueue.close();
};

export const addTokenCleanupJob = async (data: unknown) => {
  await tokenCleanupQueue.add('cleanExpiredTokens', data);
};

export const addFileCleanupJob = async (data: unknown) => {
  await fileCleanupQueue.add('cleanAbandonedFiles', data);
};

export const addPublicFileCleanupJob = async (data: unknown) => {
  await fileCleanupQueue.add('cleanPublicFiles', data);
};

export const addPrivateFileCleanupJob = async (data: unknown) => {
  await fileCleanupQueue.add('cleanPrivateFiles', data);
};
