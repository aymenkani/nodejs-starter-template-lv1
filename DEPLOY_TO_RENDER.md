# Deploying to Render

The template includes a `render.yaml` file, which is a blueprint for deploying your application to Render.

### 🚨 danger "Important: Environment Variables" 

**Critical Setup Step:** Render Blueprints cannot automatically import secrets from your local `.env` file for security reasons.

- **Do NOT** upload your `.env` file to the "Secret Files" tab in Render (this will not work with the app structure).
- **DO** copy the content of your local `.env` and paste it into the "Environment Variables" section of your Render Service Dashboard.

When you copy your .env content to paste into Render, exclude these lines:

❌ NODE_ENV=... (Handled by Docker)

❌ JWT_SECRET=... (Handled by Render Blueprint)

❌ PORT=... (Render sets this automatically to match your EXPOSE instruction)

Keep everything else (AWS keys, Google keys, ADMIN_EMAIL, JWT_RESET_PASSWORD_SECRET, CLIENT_URL, etc.).

### Default Deployment (Free Tier)
By default, the `Dockerfile` and `render.yaml` are configured for the Render Free Tier.

**Strategy:** Migrations and Seeding run automatically inside the Docker Startup Command.

**Why:** The Free Tier allows only 1 instance. Running migrations on startup is safe because there are no race conditions with a single instance.

**How to Deploy:**

1.  Connect your GitHub repository to Render.
2.  Create a **New Blueprint Instance**.
3.  Render will detect `render.yaml` and provision the Database, Redis, and Web Service automatically.

#### Free Tier Limitations

!!! warning "Important Considerations for Render's Free Tier"
    When using Render's free tier, please be aware of the following limitations:

*   **Redis Data Loss:** The `redis` service on the free plan is ephemeral. If your instance restarts for any reason, all data stored in Redis (such as session information and cached data) will be permanently lost. This is acceptable for testing and development, but it is **highly recommended** to upgrade to a paid plan for production environments to ensure data persistence.

*   **PostgreSQL Database:** The free PostgreSQL database is subject to limitations, including expiration after 90 days of inactivity or limited usage quotas. For production applications requiring long-term data storage, consider upgrading to a paid database plan.

*   **`repo` Field in `render.yaml`:** The `repo` field in the `render.yaml` file is typically not required if you create the Blueprint directly from the Render dashboard while connected to your GitHub account. Render automatically associates the repository. Removing this line can make the configuration more generic and portable.

## Scaling & Production (Render Pro)
### How to Upgrade to Render Pro
By default, this template uses the `start:with-db` logic inside the Docker image. If you upgrade to a Paid Plan (Starter/Standard) and want to scale to multiple instances (replicas), you must change this behavior to prevent **Database Locking** (multiple instances trying to migrate simultaneously).

**Steps to configure for Scaling:**

1.  Open `render.yaml`.
2.  Change `plan` from `free` to `starter` (or your desired paid plan).
3.  **Add a Pre-Deploy Command:** This ensures migrations run only once, on a temporary instance, before the new version goes live.

```yaml
# render.yaml
services:
    - type: web
    name: my-app
    plan: starter # or standard
    # ...
    preDeployCommand: "sh -c 'npx prisma migrate deploy && npm run seed:prod'"
```

4.  **Override the Docker Command:** Tell Render to ignore the default `Dockerfile` command (which includes migrations) and just start the server.

```yaml
# render.yaml
services:
    - type: web
    name: my-app
    # ...
    dockerCommand: "node dist/server.js"
```

This configuration ensures zero-downtime deployments and allows you to scale to 10+ instances safely.