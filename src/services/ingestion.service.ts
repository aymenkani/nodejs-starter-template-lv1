import { Queue } from 'bullmq';

interface IngestionJobData {
  fileId: string;
}

export const createIngestionService = (queue: Queue) => {
  const addIngestionJob = async (data: IngestionJobData) => {
    await queue.add('ingest', data);
  };

  return {
    addIngestionJob,
  };
};
