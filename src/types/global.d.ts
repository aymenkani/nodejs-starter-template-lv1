import { Server } from 'http';
import { PrismaClient } from '@prisma/client';
import { ScheduledTask } from 'node-cron';
import { Worker, Queue } from 'bullmq';

declare global {
  var __SERVER__: Server;

  var __PRISMA__: PrismaClient;

  var __CRONJOB__: ScheduledTask;

  var __TOKEN_CLEANUP_WORKER__: Worker;

  var __TOKEN_CLEANUP_QUEUE__: Queue;
}
