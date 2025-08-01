#!/bin/bash

# Work Order Management System - VPS Startup Script

echo "🚀 Starting Work Order Management System on VPS..."

# Set environment variables
export DATABASE_URL=postgresql://workorder_admin:workorder123@localhost:5432/workorder_db
export PORT=3000
export NODE_ENV=production

# Check if database is accessible
echo "📡 Testing database connection..."
psql $DATABASE_URL -c "SELECT current_user, current_database();" || {
    echo "❌ Database connection failed. Please check your PostgreSQL setup."
    exit 1
}

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the frontend
echo "🏗️  Building frontend..."
npm run build || {
    echo "❌ Frontend build failed"
    exit 1
}

# Start the server
echo "🌟 Starting production server..."
npx tsx server/production.ts
