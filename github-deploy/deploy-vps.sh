#!/bin/bash

echo "🚀 Deploying CMMS Work Order System to VPS..."

# Set environment variables
export DATABASE_URL=postgresql://workorder_admin:workorder123@localhost:5432/workorder_db
export PORT=3000
export NODE_ENV=production

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build frontend
echo "🏗️ Building frontend..."
npm run build

# Test database connection
echo "📡 Testing database..."
psql $DATABASE_URL -c "SELECT current_user, current_database();" || {
    echo "❌ Database connection failed"
    exit 1
}

# Start server
echo "🌟 Starting CMMS server..."
npm start
