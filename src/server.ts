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
import { startTokenCleanupJob } from './utils/tokenCleanup';
import { processTokenCleanupJob } from './jobs/worker';
import { tokenCleanupQueueName } from './jobs/queue';
import { prisma } from './config/db';
import { PrismaClient } from '@prisma/client/extension';
import { socketService } from './services/socket.service';

const config = getConfig(process.env);

const app: Express = express();
app.use(passport.initialize());

app.use((req: Request, res: Response, next: NextFunction) => {
  next();
});

app.use(helmet());
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

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: { docExpansion: 'none', defaultModelsExpandDepth: 2 },
  }),
);

// Health check route for deployment services like Render
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

app.use('/api/v1', apiRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('API is running...');
});

app.use(errorConverter);
app.use(errorHandler);

async function startServer(port?: number) {
  await connectDB();

  // Create new instances of Queue and Worker inside startServer
  const tokenCleanupQueue = new Queue(tokenCleanupQueueName, {
    connection: {
      host: config.redis.host,
      port: config.redis.port,
    },
  });
  const tokenCleanupWorker = new Worker(tokenCleanupQueueName, processTokenCleanupJob, {
    connection: {
      host: config.redis.host,
      port: config.redis.port,
    },
  });

  const cronJob = startTokenCleanupJob(tokenCleanupQueue);

  const server: Server = app.listen(port || config.port, () =>
    logger.info(`Server running on port ${port || config.port}`),
  );

  // Initialize Socket.IO service
  socketService.init(server);

  return { app, server, prisma, cronJob, tokenCleanupWorker, tokenCleanupQueue };
}

async function stopServer(
  server: Server,
  prisma: PrismaClient,
  cronJob: ScheduledTask,
  worker: Worker,
  queue: Queue,
) {
  logger.info('Attempting to stop server...');

  // Gracefully close Socket.IO server
  const io = socketService.getIO();
  if (io) {
    io.close(() => {
      logger.info('Socket.IO server closed.');
    });
  }

  await new Promise((resolve) =>
    server.close(() => {
      logger.info('HTTP server closed.');
      resolve(null);
    }),
  );
  logger.info('Attempting to disconnect Prisma...');
  await prisma.$disconnect();
  logger.info('Prisma disconnected.');
  logger.info('Attempting to stop cron job...');
  cronJob.stop(); // Stop the cron job
  logger.info('Cron job stopped.');
  logger.info('Attempting to close token cleanup worker...');
  await worker.close(); // Close the BullMQ worker
  logger.info('Token cleanup worker closed.');
  logger.info('Attempting to close token cleanup queue...');
  await queue.close(); // Close the BullMQ queue
  logger.info('Token cleanup queue closed.');
  logger.info('Server shutdown complete.');
}

if (require.main === module) {
  startServer();
}

export { startServer, stopServer, app };
