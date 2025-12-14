# Getting Started

This section will guide you through setting up and running the Node.js Advanced Starter Template for local development. Follow these steps to get your environment ready and the application running.

 **NOTE:** In this template, the term `local` refers to running the application **outside of Docker**. In this case, the `.env.local` file is used. Any script in `package.json` that includes the `:local` suffix indicates that the script runs using the `.env.local` configuration.

## Prerequisites

Before you begin, ensure you have the following software installed on your system:

*   **Node.js**: Version 18.x or higher. You can download it from [nodejs.org](https://nodejs.org/).
*   **npm** or **Yarn**: npm comes bundled with Node.js. If you prefer Yarn, you can install it via `npm install -g yarn`.
*   **Docker & Docker Compose**: Essential for running the database and other services locally. Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/).


## Unzip the Project

Start by unzipping the downloaded project file. This will create a new directory named `node-template-advanced-1`. Navigate into this new directory to proceed with the setup.


## 1. Manual Installation

If you prefer to set up the project step-by-step, follow the instructions below.

### Step 1: Install Dependencies

Navigate into the project directory and install the required Node.js packages:

```bash
npm install
# or if you use yarn
yarn install
```
This will also automatically trigger `npx prisma generate` because of the `postinstall` script in `package.json`.

### Step 2: Environment Variables Configuration

The project uses environment variables for configuration. A `.env.example` file is provided as a template.

1.  Create a `.env` file in the root of your project by copying `.env.example`:
    ```bash
    cp .env.example .env
    ```
2.  Open the newly created `.env` file and update the variables as needed. Pay close attention to database connection strings, JWT secrets, and any third-party API keys (e.g., Google OAuth credentials, SendGrid API key).

3. Create a `.env.local` file by copying the `.env.example` file. This file is used for the local development setup.
    ```bash
    cp .env.example .env.local
    ```
4. Open the `.env.local` file and make sure the `DATABASE_URL` and `REDIS_URL` are pointing to `localhost`.

**Example `.env` (excerpt):**
```yaml
NODE_ENV=development
PORT=5001

DATABASE_URL="postgresql://user:password@localhost:5432/mydatabase?schema=public"
# Or for MySQL:
# DATABASE_URL="mysql://user:password@localhost:3306/mydatabase"

JWT_SECRET=supersecretjwtkey
JWT_ACCESS_EXPIRATION_MINUTES=30
JWT_REFRESH_EXPIRATION_DAYS=30

GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL=http://localhost:5001/v1/auth/google/callback

SENDGRID_API_KEY=YOUR_SENDGRID_API_KEY
EMAIL_FROM=support@example.com
```

### Step 3: Database Setup

**Note:** You can launch the entire application stack, including the database and Redis server, with a single command. Please refer to the [Running with Docker (Recommended)](#option-2-running-everything-with-docker) section.

This template uses Docker Compose to manage local database instances (PostgreSQL or MySQL).

1.  **Start the database container:**
    
```bash
# For PostgreSQL
npm run docker:redis:postgres:up
```
This command will pull the database image and start a container in the background.

2.  **Generate Prisma Client:**

    This command will generate the Prisma client based on the database schema.
    ```bash
    npm run prisma:generate
    ```

3.  **Run Prisma Migrations:**

    This command will apply the Prisma migrations to set up your database schema:
    ```bash
    npm run prisma:migrate:dev
    ```

4.  **Seed the Database (Optional):**

    This command will populate your database with initial data using the Prisma seed script:
    ```bash
    npm run seed:local // using .env.local file
    ```
    Review `prisma/seed.ts` to understand what data will be added.

## 2. Running the Application

You have two main ways to run the application for development.

### Option 1: Running the App Locally (Hybrid Approach)

This method is for developers who want to run the Node.js application directly on their host machine (e.g., for easier debugging) while still using Docker to manage the database and Redis.

#### Step 1: Start Background Services with Docker

Before you can run the application locally, the database and Redis must be running.

```bash
# This command starts ONLY the PostgreSQL and Redis containers
npm run docker:redis:postgres:up
```

This command uses Docker to make the database and Redis available on `localhost`.

> **CRITICAL STEP:** You **must** run this command before starting the local server. The application will fail to start if it cannot connect to the database and Redis.

#### Step 2: Run the Application on Your Host Machine

Once the background services are running, open a new terminal and start the application using the local-specific script:

```bash
npm run dev:watch:local
```

This command does two important things:
1.  It uses `ts-node` to run the app with hot-reloading.
2.  It loads the `.env.local` file, which is configured to connect to `localhost` for the database and Redis.

The API server will start on `http://localhost:5002`.


### Option 2: Running Everything with Docker

This is the simplest method. It uses Docker Compose to build and run the Node.js application, the database (PostgreSQL), and Redis in a unified, isolated environment.

We've added convenient `npm` scripts to automate this process. The entrypoint script will automatically:
- Wait for the database to be ready.
- Run database migrations.
- Seed the database with initial data.
- Start the application with hot-reloading.

*   **To start the app and all services (Postgres, Redis):**
    ```bash
    npm run docker:up:build
    ```
    Your application will be available at `http://localhost:5001`.

*   **To run in the background:**
    ```bash
    npm run docker:up:detached
    ```

*   **To stop all services:**
    ```bash
    npm run docker:down
    ```

*   **To view logs:**
    ```bash
    npm run docker:logs
    ```

> **Note on Docker commands:** The `npm run dev` and `npm run dev:watch` commands are designed to be run *inside* the Docker container. They rely on the `.env` file, which uses Docker network hostnames like `db` and `redis`. They are not meant for local development directly on your host machine.

---

## 3. Troubleshooting Local Development

### Prisma Errors After Setup

If you run into Prisma-related errors (e.g., `PrismaClient is not a constructor`, schema mismatches) when running the app locally, it often means the Prisma Client is out of sync with your database schema.

**Important:** Ensure your database is running before you proceed. If it's not, run `npm run docker:redis:postgres:up`.

To fix this, run the following commands in order:

1.  **Generate the Prisma Client:**
    This command reads your `prisma/schema.prisma` and generates the type-safe client.
    ```bash
    npm run prisma:generate
    ```

2.  **Run Database Migrations:**
    This command applies any pending migrations to your database to ensure the schema is up to date.
    ```bash
    npm run prisma:migrate:dev
    ```

After completing these steps, try starting the application again with `npm run dev:watch:local`.

## 4. Available npm Scripts


Here is the breakdown of your package.json scripts, explained section by section. This acts as a perfect reference for your documentation.

### 🔄 Lifecycle Hooks
These run automatically by npm at specific times.

*   `postinstall`: Runs automatically after `npm install`. It triggers `prisma generate` to ensure the `@prisma/client` is created immediately. This prevents the common "Prisma Client not initialized" error when a user first clones the repo.
*   `prepare`: Runs automatically after install (only locally). It sets up Husky (git hooks) to ensure linting/formatting happens before commits.

### 🚀 Build & Production
These are used when deploying to servers (Render, AWS, etc.).

*   `build`: The heavy lifter. It does three things:
    1.  Generates the Prisma Client.
    2.  Compiles your main app (`src`) to `dist`.
    3.  Crucially: Compiles `prisma/seed.ts` into a standalone JS file (`dist/prisma/seed.js`) using specific flags (`--target ES2022`, `--module CommonJS`) so it can run in production without `ts-node`.
*   `start`: The standard production command. It simply runs the compiled server (`node dist/server.js`). Use this if you handle migrations separately (like in Render Paid tier).
*   `start:with-db`: The "Lazy" production command (Great for Render Free Tier). It runs migrations, seeds the DB, and then starts the server.

### 💻 Local Development
These are for working on your machine without Docker.

*   `dev`: Runs the server directly using `ts-node`. Good for a quick check.
*   `dev:watch`: The main dev command. Uses `nodemon` to restart the server automatically whenever you save a file.
*   `dev:watch:local`: Same as above, but forces `dotenv` to load variables from `.env.local`. This is the primary command for local development.

### 🐳 Docker (Modular)
These handle your complex multi-file Docker setup.

*   `docker:up:build`: Starts all services (app, Redis, PostgreSQL) defined in `docker-compose.yml`, `docker-compose.redis.yml`, `docker-compose.postgres.yml`, and `docker-compose.override.yml`, rebuilding images if necessary.
*   `docker:up`: Starts all services (app, Redis, PostgreSQL) defined in `docker-compose.yml`, `docker-compose.redis.yml`, `docker-compose.postgres.yml`, and `docker-compose.override.yml` in the foreground.
*   `docker:up:detached`: Starts all services (app, Redis, PostgreSQL) in the background (`-d`), freeing up your terminal.
*   `docker:down`: Stops and removes the app, redis and PostgreSQL containers.
*   `docker:logs`: Follows the logs of the app, redis and PostgreSQL containers.
*   `docker:redis:postgres:up`: Starts only the Redis and PostgreSQL services, rebuilding their images if necessary.

### 🗄️ Database (Prisma)
Wrappers for Prisma CLI tools.

*   `prisma:generate`: Reads `schema.prisma` and updates `node_modules/@prisma/client`. This is now run automatically on `npm install`.
*   `prisma:migrate:dev`: Creates a new migration file based on schema changes (for development). Uses `.env.local` to connect.
*   `prisma:migrate:deploy`: Applies pending migrations to the database (for production/CI).
*   `prisma:studio`: Opens the GUI to view/edit your database data.
*   `seed`: Runs the TypeScript seed file (`prisma/seed.ts`). Requires `ts-node` (Dev only).
*   `seed:local`: Runs the seed script using the `.env.local` file. Use this for local development.
*   `seed:prod`: Runs the Compiled JavaScript seed file (`dist/prisma/seed.js`). Does NOT require `ts-node` (Production only).

### ✅ Quality & Testing
*   `test`: Loads `.env.test` (connecting to the test DB) and runs Jest tests.
*   `lint`: Scans your code with ESLint to catch syntax errors and bad patterns.
*   `type-check`: Runs the TypeScript compiler (`tsc`) without emitting files. Useful to check for type errors without actually building.
*   `format`: Uses Prettier to automatically format your code to look consistent.

## 5. Initial API Interaction

Once the server is running, you can verify its status by accessing the health endpoint:

*   Open your web browser or an API client and navigate to:
    `http://localhost:5001/api/v1/health`

You should receive a JSON response indicating the API's health.

### Accessing the API Documentation (Swagger UI)

To explore and test the API endpoints interactively, navigate to the Swagger UI:

*   Open your web browser and go to:
    `http://localhost:5001/api-docs`

Here you can view all available routes and make test calls directly from the browser.

Congratulations! You have successfully set up and run the Node.js Advanced Starter Template. You are now ready to explore its features and start building your API.
