# Getting Started

This section will guide you through setting up and running the Node.js Advanced Starter Template for local development. Follow these steps to get your environment ready and the application running.

## Prerequisites

Before you begin, ensure you have the following software installed on your system:

*   **Node.js**: Version 18.x or higher. You can download it from [nodejs.org](https://nodejs.org/).
*   **npm** or **Yarn**: npm comes bundled with Node.js. If you prefer Yarn, you can install it via `npm install -g yarn`.
*   **Docker & Docker Compose**: Essential for running the database and other services locally. Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/).

## 1. Unzip the Project

Start by unzipping the downloaded project file. This will create a new directory named `node-template-advanced-1`. Navigate into this new directory to proceed with the setup.

After unzipping, you can open the project folder in your code editor and continue with the next steps.


## 2. Install Dependencies

Navigate into the project directory and install the required Node.js packages:

```bash
npm install
# or if you use yarn
yarn install
```

## 3. Environment Variables Configuration

The project uses environment variables for configuration. A `.env.example` file is provided as a template.

1.  Create a `.env` file in the root of your project by copying `.env.example`:
    ```bash
    cp .env.example .env
    ```
2.  Open the newly created `.env` file and update the variables as needed. Pay close attention to database connection strings, JWT secrets, and any third-party API keys (e.g., Google OAuth credentials, SendGrid API key).

    **Example `.env` (excerpt):**
    ```
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

## 4. Database Setup (with Docker Compose)

This template uses Docker Compose to manage local database instances (PostgreSQL or MySQL).

1.  **Choose your database:**
    *   The default `docker-compose.yml` uses PostgreSQL.
    *   If you prefer MySQL, use `docker-compose.mysql.yml`.
    *   If you explicitly want to use the `docker-compose.postgres.yml` (which is identical to the default `docker-compose.yml` for PostgreSQL setup), you can specify it.

2.  **Start the database container:**
    ```bash
    # For PostgreSQL (using the default docker-compose.yml)
    docker compose up -d

    # Or for MySQL (specifying the mysql compose file)
    # docker compose -f docker-compose.mysql.yml up -d

    # Or for PostgreSQL (specifying the postgres compose file)
    # docker compose -f docker-compose.postgres.yml up -d
    ```
    This command will pull the database image (if not already present) and start a container in the background.

3.  **Create Prisma client and Run Prisma Migrations:**
    Once your database container is running, apply the Prisma migrations to set up your database schema:
    ```bash
    npm run prisma:generate
    npm run prisma:migrate:dev
    ```
    Prisma will prompt you for a migration name if you haven't provided one or if it's the first migration.

4.  **Seed the Database (Optional):**
    You can populate your database with initial data using the Prisma seed script:
    ```bash
    npx prisma db seed
    ```
    Review `prisma/seed.ts` to understand what data will be added.

## 5. Running the App and Database Together (Recommended)

For the most straightforward development experience, you can start the database and the application services simultaneously using a single command. This method uses Docker Compose to orchestrate all services and includes hot-reloading for the app.

The Docker Compose setup is modular. You need to combine the base `docker-compose.yml` file with the development override and a database-specific file.

*   **For PostgreSQL:**
    ```bash
    docker compose -f docker-compose.yml -f docker-compose.override.yml -f docker-compose.postgres.yml up --build
    ```
*   **For MySQL:**
    ```bash
    docker compose -f docker-compose.yml -f docker-compose.override.yml -f docker-compose.mysql.yml up --build
    ```

Your application will be running with hot-reloading at `http://localhost:5001`.

**Note:** After the Docker compose builds and runs the entire app, you still need to create a Prisma client using "npm run prisma:generate" and then apply migrations "npm run prisma:migrate:dev"

## 6. Running the Application Manually

If you prefer to manage the application process directly on your host machine (outside of Docker), you can run it manually. First, ensure your database is running (see Step 4).

You can run the application in development mode (with hot-reloading) or build it for production.

### Development Mode

To run the application in development mode, which includes TypeScript compilation and hot-reloading:

```bash
npm run dev
# or
yarn dev
```
The API server will typically start on `http://localhost:5001` (or the port specified in your `.env` file).

For development with file watching and automatic restarts, you can use:
```bash
npm run dev:watch
# or
yarn dev:watch
```
If you have a local `.env.local` file for specific local development environment variables, use:
```bash
npm run dev:watch:local
# or
yarn dev:watch:local
```

### Production Build

To build the application for production and then run it:

```bash
# Build the TypeScript code
npm run build
# or
yarn build

# Start the compiled application
npm start
# or
yarn start
```

## 7. Available npm Scripts

This project provides several npm scripts to streamline common development and maintenance tasks:

*   `npm run build`: Compiles the TypeScript source code into JavaScript and copies generated files.
*   `npm start`: Builds the application, ensures Prisma migrations are deployed, generates Prisma client, and then starts the compiled Node.js server. This is typically used for production.
*   `npm run dev`: Starts the application in development mode using `ts-node`, without file watching.
*   `npm run dev:watch`: Starts the application in development mode with `nodemon`, watching for TypeScript file changes and restarting the server.
*   `npm run dev:watch:local`: Similar to `dev:watch`, but loads environment variables from `.env.local` first, then `.env`.
*   `npm test`: Runs all Jest tests.
*   `npm run prisma:generate`: Generates the Prisma Client based on `prisma/schema.prisma`.
*   `npm run prisma:migrate:dev`: Creates and applies new Prisma migrations in a development environment.
*   `npm run prisma:migrate:deploy`: Applies all pending Prisma migrations. This is used in production environments.
*   `npm run prisma:studio`: Opens Prisma Studio, a visual editor for your database.
*   `npm run seed`: Executes the Prisma seed script to populate the database with initial data.
*   `npm run lint`: Runs ESLint to analyze code for potential errors and style violations.
*   `npm run type-check`: Performs a TypeScript type check without emitting any files.
*   `npm run format`: Formats all TypeScript files using Prettier.
*   `npm run prepare`: Sets up Husky Git hooks. This script runs automatically after `npm install`.

## 8. Initial API Interaction

Once the server is running, you can verify its status by accessing the health endpoint:

*   Open your web browser or an API client (like Postman or Insomnia) and navigate to:
    `http://localhost:5001/v1/health`

You should receive a JSON response indicating the API's health.

Congratulations! You have successfully set up and run the Node.js Advanced Starter Template. You are now ready to explore its features and start building your API.