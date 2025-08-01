# VPS Deployment Instructions

## Prerequisites
- PostgreSQL database running
- Node.js 18+ installed
- Database user: workorder_admin with password: workorder123
- Database name: workorder_db

## Deployment Steps

1. Upload this entire folder to your VPS at /var/www/workorder-app/

2. SSH into your VPS and run:
   ```bash
   cd /var/www/workorder-app
   ./start-vps.sh
   ```

3. Access your application at: http://your-server-ip:3000

## Troubleshooting

If you get permission errors:
```bash
chmod +x start-vps.sh
```

If you get database errors:
```bash
sudo -u postgres psql
CREATE DATABASE workorder_db;
CREATE USER workorder_admin WITH PASSWORD 'workorder123';
GRANT ALL PRIVILEGES ON DATABASE workorder_db TO workorder_admin;
\q
```

## Default Login
- Username: admin@example.com
- Password: admin123
