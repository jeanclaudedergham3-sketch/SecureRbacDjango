#!/bin/bash

# Complete CMMS Deployment Script
# Run this script on your Ubuntu VPS after uploading to GitHub

set -e

echo "🚀 Starting CMMS System Deployment..."

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install other dependencies
echo "📦 Installing PostgreSQL, Nginx, and tools..."
apt install postgresql postgresql-contrib nginx git curl -y

# Install global npm packages
echo "📦 Installing global npm packages..."
npm install -g pm2 tsx

# Setup PostgreSQL
echo "🗄️ Setting up PostgreSQL database..."
systemctl start postgresql
systemctl enable postgresql

sudo -u postgres psql << EOF
CREATE DATABASE workorder_db;
CREATE USER workorder_admin WITH PASSWORD 'workorder123';
GRANT ALL PRIVILEGES ON DATABASE workorder_db TO workorder_admin;
ALTER USER workorder_admin CREATEDB;
\q
EOF

# Clone project (user needs to edit this line)
echo "📥 Cloning project from GitHub..."
echo "⚠️  EDIT THIS LINE: Replace YOUR_USERNAME/YOUR_REPO_NAME with your actual GitHub repo"
read -p "Enter your GitHub username: " github_user
read -p "Enter your repository name: " repo_name

cd /var/www
git clone https://github.com/$github_user/$repo_name.git cmms-app
cd cmms-app

# Install dependencies
echo "📦 Installing project dependencies..."
npm install

# Setup environment
echo "⚙️ Setting up environment..."
cat > .env << EOF
DATABASE_URL=postgresql://workorder_admin:workorder123@localhost:5432/workorder_db
NODE_ENV=production
PORT=3000
SESSION_SECRET=cmms-super-secret-key-2025-production
EOF

# Initialize database
echo "🗄️ Initializing database..."
export DATABASE_URL="postgresql://workorder_admin:workorder123@localhost:5432/workorder_db"
npm run db:push
tsx server/seed.ts

# Setup Nginx
echo "🌐 Setting up Nginx..."
rm -f /etc/nginx/sites-enabled/default

cat > /etc/nginx/sites-available/cmms-test.com << EOF
server {
    listen 8080;
    server_name cmms-test.com www.cmms-test.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -s /etc/nginx/sites-available/cmms-test.com /etc/nginx/sites-enabled/
nginx -t
systemctl start nginx
systemctl enable nginx
systemctl reload nginx

# Setup PM2
echo "🔄 Setting up PM2 process manager..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'cmms-app',
    script: 'server/production.ts',
    interpreter: 'tsx',
    cwd: '/var/www/cmms-app',
    env: {
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://workorder_admin:workorder123@localhost:5432/workorder_db',
      PORT: '3000',
      SESSION_SECRET: 'cmms-super-secret-key-2025-production'
    }
  }]
};
EOF

mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Setup firewall
echo "🔐 Setting up firewall..."
ufw allow ssh
ufw allow 8080/tcp
ufw allow 3000/tcp
ufw --force enable

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo ""
echo "📍 Access your CMMS system at: http://cmms-test.com:8080"
echo ""
echo "🔑 Login credentials:"
echo "   Admin: username 'admin', password 'admin123'"
echo "   Manager: username 'manager', password 'admin123'"
echo "   Viewer: username 'viewer', password 'admin123'"
echo ""
echo "🔧 Useful commands:"
echo "   pm2 status          - Check application status"
echo "   pm2 logs cmms-app   - View application logs"
echo "   pm2 restart cmms-app - Restart application"
echo ""
echo "✅ Your CMMS system with 181 RBAC permissions is ready!"