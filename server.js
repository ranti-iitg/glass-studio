import { createServer } from "node:http";
import { readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const distDir = join(here, "dist");
const port = parseInt(process.env.PORT || "3000", 10);

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".map": "application/json",
};

const CONFIG_ENDPOINT = "/__openclaw/control-ui-config.json";
const CONFIG_PAYLOAD = JSON.stringify({
  basePath: "/",
  assistantName: process.env.GLASS_ASSISTANT_NAME || "",
  assistantAvatar: process.env.GLASS_ASSISTANT_AVATAR || "",
  assistantAgentId: process.env.GLASS_ASSISTANT_AGENT_ID || "",
});

createServer((req, res) => {
  const url = new URL(req.url, `http://localhost`);

  // Config stub the UI fetches on load
  if (url.pathname === CONFIG_ENDPOINT) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(CONFIG_PAYLOAD);
    return;
  }

  let filePath = join(distDir, url.pathname);

  try {
    const stat = statSync(filePath);
    if (stat.isDirectory()) filePath = join(filePath, "index.html");
  } catch {
    // Not found — serve index.html for SPA routing
    filePath = join(distDir, "index.html");
  }

  try {
    const content = readFileSync(filePath);
    const ext = extname(filePath);
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      // Cache static assets aggressively, HTML never
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
    });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}).listen(port, () => {
  console.log(`Glass Studio running on http://0.0.0.0:${port}`);
});
