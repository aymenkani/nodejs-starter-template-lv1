import request from 'supertest';
import { app } from '../src/server';
import { prisma } from '../src/config/db';
import { tokenService } from '../src/services';
import { User } from '@prisma/client';

describe('Token Routes', () => {
  let user: User;
  let refreshToken: string;

  beforeEach(async () => {
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});

    const uniqueUsername = `testuser_${Date.now()}`;
    user = await prisma.user.create({
      data: {
        email: `${uniqueUsername}@example.com`,
        password: 'password123',
        username: uniqueUsername,
      },
    });

    const tokens = await tokenService.generateAuthTokens(user);
    refreshToken = tokens.refresh.token;
  });

  afterAll(async () => {
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe('POST /api/v1/token/refresh', () => {
    it('should return a new access token if the refresh token is valid', async () => {
      const res = await request(app)
        .post('/api/v1/token/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('access');
      expect(res.body.access).toHaveProperty('token');
      expect(res.body.access).toHaveProperty('expires');
    });

    it('should return a 401 error if the refresh token is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/token/refresh')
        .set('Cookie', 'refreshToken=invalidtoken')
        .send();

      expect(res.status).toBe(401);
    });

    it('should return a 400 error if no refresh token is provided', async () => {
      const res = await request(app)
        .post('/api/v1/token/refresh')
        .send();

      expect(res.status).toBe(400);
    });
  });
});
