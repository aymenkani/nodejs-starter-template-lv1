#!/bin/sh

echo "Waiting for database to be ready..."

# Loop until we can connect to the DB (using nc/netcat which is built into Alpine)
# We assume the host is 'db' and port is '5432' based on your env
# Or use Prisma to check connection
until nc -z -v -w30 db 5432
do
  echo "Waiting for database connection..."
  # wait for 1 second before check again
  sleep 1
done

echo "Database is ready!"

echo "Running migrations..."
npx prisma migrate dev

echo "Seeding database..."
npm run seed:local || echo "Seeding skipped or failed"

echo "Starting server..."
exec "$@"