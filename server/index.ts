import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./seed";

// Seed database on startup
seedDatabase();

const app = express();

// ── Compression ─────────────────────────────────────────────
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    const ct = res.getHeader("Content-Type") as string | undefined;
    if (ct && /image\/(png|jpg|jpeg|gif|webp|svg)/.test(ct)) return false;
    return compression.filter(req, res);
  },
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// ── Logger ─────────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      const logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // ✅ ROOT ROUTE (always works)
  app.get("/", (req, res) => {
    res.send("Server is working 🚀");
  });

  // ── Error handler ─────────────────────────────────────────
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // ── Frontend handling ─────────────────────────────────────
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // serve static AFTER root route
    serveStatic(app);
  }

  // ✅ IMPORTANT: dynamic port for Coolify
  const port = process.env.PORT || 3000;

  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
