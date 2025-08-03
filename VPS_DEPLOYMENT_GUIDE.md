# VPS Deployment Guide for CMMS System

## Prerequisites
- Ubuntu VPS server with sudo access
- Domain: cmms-test.com pointing to your VPS IP
- Node.js 18+ and PostgreSQL installed

## Step 1: Clone from GitHub
```bash
# SSH into your VPS
ssh root@your-vps-ip

# Navigate to web directory
cd /var/www

# Clone your repository
git clone https://github.com/yourusername/your-repo-name.git cmms-app
cd cmms-app

# Install dependencies
npm install
```

## Step 2: Setup PostgreSQL Database
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE workorder_db;
CREATE USER workorder_admin WITH PASSWORD 'workorder123';
GRANT ALL PRIVILEGES ON DATABASE workorder_db TO workorder_admin;
ALTER USER workorder_admin CREATEDB;
\q

# Set environment variable
export DATABASE_URL="postgresql://workorder_admin:workorder123@localhost:5432/workorder_db"
```

## Step 3: Setup Environment Variables
```bash
# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://workorder_admin:workorder123@localhost:5432/workorder_db
NODE_ENV=production
PORT=3000
SESSION_SECRET=your-super-secret-session-key-here
EOF
```

## Step 4: Initialize Database
```bash
# Push database schema
npm run db:push

# Seed the database (run the seed script directly)
tsx server/seed.ts
```

## Step 5: Build and Start Application
```bash
# Option 1: Use production server (recommended - avoids Vite issues)
DATABASE_URL="postgresql://workorder_admin:workorder123@localhost:5432/workorder_db" NODE_ENV=production tsx server/production.ts

# Option 2: Build and use compiled version
npm run build
npm start
```

## Step 6: Setup Nginx Reverse Proxy
```bash
# Install Nginx
sudo apt update
sudo apt install nginx

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/cmms-test.com << EOF
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

# Enable the site
sudo ln -s /etc/nginx/sites-available/cmms-test.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 7: Setup PM2 for Process Management
```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'cmms-app',
    script: 'server/production.ts',
    interpreter: 'tsx',
    env: {
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://workorder_admin:workorder123@localhost:5432/workorder_db',
      PORT: '3000',
      SESSION_SECRET: 'your-super-secret-session-key-here'
    }
  }]
};
EOF

# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

## Step 8: Access Your Application
- **URL**: http://cmms-test.com:8080
- **Admin Login**: username: `admin`, password: `admin123`
- **Manager Login**: username: `manager`, password: `admin123`
- **Viewer Login**: username: `viewer`, password: `admin123`

## Important Files for Production
- `server/production.ts` - Production server (bypasses Vite issues)
- `server/db.ts` - Database configuration
- `.env` - Environment variables
- `package.json` - Dependencies and scripts

## Troubleshooting
1. **Port 80 blocked by Docker**: Use port 8080 as configured
2. **Database connection issues**: Check DATABASE_URL in .env
3. **Node.js compatibility**: Ensure Node.js 18+ is installed
4. **Permission errors**: Run with proper sudo privileges

## Monitoring
```bash
# Check application status
pm2 status

# View logs
pm2 logs cmms-app

# Restart application
pm2 restart cmms-app
```

Your CMMS system is now ready for production use!