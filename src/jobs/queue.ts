import { Queue, QueueOptions, RedisOptions } from 'bullmq';
import dotenv from 'dotenv';

dotenv.config();

export const tokenCleanupQueueName = 'tokenCleanup';
export const ingestionQueueName = 'ai-ingestion';

export const redisConnection: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

const defaultQueueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
};

export const addTokenCleanupJob = async (queue: Queue, data: unknown) => {
  await queue.add('cleanExpiredTokens', data, defaultQueueOptions.defaultJobOptions);
};
