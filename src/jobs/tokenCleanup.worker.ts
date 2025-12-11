import { Job } from 'bullmq';
import { prisma } from '../config/db';
import logger from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

export const processTokenCleanupJob = async (job: Job) => {
  logger.info(`Processing job ${job.id} of type ${job.name}`);
  if (job.name === 'cleanExpiredTokens') {
    try {
      const { count } = await prisma.blacklistedToken.deleteMany({
        where: {
          expires: {
            lt: new Date(),
          },
        },
      });
      logger.info(`Cleaned up ${count} expired blacklisted tokens.`);
      return { cleanedCount: count };
    } catch (error) {
      logger.error(error, 'Error cleaning up expired blacklisted tokens in worker:');
      throw error; // Re-throw to indicate job failure
    }
  }
};

// Note: Worker event listeners (on 'completed', 'failed') and initialization
// are now handled where the Worker is instantiated (e.g., in src/server.ts)
// to ensure proper lifecycle management in testing environments.
