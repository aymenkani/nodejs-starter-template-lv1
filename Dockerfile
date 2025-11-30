# Stage 1: Development - Installs all dependencies
FROM node:20-alpine AS development

WORKDIR /app

# Install all dependencies including devDependencies
COPY package.json package-lock.json ./

# Copy the Prisma folder (CRITICAL STEP)
# We need the schema here because 'npm ci' triggers 'prisma generate' via postinstall
COPY prisma ./prisma/

RUN HUSKY=0 npm ci

# Copy source code
COPY . .

# Stage 2: Builder - Builds the application using files from the development stage
FROM development AS builder

# Accept DATABASE_URL as a build argument.
# A dummy URL is sufficient for 'prisma generate' as it doesn't connect to the DB.
ARG DATABASE_URL="postgresql://dummy:dummy@dummy:5432/dummy"
ENV DATABASE_URL=${DATABASE_URL}

# Build the application
RUN npm run build

# Stage 3: Runner - Creates the final production image
FROM node:20-alpine AS runner

# Create a non-root user and group
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

WORKDIR /app

# Set ownership of the app directory BEFORE copying files
RUN chown appuser:nodejs /app

# Switch to the non-root user
USER appuser

# Copy necessary files from the builder stage
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

# Install production dependencies only
RUN npm ci --omit=dev --ignore-scripts

# Because we ignored scripts, the Prisma Client wasn't generated.
# We must copy the generated client from the builder stage.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
# --

# Ensure ownership is set by root
USER root
# Set ownership of the app directory AFTER installing dependencies
RUN chown -R appuser:nodejs /app

# Switch to the non-root user
USER appuser

# Copy built application and prisma schema
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5001

# Expose the application port
EXPOSE 5001

# Using Render?: Use this command if you have paid plan on Render
#CMD ["node", "dist/server.js"]

# Using Render?: Use this command if you have Free plan on Render > Run migrations, then seed, then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && npm run seed:prod && node dist/server.js"]