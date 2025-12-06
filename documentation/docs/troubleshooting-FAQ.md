# Troubleshooting & FAQ

This section provides solutions to common issues you might encounter.

---

## 🚀 **1. Deployment Errors (Render)**

### 🔧 **Config validation error**

- 🚨 **Error:**
  `Config validation error: [ "Admin email must be a valid email address", ... ]`

- 🧐 **Cause:**
  The application requires environment variables (defined in `src/config/config.ts`) that are missing in the Render environment.

- ✅ **Solution:**
  Navigate to your **Render Dashboard > Environment**. Instead of uploading a `.env` file, copy the contents of your local `.env` file and paste them directly into the **"Environment Variables"** bulk editor.

### 📦 **Module not found (seed.js)**

- 🚨 **Error:**
  `MODULE_NOT_FOUND / Cannot find module .../seed.js`

- 🧐 **Cause:**
  The build script did not compile the `seed.ts` file, or the Dockerfile did not copy the compiled output.

- ✅ **Solution:**
  Ensure your `package.json` build script includes the command to compile the seed file and that your `Dockerfile` copies the `dist` folder.
```json 
title="package.json"
"scripts": {
"build": "tsc && tsc prisma/seed.ts"
}
```
```dockerfile 
title="Dockerfile"
COPY --from=builder /app/dist ./dist
```
  > *(Note: This is already correctly configured in this template).*

### ❓ **Command not found: prisma**

- 🚨 **Error:**
  `Command not found: prisma` (in Production logs)

- 🧐 **Cause:**
  The `prisma` CLI is typically a development dependency (`devDependency`), but it is required in the production environment to run database migrations.

- ✅ **Solution:**
  Move `"prisma"` from `devDependencies` to `dependencies` in your `package.json` file.

---

## 🐳 **2. Docker & Local Development Errors**

### 🏃 **Issues Running the App Locally**

- 🚨 **Error:**
  Application fails to start with errors like `ECONNREFUSED`, `Can't reach database server`, or other Prisma-related issues when running `npm run dev:watch:local`.

- 🧐 **Cause:**
  This typically happens for one of two reasons:
  1.  The required background services (Database, Redis) are not running.
  2.  The Prisma Client is not generated or the database schema is out of date.

- ✅ **Solution:**
  A detailed guide for local development setup and troubleshooting is available in the **[Getting Started](./getting-started.md#option-2-running-the-app-locally-hybrid-approach)** documentation.

  **Quick Checklist:**
  1.  **Are the database and Redis running?** Before starting the app, you **must** run `npm run docker:redis:postgres:up`.
  2.  **Is Prisma up to date?** If the database is running but you still have errors, run these commands in order:
      ```bash
      # 1. Regenerate the Prisma Client
      npm run prisma:generate

      # 2. Apply latest database migrations
      npm run prisma:migrate:dev
      ```
  3.  Then, try starting the app again: `npm run dev:watch:local`.

---

### 🔌 **PrismaClientInitializationError**

- 🚨 **Error:**
  `PrismaClientInitializationError: Can't reach database server at dummy:5432`

- 🧐 **Cause:**
  The Docker image "baked in" the dummy `DATABASE_URL` provided during the build phase. The application is trying to connect to this dummy URL at runtime instead of the actual database URL.

- ✅ **Solution:**
  Never set `ENV DATABASE_URL` in the `Dockerfile`. Only pass it inline during the build process.
```dockerfile 
title="Dockerfile"
# Correct: Pass as an argument during build
RUN DATABASE_URL="dummy" npm install

# Incorrect: Do not set it as a permanent environment variable
# ENV DATABASE_URL="dummy"
```

### 🔗 **Invalid depends_on format**

- 🚨 **Error:**
  `services.app.depends_on.0 must be a string`

- 🧐 **Cause:**
  This error occurs when using an older, legacy syntax for `docker-compose.yml` files.

- ✅ **Solution:**
  Remove the `version: '3.8'` (or similar) line from the top of your `docker-compose.yml` files.

### 🐙 **Git error in Docker container**

- 🚨 **Error:**
  `The process '/usr/bin/git' failed with exit code 128`

- 🧐 **Cause:**
  Husky git hooks are attempting to run inside a Docker container where a `.git` directory does not exist.

- ✅ **Solution:**
  Disable Husky by setting the `HUSKY` environment variable to `0`.
  ```dockerfile title="Dockerfile"
  ENV HUSKY=0
  ```

---

## ⚙️ **3. API & Runtime Errors**

### 🚦 **429 Too Many Requests on Health Check**

- 🚨 **Error:**
  `429 Too Many Requests` on the health check endpoint (`/api/v1/health`).

- 🧐 **Cause:**
  The hosting provider's load balancer is sending frequent requests to the health check endpoint, triggering the API's rate limiter.

- ✅ **Solution:**
  In `src/server.ts`, define the health check route *before* the global rate limiter middleware is applied.
  ```typescript title="src/server.ts"
  // Health check endpoint (before rate limiter)
  app.get('/api/v1/health', (_req, res) => {
    res.send('OK');
  });

  // Apply rate limiter to all subsequent routes
  app.use(limiter);
  ```

### 🌐 **Swagger UI requests failing in production**

- 🚨 **Error:**
  Swagger UI or OpenAPI documentation requests fail (e.g., point to `localhost`).

- 🧐 **Cause:**
  The OpenAPI specification (`swaggerDef.ts`) has a hardcoded server URL.

- ✅ **Solution:**
  In your OpenAPI definition file, change the server URL to a relative path (`/`).
  ```typescript title="src/docs/swaggerDef.ts"
  const swaggerDef = {
    // ...
    servers: [
      {
        url: '/', // Use a relative path
      },
    ],
  };
  ```

### 📄 **Static files returning 404**

- 🚨 **Error:**
  Static files (e.g., `socket.io` client) return a `404 Not Found` error.

- 🧐 **Cause:**
  When TypeScript is compiled, relative paths like `'../public'` become incorrect.

- ✅ **Solution:**
  Use `path.join(__dirname, '../public')` for a robust path and ensure your `Dockerfile` copies the `public` folder.
  ```typescript title="src/server.ts"
  import path from 'path';
  app.use(express.static(path.join(__dirname, '../public')));
  ```
  ```dockerfile title="Dockerfile"
  COPY public ./public
  ```

### 🧩 **Prisma Client 'User' type not found**

- 🚨 **Error:**
  `Module '@prisma/client' has no exported member 'User'.`

- 🧐 **Cause:**
  The Prisma Client (`@prisma/client`) has not been generated or updated based on your `schema.prisma` file.

- ✅ **Solution:**
  Run `npx prisma generate` and restart your IDE or TypeScript server.
    ```bash
    npx prisma generate
    ```
  
  ---
  
  ## 🧪 **4. Testing Errors**
  
  ### ⚡ **PrismaClientKnownRequestError in Tests**
  
  - 🚨 **Error:**
    `PrismaClientKnownRequestError: An operation failed because it depends on one or more records that were required but not found.`
  
  - 🧐 **Cause:**
    This error often occurs when running tests (`npm test`) if the test database is not in sync with the Prisma schema. The test setup might be trying to access or manipulate data that doesn't match the expected structure.
  
  - ✅ **Solution:**
    Reset and re-apply your database migrations for the test environment. This ensures the test database schema is up-to-date.
    ```bash
    npm run prisma:migrate:dev
    ```
  