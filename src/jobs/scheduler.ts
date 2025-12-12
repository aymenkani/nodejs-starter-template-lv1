import { addTokenCleanupJob, addFileCleanupJob } from './queue';
import logger from '../utils/logger';
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

export const startFileCleanupJob = () => {
  // Schedule to add a file cleanup job to the queue every 24 hours (at midnight)
  const job = cron.schedule(
    '0 0 * * *',
    async () => {
      logger.info('Adding file cleanup job to queue.');
      await addFileCleanupJob({});
    },
    {
      timezone: 'UTC',
    },
  );
  logger.info('File cleanup job scheduled to run daily at midnight UTC.');
  return job;
};
