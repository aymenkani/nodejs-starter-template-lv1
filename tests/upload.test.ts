import supertest from 'supertest';
import { app } from '../src/server';
import { prisma } from '../src/config/db';

describe('Upload API', () => {
  let request: ReturnType<typeof supertest.agent>;
  let accessToken: string;
  let userEmail: string;
  let testUser: any;

  beforeAll(async () => {
    request = supertest.agent(app);
    const uniqueUsername = `testuser_upload_${Date.now()}`;
    userEmail = `${uniqueUsername}@example.com`;

    await request
      .post('/api/v1/auth/register')
      .send({
        username: uniqueUsername,
        email: userEmail,
        password: 'password123',
      });

    const loginRes = await request
      .post('/api/v1/auth/login')
      .send({
        email: userEmail,
        password: 'password123',
      });
    accessToken = loginRes.body.access.token;
    testUser = loginRes.body.user;
  });

  afterAll(async () => {
    await prisma.refreshToken.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
  });

  // Server setup and teardown are handled globally by globalSetup.ts and globalTeardown.ts

  describe('POST /api/upload/generate-signed-url', () => {
    it('should return a signed URL', async () => {
      const res = await request
        .post('/api/v1/upload/generate-signed-url')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          fileName: 'test.jpg',
          fileType: 'image/jpeg',
          fileSize: 1024,
        });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('signedUrl');
    });
  });
})
