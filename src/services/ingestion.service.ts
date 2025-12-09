import { Queue } from 'bullmq';

interface IngestionJobData {
  fileKey: string;
  mimeType: string;
  userId: string;
}

export const createIngestionService = (queue: Queue) => {
  const addIngestionJob = async (data: IngestionJobData) => {
    await queue.add('ingest', data);
  };

  return {
    addIngestionJob,
  };
};
