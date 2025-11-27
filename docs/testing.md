# Testing

This template comes with a comprehensive testing setup using [Jest](https://jestjs.io/) to ensure code quality, reliability, and maintainability. It includes configurations for both unit and integration tests, with a focus on database interaction testing using Prisma.

## Why Testing?

*   **Reliability:** Ensures that your code works as expected and prevents regressions when changes are introduced.
*   **Maintainability:** Well-tested code is easier to refactor and extend with confidence.
*   **Collaboration:** Provides a safety net for teams, allowing multiple developers to work on the codebase without breaking existing functionality.
*   **Documentation:** Tests can serve as living documentation, demonstrating how different parts of the application are intended to be used.

## 1. Test Setup

The testing environment is configured with Jest and integrates with TypeScript and Prisma.

*   **Test Runner:** Jest
*   **TypeScript Support:** `ts-jest` for transpiling TypeScript files during tests.
*   **Database Testing:** Custom setup to manage Prisma Client and database state for tests.

### Key Configuration Files

*   `jest.config.js`: The main Jest configuration file. It defines test patterns, transformations, environment, and setup files.
*   `tests/jest.setup.ts`: Runs before all tests, typically for global setups like initializing the Prisma Client or setting up environment variables.
*   `tests/globalSetup.ts`: A global setup file that runs once before all test suites, useful for tasks like starting test databases.
*   `tests/globalTeardown.ts`: A global teardown file that runs once after all test suites, used for cleaning up resources (e.g., stopping test databases).
*   `tests/prismaSetup.ts`: Contains utilities for managing Prisma Client instances and cleaning the database between tests.

## 2. Running Tests

You can run all tests or specific test suites using npm/yarn scripts.

### Run All Tests

```bash
npm run test
# or
yarn test
```
This command will execute all test files (`.test.ts` or `.spec.ts`) found in the `tests/` directory and its subdirectories.

### Run Tests in Watch Mode

```bash
npm run test -- --watch
# or
yarn test -- --watch
```
This will run tests in an interactive watch mode, re-running tests when file changes are detected.

### Run Specific Test Files

To run tests only for a specific file or pattern:

```bash
npm run test -- tests/user.test.ts
# or
yarn test -- tests/auth.test.ts
```

### Run Tests by Name

To run tests that match a specific name or pattern:

```bash
npm run test -- -t "should register a new user"
# or
yarn test -- -t "user service"
```

## 3. Writing Tests

Tests are typically organized in the `tests/` directory, mirroring the structure of the `src/` directory.

### Unit Tests

Unit tests focus on testing individual functions, classes, or modules in isolation.

**Example (Unit test for a utility function - `tests/utils/some-util.test.ts`):**

```typescript
// src/utils/some-util.ts
export const add = (a: number, b: number) => a + b;

// tests/utils/some-util.test.ts
import { add } from '../../src/utils/some-util';

describe('add', () => {
  it('should add two numbers correctly', () => {
    expect(add(1, 2)).toBe(3);
    expect(add(-1, 1)).toBe(0);
    expect(add(0, 0)).toBe(0);
  });
});
```

### Integration Tests

Integration tests verify the interaction between different components (e.g., routes, controllers, services, and the database). They often involve making actual HTTP requests to your API.

**Example (Integration test for user registration - `tests/auth.test.ts`):**

```typescript
import request from 'supertest';
import httpStatus from 'http-status';
import app from '../src/server'; // Your Express app instance
import { prisma } from '../src/config/db'; // Your Prisma client instance
import { setupTestDB } from './prismaSetup'; // Utility to clean DB

setupTestDB(); // Cleans and resets the database before each test suite

describe('Auth routes', () => {
  let newUser: any;

  beforeEach(() => {
    newUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };
  });

  describe('POST /v1/auth/register', () => {
    it('should return 201 and successfully register user if data is ok', async () => {
      const res = await request(app)
        .post('/v1/auth/register')
        .send(newUser)
        .expect(httpStatus.CREATED);

      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toEqual(newUser.email);
      expect(res.body.tokens).toBeDefined();

      const dbUser = await prisma.user.findUnique({ where: { email: newUser.email } });
      expect(dbUser).toBeDefined();
      expect(dbUser?.email).toEqual(newUser.email);
    });

    it('should return 400 if email is already taken', async () => {
      await prisma.user.create({ data: newUser }); // Create user first

      await request(app)
        .post('/v1/auth/register')
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  // ... other auth tests (login, logout, refresh token, etc.)
});
```

## 4. Database Testing Strategy (`tests/prismaSetup.ts`)

Testing with a database requires careful management of the database state to ensure tests are isolated and repeatable.

*   **`setupTestDB()`:** This utility (defined in `tests/prismaSetup.ts`) is typically called in a `beforeAll` or `beforeEach` hook in your test files. Its purpose is to:
    *   Connect to a dedicated test database (defined by `TEST_DATABASE_URL` in your [Configuration Management](./core-concepts.md#8-configuration-management) settings).
    *   Clear all data from the database before each test or test suite.
    *   Optionally, re-run migrations to ensure the schema is up-to-date.
*   **Separate Test Database:** It's highly recommended to use a separate database for testing to avoid data corruption in your development or production databases. Configure `DATABASE_URL` in `.env.test` to point to this test database.

By following these testing guidelines, you can build confidence in your application's functionality and ensure a stable development process.