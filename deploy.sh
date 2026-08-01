#!/usr/bin/env bash
set -e

# ==============================================================================
# Catatin Application - Automated Deployment Script
# Local Dev: .env (SQLite) | Production Deploy: .env.prod (MySQL)
# Usage: ./deploy.sh [docker|pm2]
# ==============================================================================

DEPLOY_MODE="${1:-docker}"

echo "======================================================"
echo " 🚀 Starting Production Deployment for Catatin "
echo " Env: .env.prod | Database: MySQL 8.0 | Mode: $DEPLOY_MODE"
echo "======================================================"

# 1. Production Environment File (.env.prod) Check
if [ ! -f ".env.prod" ]; then
    if [ -f ".env.prod.example" ]; then
        echo "⚠️ .env.prod file not found. Creating from .env.prod.example..."
        cp .env.prod.example .env.prod
        echo "❗ Please update your .env.prod file with real MySQL & Google API credentials."
    else
        echo "❌ Error: .env.prod.example file is missing!"
        exit 1
    fi
fi

# Export variables from .env.prod for script context
if [ -f ".env.prod" ]; then
    set -a
    . .env.prod
    set +a
fi

# 2. Update Code from Git (if in a Git repository)
if [ -d ".git" ]; then
    echo "📦 Pulling latest changes from Git..."
    git pull origin main || echo "⚠️ Git pull skipped or failed, continuing with current code..."
fi

# 3. Deployment Modes
if [ "$DEPLOY_MODE" = "docker" ]; then
    echo "🐳 Deploying via Docker Compose (Catatin App + MySQL 8.0 via .env.prod)..."
    if ! command -v docker >/dev/null 2>&1; then
        echo "❌ Docker is not installed on this server!"
        exit 1
    fi

    # Build and restart containers
    docker compose down --remove-orphans || true
    docker compose --env-file .env.prod up -d --build

    echo "⏳ Waiting for MySQL database initialization & app health check..."
    sleep 10

    # Health Check
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        echo "✅ Catatin Application successfully deployed and healthy with MySQL (.env.prod)!"
        echo "🌐 Accessible at http://localhost:3000"
    else
        echo "⚠️ Application deployed, checking status via docker compose ps..."
        docker compose ps
    fi

elif [ "$DEPLOY_MODE" = "pm2" ]; then
    echo "⚡ Deploying via PM2 & Node.js (MySQL via .env.prod)..."
    if ! command -v pm2 >/dev/null 2>&1; then
        echo "Installing PM2 globally..."
        npm install -g pm2
    fi

    echo "📦 Installing npm dependencies..."
    npm ci --production=false

    echo "🗄️ Syncing Prisma MySQL Database Schema..."
    npx prisma db push --schema=prisma/schema.mysql.prisma

    echo "🏗️ Building Next.js application (MySQL)..."
    npx prisma generate --schema=prisma/schema.mysql.prisma
    npm run build

    echo "🔄 Starting/reloading PM2 process with .env.prod..."
    pm2 reload catatin || pm2 start npm --name "catatin" --update-env -- start

    pm2 save

    echo "✅ Catatin Application successfully deployed via PM2!"
    echo "🌐 Accessible at http://localhost:3000"
else
    echo "❌ Unknown deployment mode: $DEPLOY_MODE. Options: docker | pm2"
    exit 1
fi

echo "======================================================"
echo " 🎉 Deployment Complete!"
echo "======================================================"
