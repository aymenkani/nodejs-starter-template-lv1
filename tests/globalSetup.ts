import dotenv from 'dotenv';
import path from 'path';

process.env.NODE_ENV = 'test';
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

import { startServer } from '../src/server';
import { Server } from 'http';
import { PrismaClient } from '@prisma/client/extension';
import { ScheduledTask } from 'node-cron';
import { Queue, Worker } from 'bullmq';

declare global {
  // eslint-disable-next-line no-var
  var __SERVER__: Server;
  // eslint-disable-next-line no-var
  var __PRISMA__: PrismaClient;
  // eslint-disable-next-line no-var
  var __CRONJOB__: ScheduledTask;
  // eslint-disable-next-line no-var
  var __TOKEN_CLEANUP_WORKER__: Worker;
  // eslint-disable-next-line no-var
  var __TOKEN_CLEANUP_QUEUE__: Queue;
}


module.exports = async () => {
  const { server, prisma, cronJob, tokenCleanupWorker, tokenCleanupQueue } = await startServer(5002); // Use a specific port for tests
  global.__SERVER__ = server;
  global.__PRISMA__ = prisma;
  global.__CRONJOB__ = cronJob;
  global.__TOKEN_CLEANUP_WORKER__ = tokenCleanupWorker;
  global.__TOKEN_CLEANUP_QUEUE__ = tokenCleanupQueue;
};
