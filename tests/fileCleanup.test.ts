import { processFileCleanupJob } from '../src/jobs/fileCleanup.worker';
import { prisma } from '../src/config/db';
import { Job } from 'bullmq';

// Mock S3 Client
const mockSend = jest.fn();
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => ({
    send: mockSend,
  })),
  DeleteObjectCommand: jest.fn(),
}));

describe('File Cleanup Worker', () => {
  let userId: string;

  beforeAll(async () => {
    // Clean DB
    await prisma.file.deleteMany();
    await prisma.user.deleteMany();

    // Create User
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
    // prisma disconnect handled by setupAfterEnv
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
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
      },
    });

    // 2. Create Recent Pending File (should exist)
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

    // 3. Create Old Completed File (should exist)
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

    // Verify
    const files = await prisma.file.findMany();
    const ids = files.map((f) => f.id);
    expect(ids).not.toContain(oldFile.id);
    expect(ids).toContain(recentFile.id);
    expect(ids).toContain(completedFile.id);

    // Verify S3 Delete called once
    expect(mockSend).toHaveBeenCalledTimes(1);
  });
});
