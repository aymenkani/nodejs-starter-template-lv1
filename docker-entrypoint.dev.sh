#!/bin/sh
set -e # Stop if any command fails

echo "Waiting for database..."
until nc -z -v -w30 db 5432; do
  echo "Waiting for DB..."
  sleep 1
done

# This ensures that even if you change schema.prisma and just restart,
# the client is always fresh.
echo "Generating Prisma Client..."
npx prisma generate
# --------------------

echo "Running migrations..."
npx prisma migrate dev --skip-generate

echo "Seeding..."
npm run seed:local || echo "Seeding skipped"

echo "Starting server..."
exec "$@"