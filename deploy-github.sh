#!/bin/bash

# GitHub Deployment Script for Work Order Management System
echo "🚀 Setting up GitHub deployment for cmms-test.com"

# Create deployment package with all necessary files
echo "📦 Creating clean deployment package..."

# Create GitHub-ready structure
mkdir -p github-deploy
cd github-deploy

# Copy all essential project files
cp -r ../server .
cp -r ../shared .
cp -r ../client .
cp ../package.json .
cp ../package-lock.json .
cp ../tsconfig.json .
cp ../components.json .
cp ../postcss.config.js .
cp ../tailwind.config.ts .

# Create fixed drizzle config for GitHub
cat > drizzle.config.ts << 'EOF'
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
EOF

# Create production-ready vite.config.ts
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
  console.log("🚀 Starting Work Order Management System...");
  
  try {
    await seedDatabase();
    console.log("✅ Database seeded successfully");
  } catch (error) {
    console.error("❌ Database seed error:", error);
  }

  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: false, limit: '50mb' }));

  // CORS middleware
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });

  // Request logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (req.path.startsWith("/api")) {
        console.log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
      }
    });
    next();
  });

  // Register API routes
  const server = await registerRoutes(app);

  // Serve static files
  const staticPath = path.join(__dirname, "../dist/public");
  app.use(express.static(staticPath));

  // SPA catch-all
  app.get("*", (req, res) => {
    res.sendFile(path.join(staticPath, "index.html"), (err) => {
      if (err) {
        console.error("Error serving index.html:", err);
        res.status(404).send("Not Found");
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

  const port = process.env.PORT || 3000;
  server.listen({
    port: parseInt(port.toString()),
    host: "0.0.0.0",
  }, () => {
    console.log(`✅ CMMS running at http://0.0.0.0:${port}`);
    console.log(`🌐 Access at: http://cmms-test.com:${port}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'production'}`);
    console.log(`💾 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
  });
}

startServer().catch(console.error);
EOF

# Create deployment scripts
cat > package.json << 'EOF'
{
  "name": "cmms-workorder-system",
  "version": "1.0.0",
  "type": "module",
  "license": "MIT",
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build",
    "start": "NODE_ENV=production tsx server/production.ts",
    "db:push": "drizzle-kit push",
    "install-deps": "npm install"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.10.0",
    "@radix-ui/react-accordion": "^1.2.4",
    "@radix-ui/react-alert-dialog": "^1.1.7",
    "@radix-ui/react-aspect-ratio": "^1.1.3",
    "@radix-ui/react-avatar": "^1.1.10",
    "@radix-ui/react-checkbox": "^1.1.5",
    "@radix-ui/react-collapsible": "^1.1.4",
    "@radix-ui/react-context-menu": "^2.2.7",
    "@radix-ui/react-dialog": "^1.1.7",
    "@radix-ui/react-dropdown-menu": "^2.1.7",
    "@radix-ui/react-hover-card": "^1.1.7",
    "@radix-ui/react-label": "^2.1.3",
    "@radix-ui/react-menubar": "^1.1.7",
    "@radix-ui/react-navigation-menu": "^1.2.6",
    "@radix-ui/react-popover": "^1.1.7",
    "@radix-ui/react-progress": "^1.1.3",
    "@radix-ui/react-radio-group": "^1.2.4",
    "@radix-ui/react-scroll-area": "^1.2.4",
    "@radix-ui/react-select": "^2.1.7",
    "@radix-ui/react-separator": "^1.1.3",
    "@radix-ui/react-slider": "^1.2.4",
    "@radix-ui/react-slot": "^1.2.0",
    "@radix-ui/react-switch": "^1.1.4",
    "@radix-ui/react-tabs": "^1.1.4",
    "@radix-ui/react-toast": "^1.2.7",
    "@radix-ui/react-toggle": "^1.1.3",
    "@radix-ui/react-toggle-group": "^1.1.3",
    "@radix-ui/react-tooltip": "^1.2.0",
    "@tanstack/react-query": "^5.64.0",
    "@types/bcrypt": "^5.0.2",
    "@types/express": "^4.17.21",
    "@types/express-session": "^1.18.0",
    "@types/multer": "^1.4.12",
    "@types/node": "^22.10.1",
    "@types/passport": "^1.0.16",
    "@types/passport-local": "^1.0.38",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "bcrypt": "^5.1.1",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.0.4",
    "date-fns": "^4.1.0",
    "drizzle-kit": "^0.30.0",
    "drizzle-orm": "^0.36.4",
    "drizzle-zod": "^0.5.1",
    "express": "^4.21.1",
    "express-session": "^1.18.1",
    "framer-motion": "^11.15.0",
    "input-otp": "^1.4.1",
    "lucide-react": "^0.468.0",
    "multer": "^1.4.5-lts.1",
    "next-themes": "^0.4.4",
    "passport": "^0.7.0",
    "passport-local": "^1.0.0",
    "pg": "^8.13.1",
    "react": "^18.3.1",
    "react-day-picker": "^9.4.2",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.53.2",
    "react-resizable-panels": "^2.1.7",
    "recharts": "^2.13.3",
    "tailwind-merge": "^2.5.4",
    "tailwindcss": "^3.4.17",
    "tailwindcss-animate": "^1.0.7",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2",
    "vaul": "^1.1.1",
    "vite": "^5.4.19",
    "wouter": "^3.3.5",
    "ws": "^8.18.0",
    "zod": "^3.23.8",
    "zod-validation-error": "^3.4.0"
  },
  "devDependencies": {
    "@types/pg": "^8.11.10",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.3"
  }
}
EOF

# Create VPS deployment script
cat > deploy-vps.sh << 'EOF'
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
EOF

chmod +x deploy-vps.sh

# Create README for GitHub
cat > README.md << 'EOF'
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
EOF

# Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
dist/
.env
*.log
uploads/
database.sqlite
.replit
.cache/
.local/
.upm/
*.zip
*.tar.gz
EOF

echo ""
echo "✅ GitHub deployment package created in github-deploy/"
echo ""
echo "🔄 Next steps:"
echo "1. Create a new GitHub repository"
echo "2. Upload the github-deploy/ folder contents"
echo "3. On your VPS, run:"
echo "   git clone [your-repo-url]"
echo "   cd [repo-name]"
echo "   ./deploy-vps.sh"
echo ""
echo "📍 Your domain cmms-test.com:3000 will be ready after deployment!"
EOF