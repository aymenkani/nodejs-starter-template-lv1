/* eslint-disable no-console */
import { closeQueues } from '../src/jobs/queue';
import { prisma } from '../src/config/db';

afterAll(async () => {
  // Close Redis connections from queues
  await closeQueues();
  // Disconnect Prisma
  await prisma.$disconnect();
});
