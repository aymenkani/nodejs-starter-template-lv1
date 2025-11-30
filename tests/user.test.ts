import supertest from 'supertest';
import { app } from '../src/server';
import { prisma } from '../src/config/db';
import { userService } from '../src/services';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

describe('User Endpoints & Protected Routes', () => {
  let token: string;
  let adminToken: string;

  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);

    await Promise.all([
      prisma.user.create({
        data: { username: 'testuser', email: 'test@example.com', password: hashedPassword, role: Role.USER },
      }),
      prisma.user.create({
        data: { username: 'adminuser', email: 'admin@example.com', password: hashedPassword, role: Role.ADMIN },
      }),
    ]);

    // Log in both users to get tokens
    const [loginRes, adminLoginRes] = await Promise.all([
      supertest(app).post('/api/v1/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      }),
      supertest(app).post('/api/v1/auth/login').send({
        email: 'admin@example.com',
        password: 'password123',
      }),
    ]);

    token = loginRes.body.access.token;
    adminToken = adminLoginRes.body.access.token;
  });

  afterEach(async () => {
    await prisma.user.deleteMany();
    await prisma.refreshToken.deleteMany();
  });

  it('should not allow access to protected route without a token', async () => {
    const res = await supertest(app).get('/api/v1/users/profile');
    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe('Not authorized, no token');
  });

  it('should not allow access to protected route with an invalid token', async () => {
    const res = await supertest(app)
      .get('/api/v1/users/profile')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe('Not authorized, token failed');
  });

  it('should allow access to protected route with a valid token', async () => {
    const res = await supertest(app).get('/api/v1/users/profile').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.email).toBe('test@example.com');
  });

  it('should return 401 if user profile is not found', async () => {
    jest.spyOn(userService, 'getUserById').mockResolvedValue(null);
    const res = await supertest(app).get('/api/v1/users/profile').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe('User not found');
  });

  describe('Admin Routes', () => {
    it('should not allow a regular user to access an admin route', async () => {
      const res = await supertest(app).get('/api/v1/admin/users').set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toBe('User is not authorized to access this route');
    });

    it('should allow an admin to access an admin route', async () => {
      const res = await supertest(app).get('/api/v1/admin/users').set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
    });
  });

  describe('Admin User Management', () => {
    let testUserId: string;

    beforeEach(async () => {
      const user = await prisma.user.findFirst({ where: { email: 'test@example.com' } });
      if (user) {
        testUserId = user.id;
      }
    });

    it('should allow an admin to update a user', async () => {
      const res = await supertest(app)
        .put(`/api/v1/admin/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ username: 'updateduser' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.username).toBe('updateduser');
    });

    it('should not allow a regular user to update another user', async () => {
      const res = await supertest(app)
        .put(`/api/v1/admin/users/${testUserId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ username: 'updateduser' });

      expect(res.statusCode).toEqual(403);
    });

    it('should allow an admin to delete a user', async () => {
      const res = await supertest(app)
        .delete(`/api/v1/admin/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(204);

      const deletedUser = await prisma.user.findUnique({ where: { id: testUserId } });
      expect(deletedUser).toBeNull();
    });

    it('should not allow a regular user to delete another user', async () => {
      const res = await supertest(app)
        .delete(`/api/v1/admin/users/${testUserId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(403);
    });
  });

  describe('Update User Profile', () => {
    it('should successfully update user email', async () => {
      const newEmail = 'newtest@example.com';
      const res = await supertest(app)
        .put('/api/v1/users/profile/email')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: newEmail, password: 'password123' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(newEmail);

      const updatedUser = await userService.getUserById(res.body.data.id);
      expect(updatedUser?.email).toBe(newEmail);
    });


    it('should return 400 if invalid email is provided', async () => {
      const res = await supertest(app)
        .put('/api/v1/users/profile/email')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'invalid-email', password: 'password123' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('Invalid email address');
    });

    it('should return 401 if not authenticated', async () => {
      const res = await supertest(app)
        .put('/api/v1/users/profile')
        .send({ email: 'unauthenticated@example.com' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Not authorized, no token');
    });

    it('should return 400 if no update data is provided', async () => {
      const res = await supertest(app)
        .put('/api/v1/users/profile/email')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('body.email: Invalid email address');
      expect(res.body.message).toContain('body.password: Invalid input: expected string, received undefined');
    });
  });
});

describe('User Service', () => {
  let userId: string;

  afterEach(async () => {
    await prisma.user.deleteMany();
    await prisma.refreshToken.deleteMany();
  });

  beforeEach(async () => {
    const user = await userService.createUser({ username: `testuser-${Date.now()}`, email: `test-${Date.now()}@example.com`, password: 'password123' });
    userId = user.id;
  });

  it('should get a user by id', async () => {
    const foundUser = await userService.getUserById(userId);
    expect(foundUser?.id).toBe(userId); // Use optional chaining as foundUser can be null
  });

  it('should create a user', async () => {
    const newUser = {
      username: 'newuser',
      email: `new-${Date.now()}@example.com`,
      password: 'password123',
    };
    const createdUser = await userService.createUser(newUser);
    expect(createdUser.username).toBe(newUser.username);
    expect(createdUser.email).toBe(newUser.email);
  });

  it('should get a user by email', async () => {
    const user = await userService.createUser({ username: `testuser-email-${Date.now()}`, email: `test-email-${Date.now()}@example.com`, password: 'password123' });
    const foundUser = await userService.getUserByEmail(user.email);
    expect(foundUser?.email).toBe(user.email); // Use optional chaining as foundUser can be null
  });
});
