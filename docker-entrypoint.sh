#!/bin/sh
set -e

echo "=== Syncing Prisma Database Schema to MySQL ==="
if [ -n "$DATABASE_URL" ]; then
  npx prisma db push --schema=prisma/schema.mysql.prisma --skip-generate --accept-data-loss || echo "⚠️ Database sync skipped or warning encountered."
else
  echo "⚠️ DATABASE_URL not found, skipping Prisma schema push."
fi

echo "=== Starting Catatin Next.js Server ==="
exec node server.js
