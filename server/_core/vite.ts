import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
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
    const url = req.originalUrl;

    try {
      // Em desenvolvimento, usamos o caminho relativo simples
      const clientTemplate = path.resolve("client", "index.html");

      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // No Railway, o diretório de trabalho é /app
  // O build do cliente vai para /app/dist/public
  const distPath = "/app/dist/public";
  
  console.log(`[Static] Attempting to serve from: ${distPath}`);

  app.use(express.static(distPath));

  app.use("*", (_req, res) => {
    const indexPath = "/app/dist/public/index.html";
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error(`[Static] Error sending index.html: ${err.message}`);
        res.status(404).send("Site em manutenção ou arquivos não encontrados.");
      }
    });
  });
}
