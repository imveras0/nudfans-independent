import "dotenv/config";
import { webcrypto } from "node:crypto";
if (!globalThis.crypto) {
  // @ts-ignore
  globalThis.crypto = webcrypto;
}
import express from "express";
import { createServer } from "http";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { registerOAuthRoutes } from "./_core/oauth";
import { handleStripeWebhook } from "./stripe/webhook";

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // 1. Stripe webhook (must be before body parser)
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);
  
  // 2. Body parsers
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // 3. API Routes
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // 4. Static Files & SPA Routing
  const distPath = path.resolve(process.cwd(), "dist", "public");
  
  if (process.env.NODE_ENV === "production") {
    console.log(`[Production] Serving static files from: ${distPath}`);
    
    // Serve static assets first
    app.use(express.static(distPath, { index: false }));
    
    // Fallback for ALL other routes to index.html (Crucial for SPA)
    app.get("*", (req, res, next) => {
      // Skip API routes
      if (req.path.startsWith("/api/")) {
        return next();
      }
      
      const indexPath = path.join(distPath, "index.html");
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error("Error sending index.html:", err);
          res.status(404).send("Frontend build not found. Please check deployment.");
        }
      });
    });
  } else {
    const { setupVite } = await import("./_core/vite");
    await setupVite(app, server);
  }

  const port = Number(process.env.PORT) || 3000;
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server is live on port ${port}`);
  });
}

startServer().catch(err => {
  console.error("Critical failure during server startup:", err);
  process.exit(1);
});
