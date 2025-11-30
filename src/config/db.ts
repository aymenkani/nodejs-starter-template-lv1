import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma: PrismaClient = new PrismaClient();

async function connectDB() {
  try {
    await prisma.$connect();
    logger.info('Connected to the database with Prisma');
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error(`Error connecting to database: ${error}`);
    process.exit(1);
  }
}

export { prisma, connectDB };
