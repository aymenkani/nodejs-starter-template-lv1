# Node.js Advanced Starter Template

# Introduction and Project Overview

Welcome to the Node.js Advanced Starter Template documentation! This template is designed to provide a robust, scalable, and feature-rich foundation for building modern Node.js API applications. It integrates a selection of industry-standard tools and best practices to accelerate your development process and ensure high-quality, maintainable code.

## What is this Template For?

This template is ideal for developers and teams looking to kickstart new API projects with a solid architectural base. It abstracts away much of the initial setup and configuration, allowing you to focus on developing your core business logic. Whether you're building a microservice, a backend for a web application, or a standalone API, this template provides the necessary infrastructure to get started quickly and efficiently.

## Key Features

*   **Authentication & Authorization:** Secure your API with JSON Web Tokens (JWT) and integrate with third-party providers like Google OAuth2.0. Includes robust password reset functionality.
*   **Database Management:** Seamless integration with Prisma ORM, supporting PostgreSQL and MySQL databases. Features include schema definition, migrations, and seeding.
*   **Background Job Processing:** Efficiently handle long-running tasks and asynchronous operations using BullMQ, a powerful Redis-backed queueing system.
*   **API Documentation:** Automatically generate and serve interactive API documentation using OpenAPI (Swagger UI), making your API easy to understand and consume.
*   **Input Validation:** Ensure data integrity and improve API reliability with schema-based validation using Zod.
*   **Error Handling:** Centralized and consistent error handling with custom `ApiError` classes and global middleware.
*   **Structured Logging:** Implement effective monitoring and debugging with structured logging using Pino.
*   **Configuration Management:** Flexible environment variable management for different deployment environments.
*   **Development & Production Ready:** Includes Docker support for containerization, making local development consistent and deployment straightforward.
*   **Containerization Strategy:** Implemented a Multi-Stage Dockerfile (`Dev` -> `Builder` -> `Runner`) to create lean, secure, and efficient production images while maintaining a feature-rich development environment.
*   **Code Quality & Maintainability:** Enforced code style with ESLint and Prettier, along with pre-commit hooks using Husky.
*   **AI-Powered RAG Pipeline:** Integrated Retrieval-Augmented Generation (RAG) system using Google Gemini. Features asynchronous document ingestion, Visual RAG (extracting intelligence from images), semantic search with `pgvector`, and streaming AI responses.
*   **Testing:** Comprehensive testing setup with Jest for unit and integration tests, including database testing strategies.
*   **CI/CD:** Pre-configured GitHub Actions workflows for continuous integration (linting, testing, building) and continuous deployment.

## AI & RAG Intelligence

This boilerplate features a first-class **RAG (Retrieval-Augmented Generation) Intelligence Pipeline**, allowing you to build context-aware AI agents that "speak" to your data.

1.  **Ingestion:** Automatically parse PDFs and text files, or use **Visual RAG** to extract meaning from images using Gemini Vision.
2.  **Storage:** Securely store documents in **Cloudflare R2** with S3-compatible API and pre-signed URL support for private access.
3.  **Vector Store:** Chunks and embeds data into a PostgreSQL `pgvector` store for lightning-fast semantic retrieval.
4.  **Chat Agent:** A streaming AI agent that rewrites queries for better context, retrieves relevant "knowledge", and answers with smart citations.

Check the [RAG Intelligence Pipeline Documentation](documentation/docs/rag-intelligence-pipeline.md) for a deep dive into the architecture.

## Comprehensive Documentation

This project includes a full documentation website built with **MkDocs** and the Material theme, located in the `documentation/` directory. This website contains detailed explanations of every part of the template, from setup to deployment, and includes a powerful search feature to help you find information quickly.

### How to Run the Documentation Website

To view the documentation locally, follow these steps:

1.  **Navigate to the docs directory:**
    ```bash
    cd mk-docs-website/docs-website
    ```

2.  **Install dependencies:**
    You'll need Python and pip installed. Install the required packages using the `requirements.txt` file.
    ```bash
    pip install -r ../requirements.txt
    ```

3.  **Start the MkDocs server:**
    This command will start a local server, and you can view the documentation in your browser.
    ```bash
    mkdocs serve
    ```

4.  **Open in your browser:**
    By default, the site will be available at [http://127.0.0.1:8000](http://127.0.0.1:8000).

## Core Technologies Stack

*   **Runtime:** Node.js
*   **Web Framework:** Express.js
*   **Language:** TypeScript
*   **ORM:** Prisma
*   **Authentication:** Passport.js (JWT, Google OAuth2.0)
*   **Job Queue:** BullMQ (with Redis)
*   **API Documentation:** OpenAPI (Swagger UI)
*   **Validation:** Zod
*   **Logging:** Pino
*   **AI SDK:** Vercel AI SDK
*   **LLM:** Google Gemini (Pro, Flash, Vision)
*   **Vector Database:** PostgreSQL with `pgvector`
*   **Storage:** Cloudflare R2 (S3 Compatible)
*   **Containerization:** Docker
*   **Testing:** Jest
*   **Code Quality:** ESLint, Prettier, Husky
*   **CI/CD:** GitHub Actions

## Target Audience

This template is designed for:

*   **Backend Developers:** Who want a modern, opinionated Node.js API boilerplate.
*   **Full-stack Developers:** Looking for a robust backend foundation to pair with their frontend applications.
*   **Teams:** Aiming for consistency and best practices across their Node.js projects.

By leveraging this template, you can significantly reduce setup time and focus on delivering value faster, with confidence in the underlying architecture.

## Deploying to Render

This template includes a `render.yaml` file to easily deploy the application to [Render](https://render.com/) using Blueprints.

### Free Tier Limitations

When using Render's free tier, please be aware of the following limitations:

*   **Redis Data Loss:** The `redis` service on the free plan is ephemeral. If your instance restarts for any reason, all data stored in Redis (such as session information and cached data) will be permanently lost. This is acceptable for testing and development, but it is highly recommended to upgrade to a paid plan for production environments to ensure data persistence.

*   **PostgreSQL Database:** The free PostgreSQL database is subject to limitations, including expiration after 90 days of inactivity or limited usage quotas. For production applications requiring long-term data storage, consider upgrading to a paid database plan.

*   **`repo` Field in `render.yaml`:** The `repo` field in the `render.yaml` file is typically not required if you create the Blueprint directly from the Render dashboard while connected to your GitHub account. Render automatically associates the repository. Removing this line can make the configuration more generic and portable for your customers.
