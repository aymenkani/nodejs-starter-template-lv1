# Layered Express API

[![CI](https://github.com/your-username/your-repo/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/your-repo/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Node.js API with a layered architecture, built with Express, TypeScript, Prisma, and a host of other modern technologies. This template is designed to provide a robust, scalable, and feature-rich foundation for building modern API applications.

## Introduction

This template is ideal for developers and teams looking to kickstart new API projects with a solid architectural base. It abstracts away much of the initial setup and configuration, allowing you to focus on developing your core business logic.

For a full overview of the project, please see the [Introduction documentation](./docs/introduction.md).

## Key Features

*   **Authentication & Authorization:** JWT and Google OAuth2.0 with Passport.js.
*   **Database Management:** Prisma ORM with support for PostgreSQL and MySQL.
*   **Background Job Processing:** BullMQ for handling long-running tasks.
*   **API Documentation:** OpenAPI (Swagger UI) for interactive API documentation.
*   **Input Validation:** Zod for schema-based validation.
*   **Error Handling:** Centralized error handling with custom `ApiError` classes.
*   **Structured Logging:** Pino for effective monitoring and debugging.
*   **Containerization:** Docker support for development and production.
*   **Code Quality:** ESLint, Prettier, and Husky for code consistency.
*   **Testing:** Jest for unit and integration tests.
*   **CI/CD:** GitHub Actions for continuous integration and deployment.

## Core Technology Stack

*   **Runtime:** Node.js
*   **Web Framework:** Express.js
*   **Language:** TypeScript
*   **ORM:** Prisma
*   **Authentication:** Passport.js (JWT, Google OAuth2.0)
*   **Job Queue:** BullMQ (with Redis)
*   **API Documentation:** OpenAPI (Swagger UI)
*   **Validation:** Zod
*   **Logging:** Pino
*   **Containerization:** Docker
*   **Testing:** Jest

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or higher)
- [Docker](https://www.docker.com/get-started) (for running local database)
- [pnpm](https://pnpm.io/installation) (or npm/yarn)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repo.git
    cd your-repo
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**
    Copy the example environment file and update it with your configuration.
    ```bash
    cp .env.example .env.local
    ```
    > See the [configuration docs](./docs/core-concepts.md#8-configuration-management) for more details.

4.  **Start the database:**
    This command starts a PostgreSQL container.
    ```bash
    docker-compose -f docker-compose.postgres.yml up -d
    ```

5.  **Run database migrations:**
    ```bash
    pnpm prisma:migrate:dev
    ```

6.  **Seed the database (optional):**
    ```bash
    pnpm seed
    ```

## Usage

### Running the Application

-   **Development mode with hot-reloading:**
    ```bash
    pnpm dev:watch:local
    ```

-   **Production mode:**
    ```bash
    pnpm start
    ```

The server will be running at `http://localhost:5001`.

### Running Tests

To run the test suite:

```bash
pnpm test
```

### Other Scripts

-   `pnpm lint`: Lint your code with ESLint.
-   `pnpm format`: Format your code with Prettier.
-   `pnpm type-check`: Check for TypeScript errors.
-   `pnpm build`: Compile TypeScript to JavaScript.

## Project Structure

The project follows a layered architecture. For a detailed explanation of the structure, please see the [Project Structure documentation](./docs/project-structure.md).

## Documentation

All documentation is located in the `/docs` directory. Here are some key documents to get you started:

-   [Getting Started](./docs/getting-started.md)
-   [Core Concepts](./docs/core-concepts.md)
-   [API Documentation (OpenAPI)](./docs/api-documentation-openapi.md)
-   [Authentication](./docs/authentication.md)
-   [Database with Prisma](./docs/database-prisma.md)

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](./docs/contributing.md) to get started.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.