# Core Concepts

This section delves into the fundamental architectural patterns and key functionalities implemented in this Node.js template. Understanding these core concepts will enable you to effectively extend, modify, and maintain the application.

## 1. API Routing

The application uses Express.js for routing, with routes organized modularly by resource.

*   **Location:** `src/api/`
*   **Purpose:** Defines the API endpoints, HTTP methods, and links them to corresponding [controller functions](#2-controllers).
*   **Structure:** Each major resource (e.g., `auth`, `user`, `admin`) has its own route file (e.g., `auth.routes.ts`, `user.routes.ts`). The `src/api/index.ts` file aggregates all these individual route modules.

**Example (`src/api/user.routes.ts`):**

```typescript
import { Router } from 'express';
import { userController } from '../controllers';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { userValidation } from '../validations';

const router = Router();

router.get(
  '/',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin']),
  userController.getUsers
);
router.get(
  '/:userId',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin', 'user']),
  validate(userValidation.getUserById),
  userController.getUserById
);
// ... other user routes
```

## 2. Controllers

Controllers are responsible for handling incoming HTTP requests, processing input, and sending back appropriate HTTP responses. They act as the interface between the routes and the business logic ([services](#3-services)).

*   **Location:** `src/controllers/`
*   **Purpose:**
*   Extract request data (params, query, body).
*   Call appropriate service methods.
*   Format the response data.
*   Handle errors and send standardized error responses.
*   **Principle:** Keep controllers thin. They should delegate complex business logic to services.

**Example (`src/controllers/user.controller.ts`):**

```typescript
import { Request, Response, NextFunction } from 'express';
import { userService } from '../services';
import { ApiError } from '../utils/ApiError';
import httpStatus from 'http-status';

const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await userService.getAllUsers();
    res.status(httpStatus.OK).send(users);
  } catch (error) {
    next(error); // Pass error to error handling middleware
  }
};

const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.getUserById(req.params.userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    res.status(httpStatus.OK).send(user);
  } catch (error) {
    next(error);
  }
};
// ... other controller methods
```

## 3. Services

Services encapsulate the application's business logic. They interact with data sources (like the database via [Prisma](./database-prisma.md)), external APIs (e.g., AWS S3 for file storage), and other services to perform specific operations.

*   **Location:** `src/services/`
*   **Purpose:**
*   Contain reusable business logic.
*   Interact with the database ([Prisma Client](./database-prisma.md#5-interacting-with-prisma-client)).
*   Perform data transformations.
*   Handle complex operations that might involve multiple data models or external integrations.
*   **Principle:** Services should be independent of the HTTP request/response cycle.

**Example (`src/services/user.service.ts`):**

```typescript
import { PrismaClient } from '@prisma/client';
import { ApiError } from '../utils/ApiError'; // Used in createUser example
import httpStatus from 'http-status';

const prisma = new PrismaClient();

const getAllUsers = async () => {
  return prisma.user.findMany();
};

const getUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
  });
};

const createUser = async (userData: { email: string; password?: string; name: string }) => {
  // Assuming isEmailTaken is a custom method added to Prisma.User
  // For a real implementation, you'd query for the email first.
  const existingUser = await prisma.user.findUnique({ where: { email: userData.email } });
  if (existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  return prisma.user.create({
    data: userData,
  });
};
// ... other service methods
```

## 4. Middleware

Middleware functions are functions that have access to the request object (`req`), the response object (`res`), and the next middleware function in the application’s request-response cycle. They can perform tasks like logging, [authentication](./authentication.md), [data validation](./core-concepts.md#5-validation), and [error handling](./core-concepts.md#6-error-handling).

*   **Location:** `src/middleware/`
*   **Key Middleware:**
*   `auth.middleware.ts`: Verifies JWT tokens and checks user roles for authorization.
*   `validate.ts`: Validates request data against Zod schemas.
*   `error.ts`: A centralized error handling middleware that catches errors thrown in routes or other middleware and sends a standardized error response.
*   `rateLimiter.ts`: Protects API endpoints from abuse by limiting the number of requests from a single IP address.

**Example (`src/middleware/auth.middleware.ts` - simplified):**

```typescript
import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import httpStatus from 'http-status';
import { ApiError } from '../utils/ApiError';
import { Role } from '@prisma/client'; // Assuming Role enum from Prisma

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (err: any, user: any, info: any) => {
    if (err || !user) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    }
    req.user = user;
    next();
  })(req, res, next);
};

const authorize = (requiredRoles: Role[]) => (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !requiredRoles.includes(req.user.role)) {
    return next(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
  }
  next();
};

export const authMiddleware = {
  authenticate,
  authorize,
};
```

## 5. Validation

Input validation is handled using [Zod](https://zod.dev/), a TypeScript-first schema declaration and validation library. This ensures that incoming request data conforms to expected structures and types.

*   **Location:** `src/validations/`
*   **Purpose:** Define schemas for request bodies, query parameters, and path parameters.
*   **Integration:** The `src/middleware/validate.ts` middleware uses these schemas to validate requests automatically.

**Example (`src/validations/user.validation.ts`):**

```typescript
import { z } from 'zod';

const createUser = z.object({
  body: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['user', 'admin']).default('user'),
  }),
});

const getUserById = z.object({
  params: z.object({
    userId: z.string().uuid(), // Assuming UUID for user IDs
  }),
});

export const userValidation = {
  createUser,
  getUserById,
};
```

## 6. Error Handling

The template implements a centralized and standardized error handling mechanism to provide consistent error responses to clients.

*   **Custom Error Class:** `src/utils/ApiError.ts` defines a custom `ApiError` class that extends Node.js's built-in `Error` class. This allows for attaching HTTP status codes and other relevant information to errors.
*   **Global Error Middleware:** `src/middleware/error.ts` acts as a catch-all for errors. It detects `ApiError` instances and sends appropriate HTTP responses. For unexpected errors, it provides a generic error message to avoid leaking sensitive information.

**Why centralized error handling?**
*   **Consistency:** All error responses follow a predictable format.
*   **Developer Experience:** Easier to debug and handle errors on the client-side.
*   **Security:** Prevents sensitive server-side error details from being exposed to clients.

## 7. Logging

Structured logging is implemented using [Pino](https://getpino.io/), a very fast Node.js logger.

*   **Location:** `src/utils/logger.ts`
*   **Purpose:** Provides a centralized and efficient way to log application events, errors, and debugging information.
*   **Benefits:**
*   **Performance:** Pino is highly optimized for speed.
*   **Structured Logs:** Logs are outputted as JSON, making them easy to parse and analyze with log management tools (e.g., ELK stack, Datadog).
*   **Contextual Logging:** Easily add context to log messages (e.g., request ID, user ID).

**Example (`src/utils/logger.ts` - simplified):**

```typescript
import pino from 'pino';
import config from '../config/config'; // Assuming config has a logLevel

const logger = pino({
  level: config.logLevel || 'info',
  // ... other pino options like prettyPrint for development
});

export default logger;
```

## 8. Configuration Management

Application settings are managed through environment variables, loaded and validated via `src/config/config.ts`.

*   **Location:** `src/config/config.ts` and `.env` files.
*   **Purpose:** Centralize all application settings, making it easy to manage different configurations for development, testing, and production environments.
*   **Process:**
    1.  `.env` files (e.g., `.env`, `.env.local`, `.env.test`) store key-value pairs.
    2.  `dotenv` library loads these variables into `process.env`.
    3.  `src/config/config.ts` uses Zod to define a schema for expected environment variables, validates them, and exports a configuration object.

**Why this approach?**
*   **Security:** Keeps sensitive information out of the codebase.
*   **Flexibility:** Easily switch configurations between environments without code changes.
*   **Maintainability:** All configuration logic is in one place.

## 9. AI & Vector Database Integration

This template integrates **Google Gemini AI** and **PostgreSQL with pgvector** to enable intelligent document search and RAG (Retrieval-Augmented Generation) capabilities.

*   **pgvector Extension**: Adds vector similarity search to PostgreSQL, allowing storage and querying of high-dimensional embeddings.
*   **Embeddings**: Text и images are converted to 768-dimension vectors using Gemini's `text-embedding-004` model.
*   **Semantic Search**: Instead of keyword matching, the system finds documents by semantic similarity using cosine distance.
*   **RAG Pipeline**: Combines retrieval (vector search) with generation (AI responses) to answer questions based on uploaded documents.

**Key Components**:

*   **File Ingestion**: Background worker processes uploads, extracts text, chunks content, generates embeddings, and stores in pgvector.
*   **Hybrid Search**: Combines vector similarity with access control (user ownership + public visibility).
*   **Smart Citations**: AI responses include presigned URLs to source documents.

**Example Query**:

```sql
-- Find top 5 most similar documents
SELECT content, (embedding <=> $queryVector::vector) as distance
FROM "Document"
WHERE userId = $userId
ORDER BY distance ASC
LIMIT 5;
```

See [RAG Intelligence Pipeline](./rag-intelligence-pipeline.md) for comprehensive details on how semantic search and AI generation work together.

These core concepts form the backbone of the Node.js Advanced Starter Template, providing a solid, maintainable, and scalable foundation for your API development.