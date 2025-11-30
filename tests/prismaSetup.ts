import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Apply Prisma migrations to ensure the database schema is up-to-date
  let testDatabaseUrl = process.env.DATABASE_URL;
  if (testDatabaseUrl && testDatabaseUrl.includes('db:5432')) {
    testDatabaseUrl = testDatabaseUrl.replace('db:5432', 'localhost:5432');
  }

  let testRedisHost = process.env.REDIS_HOST;
  if (testRedisHost === 'redis') {
    testRedisHost = 'localhost';
  }

  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: testDatabaseUrl,
      REDIS_HOST: testRedisHost,
    },
  });

  // Connect to the database
  await prisma.$connect();
});

afterAll(async () => {
  // Disconnect from the database
  await prisma.$disconnect();
});

export { prisma };
