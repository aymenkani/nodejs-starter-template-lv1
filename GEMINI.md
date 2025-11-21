# Node.js Advanced Starter Template Guide

Welcome! This document is your comprehensive guide to developing and deploying applications with this professional starter template. Its goal is to get you from cloning the repository to deploying a production-ready application as quickly and smoothly as possible.

## 1. Local Development Setup

First, you need to get the application running on your local machine. You have two primary options.

**Prerequisites:**
*   Node.js (v18 or later)
*   Docker and Docker Compose
*   Git

### Step 1: Clone the Repository
```bash
git clone <your-repository-url>
cd <repository-name>
```

### Step 2: Configure Environment Variables
This project uses `.env` files for configuration. You'll need to create two files from the example:

1.  **For Docker Development (`.env`):** This file is used by Docker Compose.
    ```bash
    cp .env.example .env
    ```
    You can leave the default values in this file, as they are configured to work with Docker Compose out-of-the-box (e.g., `DATABASE_URL` points to the `db` service).

2.  **For Local Commands (`.env.local`):** This file is used for running commands on your host machine, like database migrations or tests.
    ```bash
    cp .env.example .env.local
    ```
    In `.env.local`, you must change the hostnames for the database and Redis to `localhost` since the commands will run from your machine, not inside a container.
    ```diff
    - DATABASE_URL="postgresql://user:password@db:5432/mydatabase?schema=public"
    + DATABASE_URL="postgresql://user:password@localhost:5432/mydatabase?schema=public"
    - REDIS_HOST=redis
    + REDIS_HOST=localhost
    ```

## 2. Running the Application

### Option A: With Docker (Recommended)
This is the recommended approach. It spins up the application, database, and Redis in a consistent, containerized environment without requiring you to install a database or Redis on your machine.

1.  **Start the services:**
    The Docker Compose setup is modular. You need to combine the base, override (for development), and database-specific files.

    *   **For PostgreSQL:**
        ```bash
        docker-compose -f docker-compose.yml -f docker-compose.override.yml -f docker-compose.postgres.yml up --build
        ```
    *   **For MySQL:**
        ```bash
        docker-compose -f docker-compose.yml -f docker-compose.override.yml -f docker-compose.mysql.yml up --build
        ```
    Your application will be running with hot-reloading at `http://localhost:5001`.

2.  **Run Database Migrations:**
    In a separate terminal, run the `prisma:migrate:dev` command. It's configured to use your `.env.local` file to connect to the database running in Docker.
    ```bash
    npm run prisma:migrate:dev
    ```

### Option B: Locally without Docker
This approach is for developers who prefer to run the database and Redis on their host machine.

1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Run Migrations:**
    Ensure your local database server is running and that `.env.local` points to it correctly.
    ```bash
    npm run prisma:migrate:dev
    ```
3.  **Start the Development Server:**
    This command uses your `.env.local` file and starts the server with hot-reloading.
    ```bash
    npm run dev:watch:local
    ```

## 3. CI/CD & Deployment Workflow

This template is equipped with a professional CI/CD pipeline using GitHub Actions. The goal is to fully automate the testing and release process, ensuring that every change is validated and every release is standardized.

### Continuous Integration (CI)
The CI pipeline's goal is to ensure code quality and prevent bugs from being merged.

*   **Workflow File:** `.github/workflows/ci.yml`
*   **Trigger:** Runs automatically on every `push` and `pull_request` to the `main` branch.
*   **Jobs:**
    1.  **Lint & Type-Check:** These jobs run in parallel to quickly check for code style errors and TypeScript type issues.
    2.  **Test:** This job runs after linting and type-checking. It tests the application against multiple Node.js versions (18.x, 20.x) in an environment with live Postgres and Redis services, just like production.
    3.  **Validate Docker Build:** After all tests pass, this final job builds the production `Dockerfile` to guarantee that your application's deployment artifact is always buildable.

### Continuous Deployment (CD)
The CD pipeline's goal is to create a standardized, versioned, and deployable artifact (a Docker image).

*   **Workflow File:** `.github/workflows/publish.yml`
*   **Trigger:** Runs automatically ONLY when you push a new git tag in the format `v*.*.*` (e.g., `v1.0.0`, `v1.2.3`). It can also be run manually from the Actions tab.
*   **Action:**
    1.  Builds the production `Dockerfile`.
    2.  Tags the image with the version number.
    3.  Pushes the tagged image to the **GitHub Container Registry (GHCR)**, linked to this repository.

### How to Release and Deploy Your Application

**Step 1: Release a New Version**
When you're ready to release a new version of your application, simply create and push a git tag. This is the single source of truth for a release.

```bash
# Example: Releasing version 1.0.0
git tag v1.0.0
git push origin v1.0.0
```
Pushing the tag will trigger the `publish.yml` workflow, and a new Docker image `ghcr.io/your-username/your-repo:1.0.0` will be published.

**Step 2: Deploy the Image**
Your application is now packaged and available in GHCR. You can deploy it to any modern cloud provider that supports Docker containers.

*   **Recommended Path (PaaS):** Use a platform like **Render** or **Fly.io**.
    1.  In your provider's dashboard, create a new web service from a Docker image.
    2.  Point it to the image you just published in GHCR (e.g., `ghcr.io/your-username/your-repo:1.0.0`). You'll need to provide credentials for GHCR.
    3.  Provision a managed database and Redis instance from your provider.
    4.  Inject the production database URL, Redis host, and other secrets as environment variables in the provider's dashboard.

*   **Advanced Path (Orchestration):** For larger-scale applications, you can deploy the image to a Kubernetes cluster (e.g., GKE, EKS, AKS) or Amazon ECS. Your `docker-compose.yml` can serve as a reference for the services and environment variables your application needs.

## 4. Advanced Guides

### Switching the Database
To switch from PostgreSQL to another database like MySQL:
1.  **Update `prisma/schema.prisma`:** Change the `provider` in the `datasource` block to `"mysql"`.
2.  **Update `.env` and `.env.local`:** Change the `DATABASE_URL` to a MySQL connection string.
3.  **Regenerate Prisma Client:** `npm run prisma:generate`
4.  **Create New Migrations:** `npm run prisma:migrate:dev`