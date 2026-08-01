#!/bin/sh
set -e

echo "=== Syncing Prisma Database Schema to MySQL ==="
npx prisma db push --skip-generate

echo "=== Starting Catatin Next.js Server ==="
exec node server.js
