# Getting Started

This section will guide you through setting up and running the Node.js Advanced Starter Template for local development. Follow these steps to get your environment ready and the application running.

## Prerequisites

Before you begin, ensure you have the following software installed on your system:

*   **Node.js**: Version 18.x or higher. You can download it from [nodejs.org](https://nodejs.org/).
*   **npm** or **Yarn**: npm comes bundled with Node.js. If you prefer Yarn, you can install it via `npm install -g yarn`.
*   **Docker & Docker Compose**: Essential for running the database and other services locally. Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/).


## Unzip the Project

Start by unzipping the downloaded project file. This will create a new directory named `node-template-advanced-1`. Navigate into this new directory to proceed with the setup.


## 1. The "Magic" Setup Command (Recommended)

It will:
- Installs all `npm` dependencies.
- Copies the `.env.example` file to `.env`.
- Runs database migrations to set up your schema.
- Seeds the database with initial data.

Just run this single command in your terminal:

```bash
npm run setup
```

After the script finishes, your environment is ready! You can then start the application using Docker or run it manually.

---

## 2. Manual Installation

If you prefer to set up the project step-by-step, follow the instructions below.

### Step 1: Install Dependencies

Navigate into the project directory and install the required Node.js packages:

```bash
npm install
# or if you use yarn
yarn install
```

### Step 2: Environment Variables Configuration

The project uses environment variables for configuration. A `.env.example` file is provided as a template.

1.  Create a `.env` file in the root of your project by copying `.env.example`:
    ```bash
    cp .env.example .env
    ```
2.  Open the newly created `.env` file and update the variables as needed. Pay close attention to database connection strings, JWT secrets, and any third-party API keys (e.g., Google OAuth credentials, SendGrid API key).

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

**Note:** You can launch the entire application stack, including the database and Redis server, with a single command. Please refer to the [Running with Docker (Recommended)](#option-1-running-with-docker-recommended) section.

This template uses Docker Compose to manage local database instances (PostgreSQL or MySQL).

1.  **Start the database container:**
    
```bash
# For PostgreSQL
docker compose -f docker-compose.postgres.yml up -d

# Or for MySQL
docker compose -f docker-compose.mysql.yml up -d
```
This command will pull the database image and start a container in the background.

2.  **Create Prisma client and Run Prisma Migrations:**
    Once your database container is running, apply the Prisma migrations to set up your database schema:
    ```bash
    npm run prisma:generate
    npm run prisma:migrate:dev
    ```

3.  **Seed the Database (Optional):**
    You can populate your database with initial data using the Prisma seed script:
    ```bash
    npm run seed
    ```
    Review `prisma/seed.ts` to understand what data will be added.

## 3. Running the Application

You have two main options for running the application: with Docker (recommended for a consistent environment) or manually on your host machine.

### Option 1: Running with Docker (Recommended)

We've added convenient `npm` scripts and a smart entrypoint to fully automate the Docker Compose setup. When you run the `docker:up` command, the entrypoint script will automatically:
- Wait for the database to be ready.
- Run database migrations.
- Seed the database with initial data.
- Start the application with hot-reloading.

*   **To start the app and all services (Postgres, Redis):**
```bash
npm run docker:up
```
Your application will be available at `http://localhost:5001`.

*   **To run in the background:**
```bash
npm run docker:up:detached
```

*   **To stop the services:**
```bash
npm run docker:down
```

*   **To view logs:**
```bash
npm run docker:logs
```

<details>
<summary><b>Alternative: Using `docker-compose` directly</b></summary>

If you need more control, you can use `docker-compose` commands directly. The setup is modular, so you combine the base `docker-compose.yml` with an override and a database file.

> **What does `docker-compose.override.yml` do?**
> It contains development-specific settings. It tells Docker to use `Dockerfile.dev` for a development-focused build, enables hot-reloading by running `npm run dev:watch`, and mounts your local code into the container so your changes are reflected live.

</br>
*   **For PostgreSQL:**
```bash
docker compose -f docker-compose.yml -f docker-compose.override.yml -f docker-compose.postgres.yml up --build
```
*   **For MySQL:**
```bash
docker compose -f docker-compose.yml -f docker-compose.override.yml -f docker-compose.mysql.yml up --build
```
</details>

### Option 2: Running Manually

If you prefer to manage the application process directly on your host machine, ensure your database is running first. See [step 4: database setup](#step-3-database-setup) for details.

#### Development Mode

To run the application in development mode with hot-reloading:

```bash
npm run dev:watch
# or
yarn dev:watch
```
The API server will start on `http://localhost:5001`.

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
*   `dev:watch:local`: Same as above, but forces `dotenv` to load variables from `.env.local`. Useful if you have a specific local config that differs from the default `.env`.

### ✨ Onboarding
*   `setup`: The "One-Click" command for new users.
    - Installs dependencies.
    - Copies `.env.example` to `.env`.
    - Runs migrations.
    - Seeds the database.
    > "Just run npm run setup and you are ready to code!"

### 🐳 Docker (Modular)
These handle your complex multi-file Docker setup.

*   `docker:up`: Combines `docker-compose.yml` (App), `postgres.yml` (DB), and `override.yml` (Dev config) to start the stack in the foreground.
*   `docker:up:detached`: Same as above, but runs in the background (`-d`), freeing up your terminal.
*   `docker:down`: Stops and removes all containers defined in your compose files.
*   `docker:logs`: Follows the logs of all running containers.

### 🗄️ Database (Prisma)
Wrappers for Prisma CLI tools.

*   `prisma:generate`: Reads `schema.prisma` and updates `node_modules/@prisma/client`.
*   `prisma:migrate:dev`: Creates a new migration file based on schema changes (for development). Uses `.env.local` to connect.
*   `prisma:migrate:deploy`: Applies pending migrations to the database (for production/CI).
*   `prisma:studio`: Opens the GUI to view/edit your database data.
*   `seed`: Runs the TypeScript seed file (`prisma/seed.ts`). Requires `ts-node` (Dev only).
*   `seed:prod`: Runs the Compiled JavaScript seed file (`dist/prisma/seed.js`). Does NOT require `ts-node` (Production only).

### ✅ Quality & Testing
*   `test`: Loads `.env.test` (connecting to the test DB) and runs Jest tests.
*   `lint`: Scans your code with ESLint to catch syntax errors and bad patterns.
*   `type-check`: Runs the TypeScript compiler (`tsc`) without emitting files. Useful to check for type errors without actually building.
*   `format`: Uses Prettier to automatically format your code to look consistent.

## 4. Initial API Interaction

Once the server is running, you can verify its status by accessing the health endpoint:

*   Open your web browser or an API client and navigate to:
    `http://localhost:5001/v1/health`

You should receive a JSON response indicating the API's health.

### Accessing the API Documentation (Swagger UI)

To explore and test the API endpoints interactively, navigate to the Swagger UI:

*   Open your web browser and go to:
    `http://localhost:5001/api-docs`

Here you can view all available routes and make test calls directly from the browser.

Congratulations! You have successfully set up and run the Node.js Advanced Starter Template. You are now ready to explore its features and start building your API.