this is an advnaced nodejs template meant for developers to help them on their freelance jobs and for educational purposes.
this is a paid template.

## Development Environment

This template is configured to use Docker for a consistent and reproducible development environment.

### Environment Variables

This project uses two primary environment files:

*   `.env`: Used by `docker-compose` when running the application services. It should contain variables for the containerized environment (e.g., `DATABASE_URL` pointing to `db`).
*   `.env.local`: Used for running commands directly on your host machine, such as `prisma studio` or `prisma migrate`. It should contain variables for connecting to services from your host (e.g., `DATABASE_URL` pointing to `localhost`).

**`.env.local` is ignored by Git.** You will need to create it by copying `.env.example` and adjusting the variables.

### Docker Compose Setup

The Docker Compose setup is modular to allow for easy switching between database providers.

*   `docker-compose.yml`: The base configuration for the `app` and `redis` services.
*   `docker-compose.override.yml`: Applies development-specific settings, like using `Dockerfile.dev` for hot-reloading.
*   `docker-compose.postgres.yml` / `docker-compose.mysql.yml`: Contains the configuration for the chosen database service.

To run the application, you must explicitly specify all three configuration files. **It is recommended to use the `docker compose` v2 command (without the hyphen).**

**PostgreSQL:**
```bash
sudo docker compose -f docker-compose.yml -f docker-compose.override.yml -f docker-compose.postgres.yml up --build
```

**MySQL:**
```bash
sudo docker compose -f docker-compose.yml -f docker-compose.override.yml -f docker-compose.mysql.yml up --build
```

---

## Switching Database Provider

1.  **Update `prisma/schema.prisma`:**
    Change the `provider` in the `datasource` block to `"postgresql"`, `"mysql"`, or `"sqlite"`.

2.  **Update `.env` and `.env.local`:**
    Update the `DATABASE_URL` in both files to match your new provider. Remember to use `db` as the hostname in `.env` (for Docker) and `localhost` in `.env.local` (for local commands).

3.  **Regenerate Prisma Client:**
    ```bash
    npm run prisma:generate
    ```

4.  **Run Migrations:**
    Use the `prisma:migrate:dev` script, which is pre-configured to use your `.env.local` file.
    ```bash
    npm run prisma:migrate:dev
    ```

---

## Local Development and Prisma Studio

Commands that need to connect to the database from your host machine (not from within the `app` container) are configured to automatically use the `.env.local` file.

This includes:
*   `npm run prisma:studio`
*   `npm run prisma:migrate:dev`
*   `npm run seed`

To use Prisma Studio, ensure your Docker containers are running, then run the command. It will connect to the database using the `DATABASE_URL` in your `.env.local` file.

---

## Production Deployment Strategy

### Docker Compose: For Development Only

Docker Compose is an exceptional tool for development but is **not recommended for running applications in production**. It is designed for single-host use and lacks the orchestration features (like self-healing, rolling updates, and advanced load balancing) required for a scalable and highly available application.

### Production-Ready Deployment Options

Your `Dockerfile` is the key artifact for production. It creates a portable image of your application that can be deployed to any modern cloud platform. The `docker-compose.*.yml` files serve as a blueprint for the services and environment variables your application needs.

#### Option 1: Platform as a Service (PaaS) - Recommended
This is the fastest and most efficient path to a robust deployment, abstracting away the infrastructure.

*   **Platforms:** Render, Fly.io, Heroku.
*   **Workflow:**
    1.  Connect your Git repository to the PaaS.
    2.  The platform will use the `Dockerfile` to build and deploy your application image.
    3.  Use the PaaS dashboard to provision a **managed database** (e.g., Render PostgreSQL, Heroku Postgres) and a **managed Redis instance**.
    4.  The platform will provide you with connection strings (`DATABASE_URL`, `REDIS_HOST`). Add these as environment variables for your application service within the PaaS.

#### Option 2: Container Orchestration - For Advanced Scale
This approach offers maximum control and is the standard for larger applications.

*   **Platforms:** Kubernetes (we recommend a managed service like GKE, EKS, or AKS) or Amazon ECS.
*   **Workflow:**
    1.  Write configuration files (e.g., Kubernetes YAML) that define your production environment. Your `docker-compose.yml` serves as a reference for this.
    2.  **`deployment.yaml`:** Defines your `app` service, pointing to the Docker image you've pushed to a registry (e.g., Docker Hub, ECR, GCR).
    3.  **`service.yaml`:** Exposes your application to the internet, usually via a load balancer.
    4.  Provision managed database and Redis instances separately.
    5.  Inject the production connection strings and other secrets securely into your deployment configuration.

### Key Production Principles

*   **Use Managed Services:** Never run your own database in a container in production for a serious application. Use a managed service (e.g., Amazon RDS, Google Cloud SQL) for data persistence. They handle backups, security, and scaling for you.
*   **Stateless Application:** Your application container is stateless. All persistent data (database, Redis, file uploads) should be handled by external, managed services.
*   **Configuration via Environment:** All production secrets and configurations (API keys, database URLs) must be injected as environment variables, not hardcoded.
