import express, { Express, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import './config/passport.config'; // Import passport config to ensure strategies are registered
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { Server } from 'http';
import { ScheduledTask } from 'node-cron';
import { Worker, Queue } from 'bullmq';

import { getConfig } from './config/config';
import { connectDB } from './config/db';
import { swaggerSpec } from './docs/openapi';
import apiRoutes from './api';
import { errorConverter, errorHandler } from './middleware/error';
import logger from './utils/logger';
import { startTokenCleanupJob } from './jobs/scheduler';
import { processTokenCleanupJob } from './jobs/tokenCleanup.worker';
import {
  tokenCleanupQueue,
  ingestionQueue,
  tokenCleanupQueueName,
  ingestionQueueName,
} from './jobs/queue';
import { processJob as processIngestionJob } from './jobs/ingestion.worker';
import { prisma } from './config/db';
import { PrismaClient } from '@prisma/client/extension';
import { socketService } from './services/socket.service';
import path from 'path';

const config = getConfig(process.env);

const app: Express = express();
app.use(passport.initialize());

app.use((req: Request, res: Response, next: NextFunction) => {
  next();
});

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'script-src': ["'self'", 'https://cdn.socket.io'],
        'connect-src': [
          "'self'",
          'https://cdn.socket.io',
          'https://*.r2.cloudflarestorage.com',
          'https://*.cloudflare.com',
          // Add your server's WebSocket protocol for Socket.IO
          config.env === 'production' ? 'wss:' : 'ws:',
        ],
      },
    },
  }),
);

app.get('/api/v1/health', async (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP' });
});

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
});
app.use(limiter);

app.use(hpp());
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve static files from the 'public' directory
app.use('/client', express.static(path.join(__dirname, '../public')));

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: { docExpansion: 'none', defaultModelsExpandDepth: 2 },
  }),
);

app.get('/docs/json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use('/api/v1', apiRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('API is running...');
});

app.use(errorConverter);
app.use(errorHandler);

async function startServer(port?: number) {
  await connectDB();

  // Initialize Workers
  // Note: Queues are singleton imported from jobs/queue.ts

  const tokenCleanupWorker = new Worker(tokenCleanupQueueName, processTokenCleanupJob, {
    connection: {
      host: config.redis.host,
      port: config.redis.port,
    },
  });

  const ingestionWorker = new Worker(ingestionQueueName, processIngestionJob, {
    connection: {
      host: config.redis.host,
      port: config.redis.port,
    },
  });

  const cronJob = startTokenCleanupJob();

  const server: Server = app.listen(port || config.port, () =>
    logger.info(`Server running on port ${port || config.port}`),
  );

  // Initialize Socket.IO service
  socketService.init(server);

  return {
    app,
    server,
    prisma,
    cronJob,
    tokenCleanupWorker,
    ingestionWorker,
  };
}

async function stopServer(
  server: Server,
  prisma: PrismaClient,
  cronJob: ScheduledTask,
  worker: Worker,
  ingestionWorker: Worker,
) {
  // Use imported tokenCleanupQueue and ingestionQueue directly
  logger.info('Attempting to stop server...');

  // 1. Stop new jobs from being scheduled
  logger.info('Attempting to stop cron job...');
  cronJob.stop();
  logger.info('Cron job stopped.');

  // 2. Close servers to prevent new connections
  const io = socketService.getIO();
  if (io) {
    await new Promise<void>((resolve) => {
      io.close(() => {
        logger.info('Socket.IO server closed.');
        resolve();
      });
    });
  }

  await new Promise<void>((resolve) => {
    server.close(() => {
      logger.info('HTTP server closed.');
      resolve();
    });
  });

  // 3. Close the queue to prevent new jobs from being processed
  logger.info('Attempting to close token cleanup queue...');
  await tokenCleanupQueue.close();
  logger.info('Token cleanup queue closed.');

  // 4. Close the worker and wait for any active jobs to finish
  logger.info('Attempting to close token cleanup worker...');
  await worker.close(config.env === 'test' ? true : false);
  logger.info('Token cleanup worker closed.');

  // Close ingestion queue/worker
  logger.info('Closing ingestion queue...');
  if (ingestionQueue) {
    await ingestionQueue.close();
  }
  logger.info('Closing ingestion worker...');
  if (ingestionWorker) {
    await ingestionWorker.close(config.env === 'test' ? true : false);
  }

  // 5. Finally, disconnect from the database
  logger.info('Attempting to disconnect Prisma...');
  await prisma.$disconnect();
  logger.info('Prisma disconnected.');

  logger.info('Server shutdown complete.');
}

if (require.main === module) {
  startServer();
}

export { startServer, stopServer, app };
