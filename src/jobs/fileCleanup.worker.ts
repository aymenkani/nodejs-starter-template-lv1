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

  if (job.name === 'cleanPublicFiles' || job.name === 'cleanPrivateFiles') {
    try {
      // CRITICAL: Only run in DEMO_MODE
      if (!config.demoMode) {
        logger.info(`Skipping ${job.name} because DEMO_MODE is not enabled.`);
        return { cleanedCount: 0, skipped: true };
      }

      const isPublic = job.name === 'cleanPublicFiles';

      // Find completed files (public or private) excluding aymenkani554@gmail.com
      const filesToDelete = await prisma.file.findMany({
        where: {
          status: 'COMPLETED',
          isPublic: isPublic,
          user: {
            email: {
              not: 'aymenkani554@gmail.com',
            },
          },
        },
        include: {
          user: true,
        },
      });

      if (filesToDelete.length === 0) {
        logger.info(`No ${isPublic ? 'public' : 'private'} files found for cleanup.`);
        return { cleanedCount: 0 };
      }

      logger.info(
        `Found ${filesToDelete.length} ${isPublic ? 'public' : 'private'} files. Starting cleanup...`,
      );

      let deletedCount = 0;

      // Process each file
      for (const file of filesToDelete) {
        try {
          // Attempt to delete from S3
          if (file.fileKey) {
            try {
              const command = new DeleteObjectCommand({
                Bucket: config.aws.s3.bucket,
                Key: file.fileKey,
              });
              await s3Client.send(command);
              logger.info(`Deleted S3 object: ${file.fileKey}`);
            } catch (s3Error) {
              logger.warn(`Failed to delete S3 object for file ${file.id}: ${s3Error}`);
              // Continue to DB deletion even if S3 fails
            }
          }

          // Delete from DB
          await prisma.file.delete({ where: { id: file.id } });
          deletedCount++;
        } catch (dbError) {
          logger.error(`Failed to delete DB record for file ${file.id}: ${dbError}`);
        }
      }

      logger.info(
        `Successfully cleaned up ${deletedCount} ${isPublic ? 'public' : 'private'} files.`,
      );
      return { cleanedCount: deletedCount };
    } catch (error) {
      logger.error(error, `Error in ${job.name} cleanup worker:`);
      throw error;
    }
  }
};
