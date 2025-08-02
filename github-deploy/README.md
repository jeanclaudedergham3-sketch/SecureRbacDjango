# CMMS Work Order Management System

Enterprise-grade work order management system with comprehensive RBAC and 180+ granular permissions.

## Features
- Work Order Management
- Technician Management  
- Parts & Inventory Tracking
- Payment Processing
- Invoice Management
- Real-time Chat
- File Management
- Financial Reporting
- Role-Based Access Control

## VPS Deployment

1. Clone repository to your VPS:
```bash
git clone [your-repo-url]
cd cmms-workorder-system
```

2. Set up PostgreSQL database:
```bash
sudo -u postgres psql
CREATE DATABASE workorder_db;
CREATE USER workorder_admin WITH PASSWORD 'workorder123';
GRANT ALL PRIVILEGES ON DATABASE workorder_db TO workorder_admin;
\q
```

3. Deploy:
```bash
chmod +x deploy-vps.sh
./deploy-vps.sh
```

4. Access at: http://cmms-test.com:3000

## Default Login
- Email: admin@example.com
- Password: admin123

## Environment Variables
- DATABASE_URL: PostgreSQL connection string
- PORT: Server port (default: 3000)
- NODE_ENV: Environment (production/development)
