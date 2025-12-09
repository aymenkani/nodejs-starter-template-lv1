import { Queue } from 'bullmq';
import { ingestionQueueName } from '../jobs/queue';
import { getConfig } from '../config/config';

const config = getConfig(process.env);

// Note: We are creating a new Queue instance here for the producer.
// In a real app, we might want to share the connection or queue instance.
// But for simplicity and following the pattern in startServer (though that's for worker),
// we create a queue instance here.
// Ideally, `src/jobs/queue.ts` should export the initialized queue or a factory.
// But `src/server.ts` initializes it inside `startServer`.
// This means we might have multiple connections.
// I'll create a local queue instance here for adding jobs.

const ingestionQueue = new Queue(ingestionQueueName, {
  connection: {
    host: config.redis.host,
    port: config.redis.port,
  },
});

interface IngestionJobData {
  fileKey: string;
  mimeType: string;
  userId: string;
}

const addIngestionJob = async (data: IngestionJobData) => {
  await ingestionQueue.add('ingest', data);
};

export const ingestionService = {
  addIngestionJob,
};
