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
