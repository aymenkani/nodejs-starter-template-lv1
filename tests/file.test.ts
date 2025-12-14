import supertest from 'supertest';
import { app } from '../src/server';
import { prisma } from '../src/config/db';

// Mock auth middleware to return a specific user
jest.mock('../src/middleware/auth.middleware', () => ({
  auth: (req: any, res: any, next: any) => {
    // Current user will be set in individual tests by modifying this object if needed,
    // or by using a mutable implementation.
    // For simplicity, we'll assume a "test" user here and create it in beforeAll.
    req.user = { id: 'user-id', role: 'USER' };
    next();
  },
  authorize: () => (req: any, res: any, next: any) => next(),
}));

// Mock Upload/Ingestion Services to avoid side effects
jest.mock('../src/services', () => ({
  ...jest.requireActual('../src/services'),
  uploadService: {
    generateSignedUrl: jest.fn(),
    confirmUpload: jest.fn(),
  },
  ingestionService: {
    addIngestionJob: jest.fn(),
  },
}));

describe('File API', () => {
  let request: ReturnType<typeof supertest.agent>;
  let testUser: any;
  let adminUser: any;
  let publicFileId: string;
  let privateFileId: string;

  beforeAll(async () => {
    request = supertest.agent(app);

    // Create Test User
    testUser = await prisma.user.create({
      data: {
        email: 'test-file-user@example.com',
        password: 'password',
        username: 'testfileuser',
        role: 'USER',
        id: 'user-id', // Match key in mock
      },
    });

    // Create Admin User
    adminUser = await prisma.user.create({
      data: {
        email: 'admin-file-user@example.com',
        password: 'password',
        username: 'adminfileuser',
        role: 'ADMIN',
      },
    });

    // Create Public File (by Admin)
    const publicFile = await prisma.file.create({
      data: {
        fileKey: 'public-key',
        mimeType: 'text/plain',
        originalName: 'public.txt',
        userId: adminUser.id,
        isPublic: true,
        status: 'COMPLETED',
      },
    });
    publicFileId = publicFile.id;

    // Create Private File (by Test User)
    const privateFile = await prisma.file.create({
      data: {
        fileKey: 'private-key',
        mimeType: 'text/plain',
        originalName: 'private.txt',
        userId: testUser.id,
        isPublic: false,
        status: 'COMPLETED',
      },
    });
    privateFileId = privateFile.id;
  });

  afterAll(async () => {
    await prisma.file.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('GET /api/v1/files', () => {
    it('should return all files (mine + public) by default', async () => {
      const res = await request.get('/api/v1/files');
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
      const ids = res.body.map((f: any) => f.id);
      expect(ids).toContain(publicFileId);
      expect(ids).toContain(privateFileId);
    });

    it('should return only my files when filter=mine', async () => {
      const res = await request.get('/api/v1/files?filter=mine');
      expect(res.status).toBe(200);
      const ids = res.body.map((f: any) => f.id);
      expect(ids).toContain(privateFileId);
      expect(ids).not.toContain(publicFileId);
    });

    it('should return only public files when filter=public', async () => {
      const res = await request.get('/api/v1/files?filter=public');
      expect(res.status).toBe(200);
      const ids = res.body.map((f: any) => f.id);
      expect(ids).toContain(publicFileId);
      expect(ids).not.toContain(privateFileId);
    });

    it('should mask admin email in public files', async () => {
      const res = await request.get('/api/v1/files?filter=public');
      const publicFile = res.body.find((f: any) => f.id === publicFileId);
      expect(publicFile.user.email).toBe('Admin');
      expect(publicFile.user.role).toBe('ADMIN');
    });
  });
});
