# Guide: Creating New API Routes

This document provides a guide for the Gemini AI agent on how to create new API routes in this project.

## Core Concepts

The API routing is built on Express.js and follows a modular structure. Each resource (e.g., users, auth) has its own dedicated files for routes, controllers, and validations.

-   **Routes**: Defined in `src/api/*.routes.ts`. These files use `express.Router()` to define the API endpoints.
-   **Controllers**: Located in `src/controllers/*.controller.ts`. They contain the business logic for each route.
-   **Validations**: Request data is validated using `zod`. Schemas are defined in `src/validations/*.validation.ts`.
-   **Middleware**: Custom middleware for authentication (`auth`, `authorize`) and validation (`validate`) are used to protect and validate routes. They are located in `src/middleware/`.
-   **OpenAPI**: We use `@asteasolutions/zod-to-openapi` to generate OpenAPI documentation from our Zod schemas.

## How to Add a New Route

Here's a step-by-step guide to creating a new API route. Let's assume we are adding a new route to get a user's posts.

### 1. Create the Route Definition

First, create or update the route file in `src/api/`. For a new resource, create a new file (e.g., `src/api/post.routes.ts`).

**Example: `src/api/post.routes.ts`**

```typescript
import express from 'express';
import { postController } from '../controllers';
import { auth, authorize } from '../middleware/auth.middleware';
import validate from '../middleware/validate';
import { postValidation } from '../validations/post.validation';
import { Role } from '@prisma/client';

const router = express.Router();

// Protect all routes in this file and require USER role
router.use(auth, authorize([Role.USER]));

// Define the new route
router.get('/:userId/posts', validate(postValidation.getPosts), postController.getPosts);

export default router;
```

**Key points:**

-   Import necessary components: `express`, controllers, middleware, and validations.
-   Use `auth` and `authorize` middleware to protect routes.
-   For available roles, use `Role` from `@prisma/client`. Roles are defined inside prisma/schema.prisma in the `enum Role {}`
-   Use the `validate` middleware with a validation schema to validate request data (`params`, `query`, `body`).

### 2. Create the Controller

Next, create the controller function in `src/controllers/`. For a new resource, create a new file (e.g., `src/controllers/post.controller.ts`).

**Example: `src/controllers/post.controller.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';
import { postService } from '../services'; // this is an example, so this service doesn't exist

const getPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const posts = await postService.getPostsByUserId(userId);
    res.status(200).json({ success: true, data: posts });
  } catch (error) {
    next(error);
  }
};

export const postController = {
  getPosts,
};
```

**Key points:**

-   The controller function receives `req`, `res`, and `next`.
-   It calls a service to handle the business logic.
-   It sends a JSON response or passes errors to the `next` function.

### 3. Create the Validation Schema

Create a validation schema in `src/validations/`. For a new resource, create a new file (e.g., `src/validations/post.validation.ts`).

**Example: `src/validations/post.validation.ts`**

```typescript
import { z } from 'zod';
import { registry } from '../docs/openAPIRegistry';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

const getPostsSchema = registry.register(
  'GetPostsParams',
  z.object({
    userId: z.string().uuid({ message: 'Invalid user ID' }),
  })
);

export const getPosts = {
  params: getPostsSchema,
};

export const postValidation = {
  getPosts,
};
```

**Key points:**

-   Use `zod` to define the schema for `body`, `query`, or `params`.
-   Use `@asteasolutions/zod-to-openapi` to register the schema for API documentation.
-   Export the validation object.

### 4. Register the New Route

Finally, add the new route to the main API router in `src/api/index.ts`.

**Example: `src/api/index.ts`**

```typescript
import express from 'express';
import authRoutes from './auth.routes';
import tokenRoutes from './token.routes';
import userRoutes from './user.routes';
import { adminRoutes } from './admin.routes';
import uploadRoutes from './upload.routes';
import postRoutes from './post.routes'; // 1. Import the new routes

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/token', tokenRoutes);
router.use('/admin', adminRoutes);
router.use('/users', userRoutes);
router.use('/upload', uploadRoutes);
router.use('/posts', postRoutes); // 2. Add the new routes to the router

export default router;
```
### 5. Add a new Swagger documentation
after you finish create a new route with all its controllers and services, you need to document that route inside the swagger UI by adding new path inside the docs/paths folder either by creating a new file (e.g. newroute.path.ts) or updating an existing one.


By following these steps, you can add new routes to the API in a consistent and maintainable way.
