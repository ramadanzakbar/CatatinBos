#!/bin/sh
set -e

echo "=== Syncing Prisma Database Schema to MySQL (.env.prod) ==="
npx prisma db push --schema=prisma/schema.mysql.prisma --skip-generate

echo "=== Starting Catatin Next.js Server ==="
exec node server.js
