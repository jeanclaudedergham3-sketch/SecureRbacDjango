# Complete VPS Deployment Steps

## Prerequisites
- Ubuntu VPS server with root access
- Domain cmms-test.com pointing to your VPS IP address
- GitHub repository with your code uploaded

---

## Step 1: Connect to Your VPS
```bash
# Connect via SSH
ssh root@YOUR_VPS_IP

# Update system packages
apt update && apt upgrade -y
```

## Step 2: Install Required Software
```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PostgreSQL
apt install postgresql postgresql-contrib -y

# Install Nginx
apt install nginx -y

# Install PM2 globally
npm install -g pm2

# Install tsx globally
npm install -g tsx

# Verify installations
node --version    # Should show v18.x.x
npm --version
psql --version
nginx -v
```

## Step 3: Setup PostgreSQL Database
```bash
# Start PostgreSQL service
systemctl start postgresql
systemctl enable postgresql

# Switch to postgres user and create database
sudo -u postgres psql << EOF
CREATE DATABASE workorder_db;
CREATE USER workorder_admin WITH PASSWORD 'workorder123';
GRANT ALL PRIVILEGES ON DATABASE workorder_db TO workorder_admin;
ALTER USER workorder_admin CREATEDB;
\q
EOF

# Test database connection
sudo -u postgres psql -d workorder_db -c "SELECT version();"
```

## Step 4: Clone Your Project
```bash
# Navigate to web directory
cd /var/www

# Clone your GitHub repository (replace with your actual repo)
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git cmms-app

# Navigate to project directory
cd cmms-app

# Install project dependencies
npm install
```

## Step 5: Configure Environment
```bash
# Create environment file
cat > .env << EOF
DATABASE_URL=postgresql://workorder_admin:workorder123@localhost:5432/workorder_db
NODE_ENV=production
PORT=3000
SESSION_SECRET=cmms-super-secret-key-2025-production
EOF

# Set environment variables for current session
export DATABASE_URL="postgresql://workorder_admin:workorder123@localhost:5432/workorder_db"
export NODE_ENV=production
export PORT=3000
```

## Step 6: Initialize Database Schema and Data
```bash
# Push database schema to PostgreSQL
npm run db:push

# Seed the database with initial data
tsx server/seed.ts

# Verify database setup
sudo -u postgres psql -d workorder_db -c "SELECT COUNT(*) FROM users;"
sudo -u postgres psql -d workorder_db -c "SELECT COUNT(*) FROM permissions;"
```

## Step 7: Configure Nginx Reverse Proxy
```bash
# Remove default Nginx configuration
rm -f /etc/nginx/sites-enabled/default

# Create new Nginx configuration for your domain
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
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
}
EOF

# Enable the site
ln -s /etc/nginx/sites-available/cmms-test.com /etc/nginx/sites-enabled/

# Test Nginx configuration
nginx -t

# Start and enable Nginx
systemctl start nginx
systemctl enable nginx
systemctl reload nginx
```

## Step 8: Setup PM2 Process Manager
```bash
# Create PM2 ecosystem configuration
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'cmms-app',
    script: 'server/production.ts',
    interpreter: 'tsx',
    cwd: '/var/www/cmms-app',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://workorder_admin:workorder123@localhost:5432/workorder_db',
      PORT: '3000',
      SESSION_SECRET: 'cmms-super-secret-key-2025-production'
    },
    error_file: '/var/www/cmms-app/logs/err.log',
    out_file: '/var/www/cmms-app/logs/out.log',
    log_file: '/var/www/cmms-app/logs/combined.log',
    time: true
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the command that PM2 shows you

# Check application status
pm2 status
pm2 logs cmms-app --lines 20
```

## Step 9: Configure Firewall
```bash
# Allow necessary ports
ufw allow ssh
ufw allow 8080/tcp
ufw allow 3000/tcp
ufw --force enable

# Check firewall status
ufw status
```

## Step 10: Test Your Deployment
```bash
# Check if application is running
curl -I http://localhost:3000

# Check if Nginx is proxying correctly
curl -I http://localhost:8080

# Check database connection
sudo -u postgres psql -d workorder_db -c "SELECT email FROM users WHERE username='admin';"

# View application logs
pm2 logs cmms-app --lines 50
```

## Step 11: Access Your Application

🎉 **Your CMMS system is now deployed!**

**Access URL:** http://cmms-test.com:8080

**Login Credentials:**
- **Admin:** username: `admin`, password: `admin123`
- **Manager:** username: `manager`, password: `admin123`
- **Viewer:** username: `viewer`, password: `admin123`

## Maintenance Commands

```bash
# View application status
pm2 status

# Restart application
pm2 restart cmms-app

# View logs
pm2 logs cmms-app

# Update from GitHub
cd /var/www/cmms-app
git pull origin main
pm2 restart cmms-app

# Check Nginx status
systemctl status nginx

# Check PostgreSQL status
systemctl status postgresql
```

## Troubleshooting

**If application won't start:**
```bash
pm2 logs cmms-app
cd /var/www/cmms-app
tsx server/production.ts
```

**If database connection fails:**
```bash
sudo -u postgres psql -d workorder_db
\l
\dt
```

**If Nginx returns 502 Bad Gateway:**
```bash
pm2 status
systemctl status nginx
curl http://localhost:3000
```

---

## Important Notes
1. Replace `YOUR_USERNAME/YOUR_REPO_NAME` with your actual GitHub repository
2. Port 8080 is used because port 80 might be blocked by Docker
3. The system includes 181 granular permissions for complete RBAC control
4. All work order management, user management, and payment features are included
5. Files are uploaded to `/var/www/cmms-app/uploads/` directory

Your complete CMMS system with ultra-granular RBAC is now ready for production use!