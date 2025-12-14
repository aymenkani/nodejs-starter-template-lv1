# Testing

This template comes with a comprehensive testing setup using [Jest](https://jestjs.io/) and [Supertest](https://github.com/ladjs/supertest) to ensure code quality, reliability, and maintainability. It is configured for end-to-end API testing, with a focus on database interaction testing using Prisma.

## Why Testing?

*   **Reliability:** Ensures that your API endpoints work as expected and prevents regressions.
*   **Maintainability:** Well-tested code is easier to refactor and extend with confidence.
*   **Collaboration:** Provides a safety net for teams, allowing multiple developers to work on the codebase without breaking existing functionality.
*   **Documentation:** Tests serve as living documentation, demonstrating how the API is intended to be used.

## 1. Test Setup

The testing environment is configured to run the entire application, including the server and database connections, to simulate a real-world scenario.

*   **Test Runner:** Jest
*   **HTTP Requests:** Supertest is used to make requests to the running application.
*   **TypeScript Support:** `ts-jest` for transpiling TypeScript files.
*   **Database Testing:** The setup uses a dedicated test database and manages the schema with Prisma Migrate.

### Key Configuration Files

*   `jest.config.js`: The main Jest configuration file. It defines the test environment, setup files, and global setup/teardown scripts.
*   `tests/globalSetup.ts`: A crucial script that runs once before all test suites. It starts the Express server on a dedicated test port and initializes global variables for the server instance, Prisma client, and background jobs.
*   `tests/globalTeardown.ts`: Runs once after all tests are complete. It gracefully shuts down the server and other resources started in `globalSetup.ts`.
*   `tests/jest.setup.ts`: This file runs before each test file. It sets the `NODE_ENV` to `test`, loads environment variables from `.env.test`, and can be used for mocking modules.
*   `tests/prismaSetup.ts`: This file runs after `jest.setup.ts` but before the tests in a file. It ensures the test database schema is up-to-date by executing `prisma migrate deploy` and manages the Prisma Client connection.

## 2. Running Tests

You can run all tests or specific test suites using npm scripts.

**Note:** Make sure to have the test database running before running tests. You can start it with `npm run docker:postgres:up`.

### Run All Tests

```bash
npm run test
```
This command loads `.env.test` (connecting to the test DB) and runs all Jest tests found in the `tests/` directory.

### Run Tests in Watch Mode

```bash
npm run test -- --watch
```
This will run tests in an interactive watch mode, re-running tests when file changes are detected.

### Run Specific Test Files

To run tests only for a specific file:

```bash
npm run test -- tests/user.test.ts
```

### Run Tests by Name

To run tests that match a specific name or pattern within a file:

```bash
npm run test -- -t "should register a new user"
```

## 3. Writing Tests

Tests are located in the `tests/` directory. The convention is to create a `*.test.ts` file for each feature or route module.

### Integration Tests

Integration tests are the primary focus of this template. They test the full request-response cycle of your API endpoints, including database interactions.

**Example (Integration test for user registration - `tests/auth.test.ts`):**

```typescript
import supertest from 'supertest';
import { app } from '../src/server'; // The running Express app
import { prisma } from '../src/config/db'; // The Prisma client

describe('Auth Endpoints', () => {
  // Create an agent to make requests to the app
  const request = supertest(app);
  let userEmail: string;

  // Set up test-specific data before each test
  beforeEach(async () => {
    const uniqueUsername = `testuser_${Date.now()}`;
    userEmail = `${uniqueUsername}@example.com`;

    // Pre-register a user to test login, logout, etc.
    await request.post('/api/v1/auth/register').send({
      username: uniqueUsername,
      email: userEmail,
      password: 'password123',
    });
  });

  // Clean up the database after each test to ensure isolation
  afterEach(async () => {
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it('should register a new user with valid data', async () => {
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
    expect(res.body.user.email).toBe(uniqueUserEmail);
    expect(res.body).toHaveProperty('access'); // Check for access token
  });

  it('should login a user with correct credentials', async () => {
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
});
```

## 4. Database Testing Strategy

To ensure tests are reliable and independent, the state of the database must be managed carefully.

*   **Separate Test Database:** A separate database is essential. The connection string for this database should be set as `DATABASE_URL` in the `.env.test` file.
*   **Automatic Migrations:** The `tests/prismaSetup.ts` file automatically runs `npx prisma migrate deploy` before tests begin. This ensures your test database schema is always in sync with your Prisma schema.
*   **Data Cleanup:** Tests are responsible for cleaning up the data they create. The most common strategy is to use an `afterEach` hook to delete all records from the tables affected during the test. This isolates each test case.

    ```typescript
    // Example from auth.test.ts
    afterEach(async () => {
      // Delete records from tables modified in the tests
      await prisma.refreshToken.deleteMany({});
      await prisma.user.deleteMany({});
    });
    ```

This approach guarantees a clean slate for every test, preventing failures due to leftover data from previous tests.

## 5. Code Quality and Formatting

Beyond testing, this template includes scripts to ensure code quality and consistency.

*   `lint`: Scans your code with ESLint to catch syntax errors and bad patterns.
    ```bash
    npm run lint
    ```
*   `type-check`: Runs the TypeScript compiler (`tsc`) without emitting files. Useful to check for type errors without actually building.
    ```bash
    npm run type-check
    ```
*   `format`: Uses Prettier to automatically format your code to look consistent.
    ```bash
    npm run format
    ```

## 6. Troubleshooting

### Prisma-related Test Failures

Sometimes, `npm run test` might fail with an error related to the Prisma Client not being in sync with the schema (e.g., "The table `main.User` does not exist in the current database"). This can happen if you've made changes to your `schema.prisma` file.

To fix this, you need to regenerate the Prisma Client and apply migrations to your **local development database**. Ensure your database server (e.g., via Docker) is running, and then execute the following commands:

1.  **Generate Prisma Client:** This updates the client based on your schema.
    ```bash
    npm run prisma:generate
    ```

2.  **Run Development Migrations:** This applies any new migrations to your database.
    ```bash
    npm run prisma:migrate:dev
    ```

After completing these steps, the test setup script (`prismaSetup.ts`) will be able to correctly apply the migrations to the separate test database, and your tests should run successfully.
