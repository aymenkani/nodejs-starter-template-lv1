# Database with Prisma

This template leverages [Prisma](https://www.prisma.io/) as its Object-Relational Mapper (ORM) for interacting with databases. Prisma provides a type-safe, modern, and intuitive way to define your database schema, manage migrations, and perform database operations.

## 1. Prisma Schema (`prisma/schema.prisma`)

The `schema.prisma` file is the single source of truth for your database schema. It defines your data models, their fields, relationships, and the database connector.

**Location:** `prisma/schema.prisma`

**Key Components:**

*   **`datasource` block:** Specifies your database connection details. This template is configured to work with PostgreSQL or MySQL. The `url` field typically references an environment variable (`DATABASE_URL`).
    ```prisma
    datasource db {
      provider = "postgresql" // or "mysql"
      url      = env("DATABASE_URL")
    }
    ```
*   **`generator` block:** Configures Prisma Client generation. The `provider` is set to `prisma-client-js`.
    ```prisma
    generator client {
      provider = "prisma-client-js"
    }
    ```
*   **`model` definitions:** These define your application's data models, which map directly to database tables. Each model specifies its fields, their types, attributes (e.g., `@id`, `@unique`, `@default`), and relationships with other models.

**Example Model (`User` from `schema.prisma`):**

```prisma
enum Role {
  USER
  ADMIN
}

model User {
  id            String    @id @default(uuid())
  name          String
  email         String    @unique
  password      String
  role          Role      @default(USER)
  isEmailVerified Boolean @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  tokens        Token[]
  passwordResetTokens PasswordResetToken[]
}
```

## 2. Migrations

Prisma Migrate helps you evolve your database schema in a controlled and reproducible way. It generates SQL migration files based on changes you make to your `schema.prisma` file.

**Workflow:**

1.  **Modify `schema.prisma`:** Make changes to your data models (e.g., add a new model, add a field, change a field type).
2.  **Generate a new migration:**
    ```bash
    npm run prisma:migrate:dev -- --name <migration_name>
    ```
    This command creates a new migration file based on schema changes for development. It uses `.env.local` to connect to the database.
3.  **Apply migrations (in other environments):**
    In production or other environments, you apply pending migrations using:
    ```bash
    npm run prisma:migrate:deploy
    ```
    This command applies pending migrations to the database, for production/CI.

**Location of Migration Files:** `prisma/migrations/<timestamp>_<migration_name>/migration.sql`

Here are the relevant scripts:
*   `prisma:migrate:dev`: Creates a new migration file based on schema changes (for development). Uses `.env.local` to connect.
*   `prisma:migrate:deploy`: Applies pending migrations to the database (for production/CI).

## 3. Seeding the Database (`prisma/seed.ts`)

Database seeding is the process of populating your database with initial data. This is particularly useful for development, testing, or for pre-populating lookup tables.

**Location:** `prisma/seed.ts`

The `seed.ts` file contains TypeScript code that uses the Prisma Client to insert initial data into your database.

**To run the seed script:**

*   `seed`: Runs the TypeScript seed file (`prisma/seed.ts`). Requires `ts-node` (Dev only).
    ```bash
    npm run seed
    ```
*   `seed:prod`: Runs the Compiled JavaScript seed file (`dist/prisma/seed.js`). Does NOT require `ts-node` (Production only).
    ```bash
    npm run seed:prod
    ```

## 4. Other Prisma Scripts

*   `prisma:generate`: Reads `schema.prisma` and updates `node_modules/@prisma/client`. This is automatically run by the `postinstall` script.
*   `prisma:studio`: Opens the GUI to view/edit your database data.

## 5. Interacting with Prisma Client

The Prisma Client is a type-safe query builder automatically generated from your `schema.prisma`. It allows you to perform CRUD (Create, Read, Update, Delete) operations on your database in a highly intuitive and type-safe manner.

**Location:** The generated Prisma Client is located in `node_modules/@prisma/client`. You typically import it from `@prisma/client`.

**Basic Usage in Services:**

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create a new user
async function createUser(name: string, email: string, passwordHash: string) {
  return prisma.user.create({
    data: {
      name,
      email,
      password: passwordHash,
      // ... other fields
    },
  });
}

// Find a user by ID
async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { tokens: true }, // Include related data
  });
}

// Update a user's email
async function updateUserEmail(id: string, newEmail: string) {
  return prisma.user.update({
    where: { id },
    data: { email: newEmail },
  });
}

// Delete a user
async function deleteUser(id: string) {
  return prisma.user.delete({
    where: { id },
  });
}
```

## 5. Database Configuration

The database connection is configured via the `DATABASE_URL` [environment variable](./core-concepts.md#8-configuration-management) in your `.env` file. This template supports both PostgreSQL and MySQL.
**Example `DATABASE_URL` formats:**

*   **PostgreSQL:** `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public`
*   **MySQL:** `mysql://USER:PASSWORD@HOST:PORT/DATABASE`

Ensure your `docker-compose.yml` (or specific `docker-compose` file) and `DATABASE_URL` in `.env` match your chosen database provider and credentials.

By using Prisma, this template provides a powerful, type-safe, and developer-friendly database layer that simplifies data access and management.