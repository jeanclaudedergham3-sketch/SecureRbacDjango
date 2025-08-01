import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { seedDatabase } from "./seed";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  // Seed database on startup
  await seedDatabase();

  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Basic logging middleware
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
  app.use(express.static(path.join(__dirname, "../dist/public")));

  // Catch-all handler for SPA
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../dist/public/index.html"));
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
    console.log(`Production server running on http://0.0.0.0:${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
  });
}

// Start the server
startServer().catch(console.error);