import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    try {
      const template = await fs.promises.readFile("./client/index.html", "utf-8");
      const page = await vite.transformIndexHtml(req.originalUrl, template.replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${nanoid()}"`));
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // No Railway, usamos caminhos de string pura para evitar que o esbuild quebre o código
  const distPath = "/app/dist/public";
  const indexPath = "/app/dist/public/index.html";
  
  console.log("[Static] Serving from /app/dist/public");

  app.use(express.static(distPath));

  app.use("*", (_req, res) => {
    res.sendFile(indexPath, (err) => {
      if (err) {
        res.status(404).send("Arquivos do site não encontrados. Verifique o build.");
      }
    });
  });
}
