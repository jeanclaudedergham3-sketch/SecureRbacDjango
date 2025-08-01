#!/bin/bash

# VPS Deployment Script for Work Order Management System
echo "Creating VPS deployment package..."

# Create deployment directory
mkdir -p vps-deployment
cd vps-deployment

# Copy essential files
cp -r ../server .
cp -r ../shared .
cp -r ../client .
cp ../package.json .
cp ../package-lock.json .
cp ../tsconfig.json .
cp ../drizzle.config.ts .
cp ../components.json .
cp ../postcss.config.js .
cp ../tailwind.config.ts .

# Create a simple vite.config.ts that works with Node.js 18
cat > vite.config.ts << 'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
EOF

# Create production server
cat > server/production.ts << 'EOF'
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { seedDatabase } from "./seed.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  console.log("Starting Work Order Management System...");
  
  // Seed database on startup
  try {
    await seedDatabase();
    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Database seed error:", error);
  }

  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // CORS middleware for development
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
  });

  // Request logging
  app.use((req, res, next) => {
    const start = Date.now();
    const requestPath = req.path;

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (requestPath.startsWith("/api")) {
        console.log(`${req.method} ${requestPath} ${res.statusCode} in ${duration}ms`);
      }
    });

    next();
  });

  // Register API routes
  const server = await registerRoutes(app);

  // Serve static files in production
  const staticPath = path.join(__dirname, "../dist/public");
  console.log("Serving static files from:", staticPath);
  app.use(express.static(staticPath));

  // Catch-all handler for SPA
  app.get("*", (req, res) => {
    const indexPath = path.join(staticPath, "index.html");
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error("Error serving index.html:", err);
        res.status(500).send("Server Error");
      }
    });
  });

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Server error:", err);
    res.status(status).json({ message });
  });

  // Start server
  const port = process.env.PORT || 3000;
  server.listen({
    port: parseInt(port.toString()),
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    console.log(`✅ Work Order Management System running on http://0.0.0.0:${port}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
    console.log(`   Access your application at: http://your-server-ip:${port}`);
  });
}

// Start the server
startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
EOF

# Create startup script for VPS
cat > start-vps.sh << 'EOF'
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
EOF

chmod +x start-vps.sh

# Create deployment instructions
cat > DEPLOYMENT_README.md << 'EOF'
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
EOF

echo "✅ VPS deployment package created in vps-deployment/"
echo "📁 Upload the vps-deployment/ folder to your VPS"
echo "🚀 Run ./start-vps.sh on your VPS to start the application"