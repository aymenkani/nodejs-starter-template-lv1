// Define mockSend strictly before imports/mocks
const mockS3Send = jest.fn();

jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn(() => ({
      send: mockS3Send,
    })),
    GetObjectCommand: jest.fn(),
    DeleteObjectCommand: jest.fn(),
  };
});

import { processJob } from '../src/jobs/ingestion.worker';
import { prisma } from '../src/config/db';
import { generateText, embed } from 'ai';
import { google } from '@ai-sdk/google';

// Mocks
jest.mock('../src/config/db', () => ({
  prisma: {
    file: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    $executeRaw: jest.fn(),
  },
}));

jest.mock('ai');
jest.mock('@ai-sdk/google', () => {
  const googleFn = jest.fn().mockReturnValue('mock-model');
  (googleFn as any).textEmbeddingModel = jest.fn().mockReturnValue('mock-embedding-model');
  return { google: googleFn };
});
jest.mock('@langchain/textsplitters', () => ({
  RecursiveCharacterTextSplitter: jest.fn().mockImplementation(() => ({
    createDocuments: jest.fn().mockResolvedValue([{ pageContent: 'chunk1', metadata: {} }]),
  })),
}));
jest.mock('unpdf');

describe('Ingestion Worker', () => {
  // ... rest of test
  const mockJob = {
    id: 'job-1',
    data: { fileId: 'file-1' },
  } as any;

  const mockFileRecord = {
    id: 'file-1',
    fileKey: 'uploads/user-1/image.png',
    userId: 'user-1',
    mimeType: 'image/png',
    originalName: 'image.png',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.file.findUnique as jest.Mock).mockResolvedValue(mockFileRecord);
    (prisma.file.findFirst as jest.Mock).mockResolvedValue(null); // No duplicate
    
    // Mock S3 send
    mockS3Send.mockResolvedValue({
      Body: {
        transformToByteArray: jest.fn().mockResolvedValue(new Uint8Array(Buffer.from('fake-image-data'))),
      },
    });

    // Mock AI
    (generateText as jest.Mock).mockResolvedValue({ text: 'This is a description of the image.' });
    (embed as jest.Mock).mockResolvedValue({ embedding: [0.1, 0.2, 0.3] });
  });

  it('should process image files using generateText', async () => {
    await processJob(mockJob);

    // Verify File fetch
    expect(prisma.file.findUnique).toHaveBeenCalledWith({ where: { id: 'file-1' } });
    
    // Verify status update to PROCESSING
    expect(prisma.file.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'file-1' },
      data: { status: 'PROCESSING' },
    }));

    // Verify generateText called for image
    expect(generateText).toHaveBeenCalledWith(expect.objectContaining({
      model: 'mock-model',
      messages: expect.arrayContaining([
        expect.objectContaining({
          role: 'user',
          content: expect.arrayContaining([
            expect.objectContaining({ type: 'text' }),
            expect.objectContaining({ type: 'image' }),
          ]),
        }),
      ]),
    }));

    // Verify Embedding
    expect(embed).toHaveBeenCalled();

    // Verify DB Insertion
    expect(prisma.$executeRaw).toHaveBeenCalled();

    // Verify status update to COMPLETED
    expect(prisma.file.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'file-1' },
      data: { status: 'COMPLETED' },
    }));
  });
});
