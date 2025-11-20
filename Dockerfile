# Stage 1: Development - Installs all dependencies
FROM node:20-alpine AS development

WORKDIR /app

# Install all dependencies including devDependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Stage 2: Builder - Builds the application using files from the development stage
FROM development AS builder

# Build the application
RUN npm run build

# Generate Prisma client
RUN npx prisma generate

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
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.env* ./
COPY --from=builder /app/node_modules ./node_modules

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5001

# Expose the application port
EXPOSE 5001

# Command to run the application
CMD ["node", "dist/server.js"]