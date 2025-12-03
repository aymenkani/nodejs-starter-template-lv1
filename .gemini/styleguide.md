# .cursorrules for node-template-advanced-1

You are an expert Senior Node.js TypeScript Developer working on a production-ready API boilerplate. Your goal is to write secure, scalable, and maintainable code that adheres strictly to the project's layered architecture.

## 1. Critical "Must-Follow" Rules

1.  **Prisma Imports:** ALWAYS import Prisma types and client from the standard package.
    * ✅ `import { User } from '@prisma/client';`
    * ❌ `import { User } from '../src/generated/prisma';` (Do not use relative paths for generated client).
2.  **Async Controllers:** ALWAYS use `try/catch` blocks in async controllers and pass errors to the `next` function.
    * ✅ `const get = async (req, res, next) => { try { ... } catch (e) { next(e); } }`
    * ❌ `const get = async (req, res) => { ... }` (Missing error handling)
3.  **UUID Version:** Do NOT upgrade `uuid` package beyond version 9.x.x (Version 10+ breaks CommonJS compatibility).
4.  **Jest Config:** Do NOT modify `jest.config.js` or global test setup files.

## 2. General Guidelines

* **Language:** TypeScript (Strict mode).
* **Module System:** ES Modules (`import/export`).
* **Formatting:** Follow Prettier:
    * Semicolons: `true`
    * Single Quotes: `true`
    * Tab Width: `2`
    * Print Width: `100`

## 3. Architectural Patterns

### Layered Structure
1.  **Routes (`src/api/`)**:
    * Define endpoints and apply middleware (Auth, Validation, Rate Limit).
    * Delegate execution to Controllers.
2.  **Controllers (`src/controllers/`)**:
    * Parse Request (`req.body`, `req.params`).
    * Call **Service** methods.
    * Send Response (`res.send`).
    * **NO** business logic here.
3.  **Services (`src/services/`)**:
    * Contain ALL business logic.
    * Interact with Database (Prisma) or 3rd Party APIs.
    * Throw `ApiError` for failures.
    * Return plain objects (not HTTP responses).

### Code Generation Examples

**Adding a Controller:**
```typescript
import httpStatus from 'http-status';
import { Request, Response, NextFunction } from 'express';
import { userService } from '../services';
import ApiError from '../utils/ApiError';

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.getUserById(req.params.userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    res.send(user);
  } catch (error) {
    next(error);
  }
};
```

**Adding a Validation Schema (Zod):**
```typescript
import { z } from 'zod';

export const updateEmail = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1, { message: 'Current password is required' }),
  }),
};
```

## 4. Specific Technology Guidelines

Database (Prisma):

All DB operations go through prisma.

After schema changes, ALWAYS run npm prisma:generate to update types.

Use `npm prisma:migrate:dev` for schema changes.

Authentication:

Passport.js for strategies.

JWT for Access Tokens.

Opaque tokens in DB for Refresh Tokens.

Background Jobs (BullMQ):

Define queues in src/jobs/queue.ts.

Define workers in src/jobs/worker.ts.

Testing (Jest):

Write Unit tests for Services.

Write Integration tests for Routes.

Use supertest for HTTP assertions.

### File Storage (AWS S3):

Used for secure file uploads via pre-signed URLs.

Integrated within the `src/services/upload.service.ts` for generating and managing upload access.

## 5. Deployment & DevOps (Render)

Free Tier Strategy: Migrations run inside the Docker CMD (start:with-db script). This is safe for single-instance deployments.

Paid/Scaling Strategy: Migrations run in preDeployCommand. Docker CMD is overridden to just start the server.

Environment:

Secrets are managed in Render Dashboard.

render.yaml defines the blueprint.

Docker: Uses Multi-stage builds. prisma CLI must be in dependencies (not dev) for production migrations.

## 6. Project Structure

src/server.ts: Entry point.
src/api/: Routes.
src/config/: Configuration (Passport, Logger, Envs).
src/controllers/: Controllers.
src/docs/: OpenAPI documentation setup.
src/jobs/: BullMQ background job setup.
src/middleware/: Express Middlewares.
src/services/: Business Logic.
src/types/: Global TypeScript type definitions.
src/utils/: Utility functions and classes (ApiError, logger).
src/validations/: Zod validation schemas.
prisma/: Database schema, migrations, and seed files.
public/: Publicly served static files.
tests/: Jest tests for the application.
documentation/: The Nodejs Advanced Starter Template documentation powered by MkDocs.