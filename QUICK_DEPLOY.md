# Quick Deploy Commands

After uploading to GitHub, here's what to run on your VPS:

## 1. Clone and Setup
```bash
cd /var/www
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git cmms-app
cd cmms-app
npm install
```

## 2. Database Setup
```bash
sudo -u postgres psql -c "CREATE DATABASE workorder_db;"
sudo -u postgres psql -c "CREATE USER workorder_admin WITH PASSWORD 'workorder123';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE workorder_db TO workorder_admin;"
export DATABASE_URL="postgresql://workorder_admin:workorder123@localhost:5432/workorder_db"
npm run db:push
tsx server/seed.ts
```

## 3. Start Application
```bash
DATABASE_URL="postgresql://workorder_admin:workorder123@localhost:5432/workorder_db" NODE_ENV=production tsx server/production.ts
```

## 4. Access Your App
Visit: **http://cmms-test.com:8080**
Login: **admin** / **admin123**

## Next Steps (if you need GitHub repo name):
Replace `YOUR_USERNAME/YOUR_REPO_NAME` with your actual GitHub details!