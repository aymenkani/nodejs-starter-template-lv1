import { processFileCleanupJob } from '../src/jobs/fileCleanup.worker';
import { prisma } from '../src/config/db';
import { Job } from 'bullmq';
// 1. Import the module so we can access the mock later
import { S3Client } from '@aws-sdk/client-s3';

// 2. Mock S3 - Define the 'send' function INSIDE the factory
// We don't use an external variable to avoid the ReferenceError
jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn(() => ({
      send: jest.fn(), // Created directly here
    })),
    DeleteObjectCommand: jest.fn(),
  };
});

describe('File Cleanup Worker', () => {
  let userId: string;

  beforeAll(async () => {
    await prisma.file.deleteMany();
    await prisma.user.deleteMany();
    
    const user = await prisma.user.create({
      data: {
        email: 'cleanup-test@example.com',
        username: 'cleanuptest',
        password: 'password',
        role: 'USER',
      },
    });
    userId = user.id;
  });

  afterEach(async () => {
    await prisma.file.deleteMany();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
  });

  it('should delete pending files older than 24 hours', async () => {
    // 1. Create Old Pending File (should be deleted)
    const oldFile = await prisma.file.create({
      data: {
        fileKey: 'old-pending',
        mimeType: 'text/plain',
        originalName: 'old.txt',
        status: 'PENDING',
        userId: userId,
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000), 
      },
    });

    // 2. Create Recent Pending File
    const recentFile = await prisma.file.create({
      data: {
        fileKey: 'recent-pending',
        mimeType: 'text/plain',
        originalName: 'recent.txt',
        status: 'PENDING',
        userId: userId,
        createdAt: new Date(),
      },
    });

    // 3. Create Old Completed File
    const completedFile = await prisma.file.create({
      data: {
        fileKey: 'old-completed',
        mimeType: 'text/plain',
        originalName: 'completed.txt',
        status: 'COMPLETED',
        userId: userId,
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
      },
    });

    // Run Worker
    const job = { id: '1', name: 'cleanAbandonedFiles' } as Job;
    const result = await processFileCleanupJob(job);

    expect(result?.cleanedCount).toBe(1);

    // Verify DB
    const files = await prisma.file.findMany();
    const ids = files.map((f) => f.id);
    expect(ids).not.toContain(oldFile.id);
    expect(ids).toContain(recentFile.id);
    expect(ids).toContain(completedFile.id);

    // 3. Access the Mock Instance to Check Calls
    // Since we can't use 'mockSend' directly, we grab the instance Jest created
    const MockS3Client = S3Client as unknown as jest.Mock;
    
    // Get the instance of S3Client that was created inside the worker
    const s3Instance = MockS3Client.mock.results[0].value;
    
    // Check if the 'send' method on that instance was called
    expect(s3Instance.send).toHaveBeenCalledTimes(1);
  });
});