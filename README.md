# Node.js Advanced Starter Template

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A feature-rich, scalable, and production-ready starter template for building modern Node.js API applications with Express, TypeScript, and Prisma.

This template is designed to provide a robust foundation for your next API project, integrating a selection of industry-standard tools and best practices to accelerate your development process.

## Key Features

*   **Authentication & Authorization:** Secure your API with JSON Web Tokens (JWT) and integrate with third-party providers like Google OAuth2.0. Includes robust password reset functionality and token blacklisting.
*   **Database Management:** Seamless integration with Prisma ORM, supporting PostgreSQL and MySQL databases. Features include schema definition, migrations, and seeding.
*   **Background Job Processing:** Efficiently handle long-running tasks and asynchronous operations using BullMQ, a powerful Redis-backed queueing system.
*   **API Documentation:** Automatically generate and serve interactive API documentation using OpenAPI (Swagger UI).
*   **Input Validation:** Ensure data integrity and improve API reliability with schema-based validation using Zod.
*   **Error Handling:** Centralized and consistent error handling with custom `ApiError` classes and global middleware.
*   **Structured Logging:** Implement effective monitoring and debugging with structured logging using Pino.
*   **Development & Production Ready:** Includes Docker support for containerization, making local development consistent and deployment straightforward.
*   **Code Quality & Maintainability:** Enforced code style with ESLint and Prettier, along with pre-commit hooks using Husky.
*   **Testing:** Comprehensive testing setup with Jest for unit and integration tests.
*   **CI/CD:** Pre-configured GitHub Actions workflows for continuous integration and deployment.

## Getting Started

To get your local development environment set up and running, please refer to the detailed **[Getting Started Guide](./md-documentation/getting-started.md)**.

## Documentation

This project is extensively documented. For a deeper understanding of the architecture, features, and how to work with the code, please explore the documentation in the **[md-documentation](./md-documentation)** directory.

Key documents include:
*   **[Introduction](./md-documentation/introduction.md)**
*   **[Core Concepts](./md-documentation/core-concepts.md)**
*   **[Project Structure](./md-documentation/project-structure.md)**
*   **[Authentication](./md-documentation/authentication.md)**
*   **[Database with Prisma](./md-documentation/database-prisma.md)**
*   **[Background Jobs with BullMQ](./md-documentation/background-jobs-bullmq.md)**

## Deploying to Render

This template includes a `render.yaml` file to easily deploy the application to [Render](https://render.com/) using Blueprints.

### Free Tier Limitations

When using Render's free tier, please be aware of the following limitations:

*   **Redis Data Loss:** The `redis` service on the free plan is ephemeral. If your instance restarts for any reason, all data stored in Redis (such as session information and cached data) will be permanently lost. This is acceptable for testing and development, but it is highly recommended to upgrade to a paid plan for production environments to ensure data persistence.

*   **PostgreSQL Database:** The free PostgreSQL database is subject to limitations, including expiration after 90 days of inactivity or limited usage quotas. For production applications requiring long-term data storage, consider upgrading to a paid database plan.

*   **`repo` Field in `render.yaml`:** The `repo` field in the `render.yaml` file is typically not required if you create the Blueprint directly from the Render dashboard while connected to your GitHub account. Render automatically associates the repository. Removing this line can make the configuration more generic and portable for your customers.
