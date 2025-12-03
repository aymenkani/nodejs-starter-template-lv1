# API Documentation with OpenAPI

This template uses [OpenAPI Specification](https://swagger.io/specification/) (formerly Swagger) to describe and document the RESTful APIs. It automatically generates interactive documentation (Swagger UI) directly from your code, making it easy for developers to understand, test, and integrate with your API.

## Why OpenAPI?

*   **Interactive Documentation:** Provides a user-friendly web interface (Swagger UI) to explore API endpoints, models, and operations.
*   **Consistency:** Ensures that your API documentation is always synchronized with your API implementation.
*   **Client Generation:** Enables automatic generation of API client SDKs in various programming languages.
*   **Design-First or Code-First:** Supports both approaches to API development. This template uses a code-first approach where documentation is derived from code.
*   **Standardization:** OpenAPI is a widely adopted industry standard for describing APIs.

## 1. Setup and Generation

The OpenAPI specification is generated dynamically from your application's route definitions and Zod schemas.

*   **Location:** `src/docs/`
*   **Core Files:**
*   `src/docs/openapi.ts`: The main file where the OpenAPI document is initialized and configured. It defines global information like API title, version, and security schemes.
*   `src/docs/openAPIRegistry.ts`: An instance of `@asteasolutions/zod-to-openapi`'s `OpenAPIRegistry` which collects all path and component (schema) definitions.
*   `src/docs/paths/`: This directory contains individual files for defining API paths and their operations. Each file typically corresponds to a resource's routes (e.g., `auth.path.ts`, `user.path.ts`).

### How it Works

1.  **Schema Definition (Zod):** Your request and response data structures are defined using [Zod schemas](./core-concepts.md#5-validation) in `src/validations/`. These Zod schemas are then registered with the `OpenAPIRegistry`.
2.  **Path Definition:** In `src/docs/paths/`, you define each API endpoint, its HTTP method, summary, description, request body, parameters, and possible responses. These definitions reference the Zod schemas registered earlier.
3.  **Dynamic Generation:** When the application starts, `src/docs/openapi.ts` collects all registered paths and schemas from `openAPIRegistry.ts` and generates the complete OpenAPI JSON specification.
4.  **Swagger UI:** The generated OpenAPI JSON is then served via `swagger-ui-express`, which provides the interactive Swagger UI.

## 2. Defining Paths and Schemas

### Registering Schemas

To document your request and response bodies, you'll use Zod schemas and register them with the `OpenAPIRegistry`.

**Example (`src/validations/auth.validation.ts` and `src/docs/paths/auth.path.ts`):**

```typescript
// src/validations/auth.validation.ts
import { z } from 'zod';

export const authSchemas = {
  loginBody: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
  loginResponse: z.object({
    user: z.object({
      id: z.string().uuid(),
      email: z.string().email(),
      name: z.string(),
    }),
    tokens: z.object({
      access: z.object({
        token: z.string(),
        expires: z.string().datetime(),
      }),
      refresh: z.object({
        token: z.string(),
        expires: z.string().datetime(),
      }),
    }),
  }),
};
```

```typescript
// src/docs/openAPIRegistry.ts (excerpt)
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { authSchemas } from '../validations/auth.validation';

export const registry = new OpenAPIRegistry();

registry.register('LoginBody', authSchemas.loginBody);
registry.register('LoginResponse', authSchemas.loginResponse);
// ... register other schemas
```

### Defining API Paths

Each API path is defined using the `registry.registerPath` method.

**Example (`src/docs/paths/auth.path.ts`):**

```typescript
// src/docs/paths/auth.path.ts
import { registry } from '../openAPIRegistry';

registry.registerPath({
  method: 'post',
  path: '/v1/auth/login',
  tags: ['Auth'],
  summary: 'Authenticate user and get tokens',
  request: {
    body: {
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/LoginBody', // Reference the registered Zod schema
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'User successfully logged in',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/LoginResponse', // Reference the registered Zod schema
          },
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
  },
});
```

## 3. Accessing the Documentation (Swagger UI)

Once your application is running, the interactive API documentation is available at a dedicated endpoint.

*   **Default URL:** `http://localhost:5001/api-docs` (or `/api-docs` relative to your API base URL).

Navigate to this URL in your web browser to explore the API endpoints, test requests, and view schema definitions.

## 4. Frontend Client Generation

The OpenAPI specification generated by this template can be used to automatically generate type-safe API clients for your frontend applications. This ensures that your frontend code is always in sync with your backend API, catching potential breaking changes at compile time.

For detailed instructions on how to generate a frontend client using `openapi-typescript`, please refer to the [Getting Started guide](./getting-started.md) in the section about "Initial API Interaction" or the original `README.md` file.

By maintaining up-to-date OpenAPI documentation, this template significantly improves the developer experience for both backend and frontend teams, fostering better collaboration and reducing integration issues.