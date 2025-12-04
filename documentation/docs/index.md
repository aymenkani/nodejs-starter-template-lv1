
# Welcome to the Documentation

This documentation provides a comprehensive guide to the Node.js Advanced Starter Template. It covers everything from initial setup and core concepts to deployment and advanced features, helping you build, test, and deploy your API with confidence.

## 🚀 Overview

This template is a feature-rich foundation for building scalable and maintainable Node.js applications. It integrates best-in-class tools for authentication, database management, background jobs, and more, allowing you to focus on your business logic instead of boilerplate code.

> **For my Udemy Students**
> You learned the *concepts* in the course. This template is the *tool* used in the real world. It includes the advanced architectural patterns (Service Layer, DTOs, Centralized Error Handling) that take too long to code manually for every project.

---

## 🚀 Why Use This Template?

You could spend the next **20 hours** setting up ESLint, configuring Winston logging, writing generic CRUD services, and fighting with Docker configurations... or you could run one command and start coding your business logic immediately.

### What's Included?

This isn't just a folder structure; it's a complete ecosystem.

| Feature | The "Course" Way | The "Pro" Way (This Template) |
| :--- | :--- | :--- |
| **Architecture** | Logic in Routes (Messy) | ✅ **Service-Repository Pattern** (Scalable) |
| **Authentication** | 🔑 Basic JWT | ✅ **JWT + Refresh Tokens + Social Login** |
| **Database** | 💾 Direct DB | ✅ **Prisma ORM** (Fully Typed & Migrated) |
| **Validation** | 📝 Manual Checks | ✅ **Zod Schemas** & Middleware |
| **Documentation** | 🚫 | ✅ **Swagger/OpenAPI** Auto-generated |
| **CI/CD** | 👨‍💻 Manual Deploy | ✅ **GitHub Actions** Pipeline Ready |
| **Background Jobs** | 🚫 | ✅ **BullMQ & Redis** (Asynchronous Processing) |
| **Logging** | 🪵 `console.log` | ✅ **Pino** (Structured & Production-Ready) |
| **Security** | 🔒 Basic | ✅ **Helmet, CORS, Rate Limiting, XSS** (Comprehensive) |
| **Token Management** | 🔑 Simple JWT | ✅ **JWT Blacklisting** (Invalidate compromised tokens) |
| **Real-time Auth** | 🚫 | ✅ **Socket.IO Auth Middleware** (Secure WebSockets) |
| **Notifications** | 🔔 Basic/Real-time | ✅ **Offline User Notifications** (Deliver on reconnect) |
| **Password Reset** | 🔑 Simple Token | ✅ **Secure Password Reset** (Hashed JWT, Opaque Token, History Check) |
| **Deployment** | 👨‍💻 Manual | ✅ **Render-Ready** (Docker, AWS, GCP, etc.) |
| **AI Integration** | 🚫 | 🚀 **AI Agent Scalability** (Designed for easy integration with context AI config) |
| **File Uploads** | 📤 Direct Uploads | ✅ **S3 Presigned URLs** (Secure & Scalable) |

---

## ✨ Key Features

- **Modern Architecture**: Built with TypeScript and a layered design (Service, Controller, Route).
- **Authentication**: JWT and Google OAuth 2.0 support out-of-the-box.
- **Database**: Prisma ORM for type-safe database access (PostgreSQL & MySQL).
- **Background Jobs**: Asynchronous task processing with BullMQ and Redis.
- **API Documentation**: Automatic OpenAPI (Swagger) generation.
- **Containerization**: Dockerized for consistent development and production environments.
- **Testing**: Ready-to-use testing suite with Jest.
- **CI/CD**: GitHub Actions for automated testing and deployment.

---

## 💎 Exclusive Student Offer

This template is sold publicly for **$49** to agencies and freelancers.

However, as a thank you for taking my course, you get access to the **Student License**.

* ✅ **Lifetime Updates** (Node versions, Security patches)
* ✅ **Commercial Use Allowed** (Use it for client work)
* ✅ **Private Discord Access**

<div style="text-align: center; margin: 40px 0;">
  <a href="https://gumroad.com/YOUR-LINK-HERE" style="background-color: #7c3aed; color: white; padding: 15px 30px; border-radius: 5px; text-decoration: none; font-weight: bold; font-size: 1.2em;">
    Get the Template (80% OFF for Students) ➔
  </a>
  <p style="margin-top: 10px; font-size: 0.9em; color: #666;">
    Use code <code>UDEMY-VIP</code> at checkout
  </p>
</div>

---

## 📚 Getting Started

To get started, explore the following sections:

- **[Introduction](introduction.md)**: A high-level overview of the template.
- **[Core Concepts](core-concepts.md)**: Understand the foundational principles of the architecture.
- **[Getting Started](getting-started.md)**: A step-by-step guide to setting up your project.

## 🛠️ Running the Documentation Locally

You can run this documentation site on your local machine to have a live-reloading server for easy browsing.

1.  **Navigate to the `documentation` directory:**
    ```bash
    cd documentation
    ```

2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Start the server:**
    ```bash
    mkdocs serve
    ```

The site will be available at `http://127.0.0.1:8000`.
