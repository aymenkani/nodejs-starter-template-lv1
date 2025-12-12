import { Job } from 'bullmq';
import { prisma } from '../config/db';
import logger from '../utils/logger';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getConfig } from '../config/config';

const config = getConfig(process.env);

const s3Client = new S3Client({
  region: config.aws.region,
  endpoint: process.env.AWS_ENDPOINT,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

export const processFileCleanupJob = async (job: Job) => {
  logger.info(`Processing job ${job.id} of type ${job.name}`);

  if (job.name === 'cleanAbandonedFiles') {
    try {
      // 1. Find abandoned files (PENDING for > 24 hours)
      const abandonedFiles = await prisma.file.findMany({
        where: {
          status: 'PENDING',
          createdAt: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
          },
        },
      });

      if (abandonedFiles.length === 0) {
        logger.info('No abandoned files found.');
        return { cleanedCount: 0 };
      }

      logger.info(`Found ${abandonedFiles.length} abandoned files. Starting cleanup...`);

      let deletedCount = 0;

      // 2. Process each file
      for (const file of abandonedFiles) {
        try {
          // Attempt to delete from S3 (best effort)
          if (file.fileKey) {
            try {
              const command = new DeleteObjectCommand({
                Bucket: config.aws.s3.bucket,
                Key: file.fileKey,
              });
              await s3Client.send(command);
            } catch (s3Error) {
              logger.warn(`Failed to delete S3 object for file ${file.id}: ${s3Error}`);
              // Continue to DB deletion even if S3 fails (or file didn't exist)
            }
          }

          // Delete from DB
          await prisma.file.delete({ where: { id: file.id } });
          deletedCount++;
        } catch (dbError) {
          logger.error(`Failed to delete DB record for file ${file.id}: ${dbError}`);
        }
      }

      logger.info(`Successfully cleaned up ${deletedCount} abandoned files.`);
      return { cleanedCount: deletedCount };
    } catch (error) {
      logger.error(error, 'Error in file cleanup worker:');
      throw error;
    }
  }
};
