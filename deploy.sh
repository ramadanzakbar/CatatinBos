#!/usr/bin/env bash
set -e

# ==============================================================================
# Catatin Application - Automated Deployment Script (MySQL Database)
# Usage: ./deploy.sh [docker|pm2]
# ==============================================================================

DEPLOY_MODE="${1:-docker}"

echo "======================================================"
echo " 🚀 Starting Deployment for Catatin (MySQL Enabled) "
echo " Mode: $DEPLOY_MODE"
echo "======================================================"

# 1. Environment File Check
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "⚠️ .env file not found. Creating from .env.example..."
        cp .env.example .env
        echo "❗ Please update your .env file with real MySQL & Google API credentials."
    else
        echo "❌ Error: .env file is missing!"
        exit 1
    fi
fi

# 2. Update Code from Git (if in a Git repository)
if [ -d ".git" ]; then
    echo "📦 Pulling latest changes from Git..."
    git pull origin main || echo "⚠️ Git pull skipped or failed, continuing with current code..."
fi

# 3. Deployment Modes
if [ "$DEPLOY_MODE" = "docker" ]; then
    echo "🐳 Deploying via Docker Compose (Catatin App + MySQL 8.0)..."
    if ! command -v docker >/dev/null 2>&1; then
        echo "❌ Docker is not installed on this server!"
        exit 1
    fi

    # Build and restart containers
    docker compose down --remove-orphans || true
    docker compose up -d --build

    echo "⏳ Waiting for MySQL database initialization & app health check..."
    sleep 10

    # Health Check
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        echo "✅ Catatin Application successfully deployed and healthy with MySQL!"
        echo "🌐 Accessible at http://localhost:3000"
    else
        echo "⚠️ Application deployed, checking status via docker compose ps..."
        docker compose ps
    fi

elif [ "$DEPLOY_MODE" = "pm2" ]; then
    echo "⚡ Deploying via PM2 & Node.js (MySQL)..."
    if ! command -v pm2 >/dev/null 2>&1; then
        echo "Installing PM2 globally..."
        npm install -g pm2
    fi

    echo "📦 Installing npm dependencies..."
    npm ci --production=false

    echo "🗄️ Syncing Prisma Database Schema to MySQL..."
    npx prisma db push

    echo "🏗️ Building Next.js application..."
    npm run build

    echo "🔄 Starting/reloading PM2 process..."
    pm2 reload catatin || pm2 start npm --name "catatin" -- start

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
