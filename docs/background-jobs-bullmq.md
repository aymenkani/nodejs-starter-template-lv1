# Background Jobs with BullMQ

This template integrates [BullMQ](https://docs.bullmq.io/) for handling background jobs and asynchronous tasks. BullMQ is a fast, robust, and Redis-backed queueing system that allows you to offload time-consuming operations from your main application thread, improving responsiveness and scalability.

## Why Use Background Jobs?

Background jobs are essential for:

*   **Improving User Experience:** Offload long-running tasks (e.g., sending emails, processing images, generating reports) so that API requests can return quickly.
*   **Scalability:** Distribute workloads across multiple worker processes or servers.
*   **Reliability:** Ensure tasks are processed even if the main application crashes, with features like retries and persistent queues.
*   **Decoupling:** Separate concerns by allowing different parts of your application to communicate asynchronously.

## 1. Queue Setup (`src/jobs/queue.ts`)

The `src/jobs/queue.ts` file is responsible for defining and initializing your BullMQ queues. Each queue is typically used for a specific type of task.

**Location:** `src/jobs/queue.ts`

**Implementation Details:**

*   **Redis Connection:** BullMQ requires a Redis connection. The connection details are usually pulled from environment variables.
*   **Queue Instances:** Each `Queue` instance represents a distinct queue where jobs are added.

**Example (`src/jobs/queue.ts`):**

```typescript
import { Queue } from 'bullmq';
import config from '../config/config'; // Assuming config has Redis connection details

// Redis connection options
const connection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
};

// Define your queues
export const emailQueue = new Queue('emailQueue', { connection });
export const notificationQueue = new Queue('notificationQueue', { connection });

// Add more queues as needed
```

### Configuration

Relevant [environment variables](./core-concepts.md#8-configuration-management) in your `.env` file for Redis:

*   `REDIS_HOST`: Redis server host (e.g., `localhost`, `redis`).
*   `REDIS_PORT`: Redis server port (e.g., `6379`).
*   `REDIS_PASSWORD`: Redis server password (if any).

## 2. Workers (`src/jobs/worker.ts`)

Workers are processes that listen to queues and execute the jobs they receive. You can have multiple workers processing jobs from the same queue, allowing for parallel processing.

**Location:** `src/jobs/worker.ts`

**Implementation Details:**

*   **`Worker` Instance:** A `Worker` instance is created for each queue you want to process.
*   **Job Processor:** The worker defines a processor function that contains the logic to execute for each job. This function receives the `job` object as an argument.
*   **Concurrency:** You can configure the `concurrency` option for a worker to specify how many jobs it can process simultaneously.

**Example (`src/jobs/worker.ts`):**

```typescript
import { Worker } from 'bullmq';
import config from '../config/config';
import logger from '../utils/logger';
import { emailService } from '../services'; // Assuming an email service

const connection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
};

// Worker for the emailQueue
export const emailWorker = new Worker(
  'emailQueue',
  async (job) => {
    logger.info(`Processing email job ${job.id}: ${job.name}`);
    const { to, subject, text, html } = job.data;
    await emailService.sendEmail(to, subject, text, html);
    logger.info(`Email job ${job.id} completed.`);
  },
  { connection, concurrency: 5 } // Process up to 5 email jobs concurrently
);

// Worker for the notificationQueue
export const notificationWorker = new Worker(
  'notificationQueue',
  async (job) => {
    logger.info(`Processing notification job ${job.id}: ${job.name}`);
    // Logic to send notifications
    logger.info(`Notification job ${job.id} completed.`);
  },
  { connection, concurrency: 3 }
);

// Handle worker events (optional, but recommended for monitoring)
emailWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} in emailQueue has completed!`);
});

emailWorker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} in emailQueue has failed with error: ${err.message}`);
});

// Start all workers
export const startWorkers = () => {
  emailWorker; // Simply referencing them starts them
  notificationWorker;
  logger.info('BullMQ workers started.');
};
```

## 3. Adding Jobs to a Queue

Jobs are added to queues from your application's services or controllers whenever an asynchronous task needs to be performed.

**Example (from a service, e.g., `src/services/auth.service.ts`):**

```typescript
import { emailQueue } from '../jobs/queue';

// ... inside an async function, e.g., after user registration
await emailQueue.add('sendVerificationEmail', {
  to: user.email,
  subject: 'Verify Your Account',
  text: `Hi ${user.name}, please verify your account by clicking this link: ...`,
  html: `<p>Hi ${user.name}, please verify your account by clicking this link: ...</p>`,
});
```

### Job Options

When adding a job, you can provide various options:

*   `jobId`: A unique identifier for the job.
*   `delay`: Delay the job's execution by a specified number of milliseconds.
*   `attempts`: Number of times the job should be retried if it fails.
*   `backoff`: Strategy for retrying failed jobs (e.g., `fixed`, `exponential`).
*   `removeOnComplete`: Whether to remove the job from the queue upon successful completion.
*   `removeOnFail`: Whether to remove the job from the queue upon failure.

## 4. Monitoring BullMQ

BullMQ provides a UI called [Bull Dashboard](https://github.com/felixmosh/bull-board) (or similar tools) to monitor your queues, jobs, and workers. While not directly integrated into this template's Express app, you can easily set it up as a separate service or integrate it into an admin panel.

## 5. Running Workers

Workers are typically run as separate processes from your main API server. In a production environment, you might deploy them as separate Docker containers or processes.

For local development, you can start them alongside your API server or in a separate terminal. If you choose to run them within the same process for simplicity during local development, ensure `startWorkers()` is called in `src/server.ts`. However, for production, running workers in dedicated processes is highly recommended for better resource management and fault isolation.

By utilizing BullMQ, this template ensures that your application remains responsive and can handle complex asynchronous workflows efficiently.