import supertest from 'supertest';
import { app } from '../src/server'; // Assuming app is exported from server.ts
import { prisma } from '../src/config/db'; // Assuming prisma is exported from config/db.ts

describe('Auth Endpoints', () => {
  let request: ReturnType<typeof supertest.agent>;
  let userEmail: string;
  let testUser: any; // Define a more specific type if available

  beforeEach(async () => {
    request = supertest.agent(app);
    const uniqueUsername = `testuser_${Date.now()}`;
    userEmail = `${uniqueUsername}@example.com`;

    const registerRes = await request
      .post('/api/v1/auth/register')
      .send({
        username: uniqueUsername,
        email: userEmail,
        password: 'password123',
      });
    testUser = registerRes.body.user;
  });

  afterEach(async () => {
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it('should register a new user', async () => {
    const uniqueUserEmail = `register-${Date.now()}@example.com`;
    const res = await request
      .post('/api/v1/auth/register')
      .send({
        username: 'newuser',
        email: uniqueUserEmail,
        password: 'password123',
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('access');
  });

  it('should return 400 if registration password is too short', async () => {
    const uniqueUserEmail = `register-fail-${Date.now()}@example.com`;
    const res = await request
      .post('/api/v1/auth/register')
      .send({
        username: 'newuser',
        email: uniqueUserEmail,
        password: 'pass',
      });
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toContain('body.password: Password must be at least 8 characters');
  });

  it('should login a user', async () => {
    const loginRes = await request
      .post('/api/v1/auth/login')
      .send({
        email: userEmail,
        password: 'password123',
      });
    expect(loginRes.statusCode).toEqual(200);
    expect(loginRes.body).toHaveProperty('user');
    expect(loginRes.body).toHaveProperty('access');
  });

  it('should return 401 for login with wrong password', async () => {
    const loginRes = await request
      .post('/api/v1/auth/login')
      .send({
        email: userEmail,
        password: 'wrongpassword',
      });
    expect(loginRes.statusCode).toEqual(401);
  });

  it('should return 401 for login with non-existent email', async () => {
    const loginRes = await request
      .post('/api/v1/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });
    expect(loginRes.statusCode).toEqual(401);
  });

  it('should logout a user', async () => {
    const loginRes = await request
      .post('/api/v1/auth/login')
      .send({
        email: userEmail,
        password: 'password123',
      });
    const setCookieHeader = loginRes.headers['set-cookie'];
    const accessToken = loginRes.body.access.token;
    const refreshTokenCookie = Array.isArray(setCookieHeader) ? setCookieHeader.find((cookie: string) => cookie.startsWith('refreshToken=')) : undefined;
    const refreshToken = refreshTokenCookie ? refreshTokenCookie.split(';')[0].split('refreshToken=')[1] : '';
    const res = await request
      .post('/api/v1/auth/logout')
      .set('Cookie', `refreshToken=${refreshToken}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toEqual(204);

    const deletedToken = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    expect(deletedToken).toBeNull();
  });

  it('should refresh an auth token', async () => {
    const loginRes = await request
      .post('/api/v1/auth/login')
      .send({
        email: userEmail,
        password: 'password123',
      });
    const setCookieHeader = loginRes.headers['set-cookie'];
    const refreshTokenCookie = Array.isArray(setCookieHeader) ? setCookieHeader.find((cookie: string) => cookie.startsWith('refreshToken=')) : undefined;
    const refreshToken = refreshTokenCookie ? refreshTokenCookie.split(';')[0].split('refreshToken=')[1] : '';

    const res = await request.post('/api/v1/token/refresh').set('Cookie', `refreshToken=${refreshToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('access');
    expect(res.body.access).toHaveProperty('token');
  });
});
