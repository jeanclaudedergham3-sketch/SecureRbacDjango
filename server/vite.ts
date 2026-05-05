export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // ✅ FIX FINAL: exclude root + API routes
  app.use("*", (req, res, next) => {
    // خلي backend يشتغل
    if (req.path === "/" || req.path.startsWith("/api")) {
      return next();
    }

    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
