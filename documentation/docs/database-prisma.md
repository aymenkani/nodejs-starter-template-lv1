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

> **Note on Local Development:**
> When running the application locally (not in a full Docker environment), it's crucial to ensure your database is running before you attempt to run migrations.
>
> 1.  Start your database and Redis services: `npm run docker:redis:postgres:up`
> 2.  Then, run your migration: `npm run prisma:migrate:dev`
>
> For a complete guide on the local development workflow, see the **[Getting Started](./getting-started.md#option-2-running-everything-with-docker)** documentation.

## 3. Seeding the Database (`prisma/seed.ts`)

Database seeding is the process of populating your database with initial data. This is particularly useful for development, testing, or for pre-populating lookup tables.

**Location:** `prisma/seed.ts`

The `seed.ts` file contains TypeScript code that uses the Prisma Client to insert initial data into your database.

**To run the seed script:**

*   `seed`: Runs the TypeScript seed file (`prisma/seed.ts`). Requires `ts-node` (run ONLY when using Docker in development).
    ```bash
    npm run seed
    ```
*   `seed:local`: Runs the seed script using the `.env.local` file. Use this for local development.
    ```bash
    npm run seed:local
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

## 6. pgvector Setup for AI & Vector Search

This template uses the [pgvector](https://github.com/pgvector/pgvector) PostgreSQL extension to enable vector similarity search, which powers the RAG (Retrieval-Augmented Generation) intelligence pipeline.

### What is pgvector?

pgvector adds vector similarity search capabilities to PostgreSQL, allowing you to:
- Store high-dimensional vectors (embeddings) efficiently
- Perform fast similarity searches using cosine distance, L2 distance, or inner product
- Index vectors for optimal query performance

### Installation

The pgvector extension is automatically installed in the Docker PostgreSQL image. The setup is handled in the database initialization:

**Docker Compose** (`docker-compose.postgres.yml`):
```yaml
services:
  db:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: your_database
```

### Schema Setup

The extension is enabled via Prisma migrations. The initial migration includes:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Document table with vector column
CREATE TABLE "Document" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding vector(768),  -- 768-dimensional vector for Gemini embeddings
  "userId" UUID NOT NULL,
  "fileId" UUID NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Create index for faster similarity search
CREATE INDEX ON "Document" USING ivfflat (embedding vector_cosine_ops);
```

### Prisma Schema

In `prisma/schema.prisma`, vectors are defined using the `Unsupported` type:

```prisma
model Document {
  id        String                     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  content   String
  embedding Unsupported("vector(768)")?
  userId    String                     @db.Uuid
  fileId    String                     @db.Uuid
  user      User                       @relation(fields: [userId], references: [id], onDelete: Cascade)
  file      File                       @relation(fields: [fileId],references: [id], onDelete: Cascade)
  createdAt DateTime                   @default(now())

  @@index([embedding], map: "Document_embedding_idx", type: Ivfflat)
  @@index([userId])
  @@index([fileId])
}
```

### Usage in Code

**Storing Vectors** (from `ingestion.worker.ts`):

```typescript
import { embed } from 'ai';
import { google } from '@ai-sdk/google';

// Generate embedding
const { embedding } = await embed({
  model: google.textEmbeddingModel('text-embedding-004'),
  value: textChunk
});

// Store in database with pgvector
await prisma.$executeRaw`
  INSERT INTO "Document" (id, content, embedding, userId, fileId)
  VALUES (
    gen_random_uuid(), 
    ${textChunk}, 
    ${embedding}::vector,
    ${userId}::uuid,
    ${fileId}::uuid
  )
`;
```

**Similarity Search** (from `agent.controller.ts`):

```typescript
// Generate query embedding
const { embedding: queryEmbedding } = await embed({
  model: google.textEmbeddingModel('text-embedding-004'),
  value: searchQuery
});

// Find similar documents using cosine distance
const results = await prisma.$queryRaw<DocumentWithDistance[]>`
  SELECT 
    d.id,
    d.content,
    f."originalName" as "fileName",
    f."fileKey",
    (d.embedding <=> ${queryEmbedding}::vector) as distance
  FROM "Document" d
  INNER JOIN "File" f ON d."fileId" = f.id
  WHERE (
    d."userId" = ${userId}::uuid 
    OR f."isPublic" = true
  )
  AND f.status = 'COMPLETED'
  ORDER BY d.embedding <=> ${queryEmbedding}::vector
  LIMIT 5
`;
```

### Vector Operators

| Operator | Description | Use Case |
|----------|-------------|----------|
| `<=>` | Cosine distance | Text similarity (most common for embeddings) |
| `<->` | L2 (Euclidean) distance | Spatial data |
| `<#>` | Inner product | Normalized vectors |

### Performance Optimization

**Indexing**: The `ivfflat` index significantly improves query performance for large datasets:

```sql
CREATE INDEX ON "Document" USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

- `lists`: Number of clusters (typically sqrt(row_count) for good performance)
- Rebuild index periodically as data grows

**Query Performance**:
- Without index: Full table scan on every query
- With index: ~10-100x faster on datasets >10k vectors

### Troubleshooting

**"type vector does not exist"**:
- Ensure `CREATE EXTENSION vector;` ran in your migration
- Run `SELECT * FROM pg_extension WHERE extname = 'vector';` to verify

**Slow queries**:
- Check if index exists: `\d "Document"` in psql
- Rebuild index if dataset grew: `REINDEX INDEX "Document_embedding_idx";`

**Dimension mismatch**:
- Gemini `text-embedding-004` produces 768-D vectors
- Ensure schema uses `vector(768)`, not `vector(1536)` or other dimensions

For more details on the RAG pipeline, see [RAG Intelligence Pipeline](./rag-intelligence-pipeline.md).

---

## 7. Database Configuration

The database connection is configured via the `DATABASE_URL` [environment variable](./core-concepts.md#8-configuration-management) in your `.env` file. This template supports both PostgreSQL and MySQL.
**Example `DATABASE_URL` formats:**

*   **PostgreSQL:** `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public`
*   **MySQL:** `mysql://USER:PASSWORD@HOST:PORT/DATABASE`

Ensure your `docker-compose.yml` (or specific `docker-compose` file) and `DATABASE_URL` in `.env` match your chosen database provider and credentials.

By using Prisma, this template provides a powerful, type-safe, and developer-friendly database layer that simplifies data access and management.