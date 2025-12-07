<!-- Email Subscription Section -->
<div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 32px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
  <h2 style="font-size: 1.875rem; font-weight: 800; color: #111827; margin-top: 0; margin-bottom: 12px;">🚀 Stay Ahead of the Curve!</h2>
  <p style="font-size: 1.125rem; color: #4b5563; margin-top: 0; margin-bottom: 24px;">
    Subscribe to get new updates about this template, plus early access to new tools, courses, and free resources that will help you succeed in the new era of technology and software engineering.
  </p>
  <!-- Gumroad Form -->
  <style>
    #gumroad-follow-form-embed {
      display: flex;
      gap: 8px;
      max-width: 480px;
      margin: 0 auto;
    }
    #gumroad-follow-form-embed-input {
      flex: 1 1 0%;
    }
  </style>
  <form action="https://gumroad.com/follow_from_embed_form" method="post" id="gumroad-follow-form-embed">
    <input type="hidden" name="seller_id" value="8461277886488"/>
    <input id="gumroad-follow-form-embed-input" type="email" placeholder="you@example.com" name="email" required style="flex-grow: 1; padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 1rem; color: #111827; background-color: #ffffff; box-shadow: inset 0 2px 4px 0 rgba(0,0,0,0.05);">
    <button type="submit" id="gumroad-follow-form-embed-button" style="background-color: #7c3aed; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 1rem; border: none; cursor: pointer; transition: background-color 0.3s ease;">
      Subscribe
    </button>
  </form>
  <p style="font-size: 0.875rem; color: #6b7280; margin-top: 16px;">No spam, just high-value content. Unsubscribe at any time.</p>
</div>

# Welcome to the Documentation

This documentation provides a comprehensive guide to the Nodejs Advanced Starter Template (*Node.js Enterprise Launchpad*). It covers everything from initial setup and core concepts to deployment and advanced features, helping you build, test, and deploy your API with confidence.

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

## 💎 I’m saving you 20 hours of setup (Free Download)
## exclusive-student-offer
* ✅ **Lifetime Updates** (Node versions, Security patches)
* ✅ **Commercial Use Allowed** (Use it for client work)
* ✅ DevOps-Ready: Docker Compose for App, Redis, & Postgres.
* ✅ CI/CD Pipeline: GitHub Actions for testing & linting.
* ✅ Quality Suite: Pre-configured Jest, ESLint, Prettier & TypeScript.

<div style="text-align: center; margin: 40px 0;">
  <a href="https://aymenkani.gumroad.com/l/nodejs-enterprise-launchpad/UDEMY-VIP?option=jO9w7s3jkf48MobF50pBTw%3D%3D&_gl=1*1cidzeq*_ga*NTYyNDU1Mjc4LjE3NjA5NzUzNDg.*_ga_6LJN6D94N6*czE3NjUxMTE4MjUkbzcwJGcxJHQxNzY1MTE1ODgwJGo2MCRsMCRoMA.." style="background-color: #7c3aed; color: white; padding: 15px 30px; border-radius: 5px; text-decoration: none; font-weight: bold; font-size: 1.2em; display: inline-block; transition: background-color 0.3s ease; margin-bottom: 2rem;" target="_blank" rel="noopener noreferrer">
    Get the <span style="font-weight: normal; font-size: 1.3em; opacity: 0.9;">FREE</span> Production DevOps Foundation (The Skeleton) ➔
  </a>
  <p style="font-size: 1.125rem; color: #4b5563; margin-top: 0; margin-bottom: 24px;">
    Subscribe to get new updates about this template, plus early access to new tools, courses, and free resources that will help you succeed in the new era of technology and software engineering.
  </p>
  <!-- Gumroad Form -->
  <form action="https://gumroad.com/follow_from_embed_form" method="post" id="gumroad-follow-form-embed">
    <input type="hidden" name="seller_id" value="8461277886488"/>
    <input id="gumroad-follow-form-embed-input" type="email" placeholder="you@example.com" name="email" required style="flex-grow: 1; padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 1rem; color: #111827; background-color: #ffffff; box-shadow: inset 0 2px 4px 0 rgba(0,0,0,0.05);">
    <button type="submit" id="gumroad-follow-form-embed-button" style="background-color: #7c3aed; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 1rem; border: none; cursor: pointer; transition: background-color 0.3s ease;">
      Subscribe
    </button>
  </form>
  <p style="font-size: 0.875rem; color: #6b7280; margin-top: 16px;">No spam, just high-value content. Unsubscribe at any time.</p>
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