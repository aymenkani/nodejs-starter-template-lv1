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
import {
  startTokenCleanupJob,
  startFileCleanupJob,
  startPublicFileCleanupJob,
  startPrivateFileCleanupJob,
} from './jobs/scheduler';
import { processTokenCleanupJob } from './jobs/tokenCleanup.worker';
import {
  tokenCleanupQueue,
  ingestionQueue,
  fileCleanupQueue,
  tokenCleanupQueueName,
  ingestionQueueName,
  fileCleanupQueueName,
} from './jobs/queue';
import { processJob as processIngestionJob } from './jobs/ingestion.worker';
import { processFileCleanupJob } from './jobs/fileCleanup.worker';
import { prisma } from './config/db';
import { PrismaClient } from '@prisma/client/extension';
import { socketService } from './services/socket.service';
import path from 'path';

const config = getConfig(process.env);

const app: Express = express();
app.set('trust proxy', 1);
app.use(passport.initialize());

app.use((req: Request, res: Response, next: NextFunction) => {
  next();
});
const wsUrl = config.client.url.replace(/^http/, 'ws');
app.use(
  helmet({
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }, // remove this from the template
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'script-src': [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          'https://cdn.socket.io',
          'https://cdn.jsdelivr.net',
          'https://cdn.tailwindcss.com',
        ],
        'form-action': [
          // remove this from the template
          "'self'",
          'https://gumroad.com/follow_from_embed_form',
        ],
        'connect-src': [
          "'self'",
          'https://cdn.socket.io',
          'https://cdn.jsdelivr.net',
          'https://cdn.tailwindcss.com',
          config.client.url,
          'https://*.cloudflare.com',
          'https://*.r2.cloudflarestorage.com',
          'https://r2.cloudflarestorage.com',
          wsUrl, // for production url
          'ws://' + config.client.host + ':' + config.client.port, // for development url
        ],
        'img-src': ["'self'", 'data:', 'blob:', 'https:', 'http:'],
        'style-src': [
          "'self'",
          "'unsafe-inline'",
          'https://cdn.jsdelivr.net',
          'https://fonts.googleapis.com',
        ],
      },
    },
  }),
);

app.get('/api/v1/health', async (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP' });
});

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100,
  standardHeaders: true, // ALLWAYS KEEP THIS AS TRUE
  legacyHeaders: false, // ALLWAYS KEEP THIS AS FALSE
  message: 'Too many requests from this IP, please try again after 10 minutes',
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
      url: config.redis.url,
    },
  });

  const ingestionWorker = new Worker(ingestionQueueName, processIngestionJob, {
    connection: {
      url: config.redis.url,
    },
  });

  const fileCleanupWorker = new Worker(fileCleanupQueueName, processFileCleanupJob, {
    connection: {
      url: config.redis.url,
    },
  });

  const cronJob = startTokenCleanupJob();
  const fileCleanupCronJob = startFileCleanupJob();
  const publicFileCleanupCronJob = startPublicFileCleanupJob();
  const privateFileCleanupCronJob = startPrivateFileCleanupJob();

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
    fileCleanupCronJob,
    publicFileCleanupCronJob,
    privateFileCleanupCronJob,
    tokenCleanupWorker,
    ingestionWorker,
    fileCleanupWorker,
  };
}

async function stopServer(
  server: Server,
  prisma: PrismaClient,
  cronJob: ScheduledTask,
  worker: Worker,
  ingestionWorker: Worker,
  fileCleanupCronJob?: ScheduledTask,
  fileCleanupWorker?: Worker,
  publicFileCleanupCronJob?: ScheduledTask,
  privateFileCleanupCronJob?: ScheduledTask,
) {
  // Use imported tokenCleanupQueue and ingestionQueue directly
  logger.info('Attempting to stop server...');

  // 1. Stop new jobs from being scheduled
  logger.info('Attempting to stop cron job...');
  cronJob.stop();
  fileCleanupCronJob?.stop();
  publicFileCleanupCronJob?.stop();
  privateFileCleanupCronJob?.stop();
  logger.info('Cron jobs stopped.');

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

  logger.info('Attempting to close file cleanup queue...');
  if (fileCleanupQueue) {
    await fileCleanupQueue.close();
  }
  logger.info('File cleanup queue closed.');

  // 4. Close the worker and wait for any active jobs to finish
  logger.info('Attempting to close token cleanup worker...');
  await worker.close(config.env === 'test' ? true : false);
  logger.info('Token cleanup worker closed.');

  logger.info('Attempting to close file cleanup worker...');
  if (fileCleanupWorker) {
    await fileCleanupWorker.close(config.env === 'test' ? true : false);
  }
  logger.info('File cleanup worker closed.');

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
