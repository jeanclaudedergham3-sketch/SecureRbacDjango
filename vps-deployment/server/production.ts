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
