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
  
  // 1. Stripe webhook
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
  const indexPath = path.join(distPath, "index.html");

  if (process.env.NODE_ENV === "production") {
    console.log(`[Production] Serving from: ${distPath}`);
    
    // Serve static assets (js, css, images)
    app.use(express.static(distPath, { index: false }));
    
    // FOR ALL OTHER ROUTES: Serve index.html
    // This MUST be the last route handler
    app.get("*", (req, res) => {
      // If it's an API call that reached here, it's a 404 API call
      if (req.path.startsWith("/api/")) {
        return res.status(404).json({ error: "API route not found" });
      }
      
      // For everything else (like /profile, /settings, etc), serve the React app
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error("Critical: index.html not found at", indexPath);
          res.status(500).send("Frontend build missing. Please check Railway build logs.");
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
