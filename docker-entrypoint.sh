#!/bin/sh

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set."
  exit 1
fi

if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "change-this-to-a-strong-random-secret" ]; then
  echo "WARNING: JWT_SECRET is not set or using default. Users will be logged out on restart."
fi

echo "Waiting for database to be ready..."
max_retries=30
retry=0
while [ $retry -lt $max_retries ]; do
  if node -e "const pg = require('pg'); const c = new pg.Client(process.env.DATABASE_URL); c.connect().then(() => { c.end(); process.exit(0); }).catch(() => process.exit(1));" 2>/dev/null; then
    echo "Database is ready!"
    break
  fi
  retry=$((retry + 1))
  echo "Waiting for database... ($retry/$max_retries)"
  sleep 2
done

if [ $retry -eq $max_retries ]; then
  echo "ERROR: Could not connect to database after $max_retries attempts."
  exit 1
fi

echo "Running database migrations..."
npx drizzle-kit push --force
if [ $? -ne 0 ]; then
  echo "ERROR: Database migration failed!"
  exit 1
fi
echo "Database migrations completed."

echo "Starting application on port ${PORT:-3000}..."
exec node dist/index.cjs
