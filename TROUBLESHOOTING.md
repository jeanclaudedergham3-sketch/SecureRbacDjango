# Deployment Troubleshooting Guide

## Common Errors and Solutions

### 1. Node.js Version Issues
**Error:** `node: command not found` or version conflicts
**Solution:**
```bash
# Remove old Node.js
apt remove nodejs npm -y

# Install Node.js 18 properly
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Verify
node --version
npm --version
```

### 2. PostgreSQL Connection Errors
**Error:** `ECONNREFUSED` or `password authentication failed`
**Solution:**
```bash
# Check PostgreSQL status
systemctl status postgresql

# Reset database setup
sudo -u postgres psql << EOF
DROP DATABASE IF EXISTS workorder_db;
DROP USER IF EXISTS workorder_admin;
CREATE DATABASE workorder_db;
CREATE USER workorder_admin WITH PASSWORD 'workorder123';
GRANT ALL PRIVILEGES ON DATABASE workorder_db TO workorder_admin;
ALTER USER workorder_admin CREATEDB;
\q
EOF

# Test connection
sudo -u postgres psql -d workorder_db -c "SELECT version();"
```

### 3. GitHub Clone Issues
**Error:** `Permission denied` or `repository not found`
**Solution:**
```bash
# Make sure repository is public or use proper authentication
# For public repo:
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# For private repo, use personal access token:
git clone https://YOUR_TOKEN@github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

### 4. NPM Install Failures
**Error:** `npm ERR!` during install
**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# If still fails, try with legacy peer deps
npm install --legacy-peer-deps
```

### 5. Database Schema Push Errors
**Error:** `drizzle-kit push` fails
**Solution:**
```bash
# Make sure DATABASE_URL is set
export DATABASE_URL="postgresql://workorder_admin:workorder123@localhost:5432/workorder_db"

# Try manual schema push
npx drizzle-kit push

# If fails, check drizzle config
cat drizzle.config.ts
```

### 6. Port Already in Use
**Error:** `EADDRINUSE` port 3000
**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 PID_NUMBER

# Or use different port
export PORT=3001
```

### 7. Nginx Configuration Errors
**Error:** `nginx: [emerg]` configuration test failed
**Solution:**
```bash
# Test nginx config
nginx -t

# Check syntax in config file
cat /etc/nginx/sites-available/cmms-test.com

# Remove and recreate if needed
rm /etc/nginx/sites-enabled/cmms-test.com
rm /etc/nginx/sites-available/cmms-test.com
# Then recreate the config
```

### 8. PM2 Startup Issues
**Error:** PM2 app not starting
**Solution:**
```bash
# Check PM2 status
pm2 status

# View detailed logs
pm2 logs cmms-app --lines 50

# Try running directly first
cd /var/www/cmms-app
tsx server/production.ts

# If works, then restart PM2
pm2 delete cmms-app
pm2 start ecosystem.config.js
```

### 9. Firewall Blocking Access
**Error:** Cannot access website
**Solution:**
```bash
# Check firewall status
ufw status

# Allow required ports
ufw allow 8080/tcp
ufw allow 3000/tcp
ufw reload

# Check if ports are listening
netstat -tlnp | grep :8080
netstat -tlnp | grep :3000
```

### 10. File Permission Issues
**Error:** `EACCES` permission denied
**Solution:**
```bash
# Fix ownership
chown -R root:root /var/www/cmms-app

# Fix permissions
chmod -R 755 /var/www/cmms-app

# Make scripts executable
chmod +x /var/www/cmms-app/deploy-complete.sh
```

## Quick Diagnostic Commands

```bash
# Check all services
systemctl status postgresql nginx
pm2 status

# Check network connectivity
curl -I http://localhost:3000
curl -I http://localhost:8080

# Check logs
pm2 logs cmms-app --lines 20
tail -f /var/log/nginx/error.log

# Check database
sudo -u postgres psql -d workorder_db -c "\dt"

# Check environment
env | grep DATABASE_URL
env | grep NODE_ENV
```

## Complete Reset (if everything fails)

```bash
# Stop all services
pm2 delete all
systemctl stop nginx

# Remove project
rm -rf /var/www/cmms-app

# Reset database
sudo -u postgres psql -c "DROP DATABASE IF EXISTS workorder_db;"
sudo -u postgres psql -c "DROP USER IF EXISTS workorder_admin;"

# Start fresh deployment
# Then follow deployment steps again
```