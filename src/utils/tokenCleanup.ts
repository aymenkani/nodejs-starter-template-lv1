import { Queue } from 'bullmq';
import { addTokenCleanupJob } from '../jobs/queue';
import logger from './logger';
import cron from 'node-cron';
import { getConfig } from '../config/config';

const config = getConfig(process.env);

export const startTokenCleanupJob = () => {
  // Schedule to add a token cleanup job to the queue every 60 minutes
  const job = cron.schedule(
    `*/60 * * * *`,
    async () => {
      logger.info('Adding token cleanup job to queue.');
      await addTokenCleanupJob({});
    },
    {
      timezone: 'UTC', // Or your application's preferred timezone
    },
  );
  logger.info(`Token cleanup job scheduled to be added to queue every 60 minutes.`);
  return job;
};
