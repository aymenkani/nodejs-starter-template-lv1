# Deployment

This template is designed for flexible deployment, supporting containerization with Docker and providing guidance for cloud platforms. This section will cover how to prepare and deploy your application.

## 1. Docker Deployment

Docker provides a consistent environment for your application across development, testing, and production. This template includes `Dockerfile`, `Dockerfile.dev`, and `docker-compose.yml` files to facilitate containerization.

### `Dockerfile`

The `Dockerfile` defines the steps to build a Docker image of your application, primarily for **production deployments**. This image contains your application code, its dependencies, and everything else needed to run it.

**Location:** `Dockerfile` (at the project root)

**Key Stages:**

*   **Build Stage:** Installs dependencies and builds the TypeScript application.
*   **Production Stage:** Creates a lean production image with only the necessary runtime dependencies and the compiled application.

**Building the Docker Image:**

```bash
docker build -t my-node-app .
```
Replace `my-node-app` with your desired image name.

**Running the Docker Container:**

```bash
docker run -p 5001:5001 --env-file ./.env my-node-app
```
*   `-p 5001:5001`: Maps port 5001 on your host to port 5001 in the container.
*   `--env-file ./.env`: Mounts your local `.env` file into the container. **Note:** For production, you should manage environment variables more securely (e.g., Kubernetes Secrets, AWS Secrets Manager, or your cloud provider's secret management service) rather than directly mounting a `.env` file. Refer to [Configuration Management](./core-concepts.md#8-configuration-management) for more details.

### `Dockerfile.dev`

The `Dockerfile.dev` is specifically designed for **local development** within a Docker container. It often includes development-specific tools (like `nodemon` or `ts-node`) and configurations (like volume mounts for hot-reloading) that are not needed in a production image.

**Location:** `Dockerfile.dev` (at the project root)

**Key Differences from `Dockerfile`:**

*   Includes development dependencies.
*   May expose additional ports for debugging.
*   Often sets up `nodemon` or similar tools for automatic restarts on code changes.
*   Typically used in conjunction with `docker-compose.yml` for a full local development environment.

### `docker-compose.yml`

The `docker-compose.yml` file is used for defining and running multi-container Docker applications. It's primarily used for **local development** to easily spin up the application along with its dependencies (like the database and Redis). It can reference `Dockerfile.dev` to build the development image for your application service.

**Location:** `docker-compose.yml` (at the project root)

**Key Services:**

*   `app`: Your Node.js application (often built using `Dockerfile.dev` in development).
*   `db`: Your PostgreSQL or MySQL database.
*   `redis`: The Redis server used by BullMQ.

**Starting Services with Docker Compose (for local development):**

```bash
docker compose up -d
```
This command will build (if necessary) and start all services defined in the `docker-compose.yml` in detached mode.

## 2. Cloud Deployment

This template is designed for flexible deployment to various cloud platforms. The specific steps will vary depending on your chosen provider.

### Render Deployment

The template includes a `render.yaml` file, which is a blueprint for deploying your application to [Render](https://render.com/). Render is a unified cloud platform that allows you to host all your services in one place.

**Location:** `render.yaml` (at the project root)

**How to Deploy to Render:**

1.  **Connect GitHub:** Connect your GitHub repository to your Render account.
2.  **Create a New Blueprint:** In your Render dashboard, create a new Blueprint instance.
3.  **Select Repository:** Choose the repository containing your `render.yaml` file.
4.  **Deploy:** Render will automatically detect the `render.yaml` file and provision all the services (web service, database, Redis) defined within it.

The `render.yaml` typically defines:

*   **Web Service:** Your Node.js application, including build commands, start commands, and environment variables.
*   **Database:** A managed PostgreSQL or Redis instance.
*   **Environment Variables:** Securely configured environment variables for your production environment.

For more detailed instructions on deploying to Render, refer to the `DEPLOY_TO_RENDER.md` file in the project root.

### General Cloud Deployment Considerations

When deploying to other cloud providers (e.g., AWS, Google Cloud, Azure, Heroku), consider the following:

*   **Environment Variables:** Securely manage your environment variables. Never hardcode sensitive information. Use your cloud provider's secret management services. Refer to [Configuration Management](./core-concepts.md#8-configuration-management).
*   **Database:** Use a managed database service (e.g., AWS RDS, Google Cloud SQL) for reliability, scalability, and backups.
*   **Redis:** Use a managed Redis service (e.g., AWS ElastiCache, Google Cloud Memorystore) for your BullMQ queues.
*   **Scalability:** Configure your application to scale horizontally by running multiple instances behind a load balancer.
*   **Monitoring & Logging:** Integrate with your cloud provider's monitoring and logging solutions (e.g., CloudWatch, Stackdriver).
*   **CI/CD Integration:** Integrate your deployment process with your [CI/CD pipeline](./ci-cd-github-actions.md).

## 3. Environment Variables for Production

In production environments, it's critical to manage environment variables securely and effectively. Refer to [Configuration Management](./core-concepts.md#8-configuration-management) for general principles.

*   **Never commit `.env` to Git.**
*   Use strong, unique secrets for `JWT_SECRET` and other sensitive keys.
*   Configure environment variables directly in your cloud provider's settings or through their secret management services.
*   Ensure `NODE_ENV` is set to `production` to enable production optimizations and disable development-only features.

By following these deployment guidelines, you can confidently take your Node.js application from development to a production-ready environment.