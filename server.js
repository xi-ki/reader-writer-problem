// English comments only, as requested.

/**
 * Minimal static web server for the Agent Marketplace page.
 * - No external dependencies
 * - Serves /index.html by default
 * - Serves static assets from the workspace root
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  res.end(body);
}

function safePathFromUrl(urlPath) {
  const raw = decodeURIComponent(urlPath.split("?")[0] || "/");
  const normalized = path.normalize(raw).replace(/^([\\/])+/, "");
  return path.join(ROOT, normalized);
}

function fileExists(p) {
  try {
    const st = fs.statSync(p);
    return st.isFile();
  } catch {
    return false;
  }
}

const server = http.createServer((req, res) => {
  const urlPath = req.url || "/";

  // Default route.
  let filePath = urlPath === "/" ? path.join(ROOT, "index.html") : safePathFromUrl(urlPath);

  // Prevent directory traversal.
  if (!filePath.startsWith(ROOT)) {
    return send(res, 403, { "content-type": "text/plain; charset=utf-8" }, "Forbidden");
  }

  // SPA-friendly fallback: serve index.html if the path doesn't map to a file.
  if (!fileExists(filePath)) {
    filePath = path.join(ROOT, "index.html");
  }

  try {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || "application/octet-stream";
    const data = fs.readFileSync(filePath);

    const headers = {
      "content-type": contentType,
      // No-cache by default to make iteration easy.
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    };

    return send(res, 200, headers, data);
  } catch (err) {
    return send(
      res,
      500,
      { "content-type": "text/plain; charset=utf-8" },
      `Server error: ${err && err.message ? err.message : "unknown"}`
    );
  }
});

server.listen(PORT, "0.0.0.0", () => {
  // Log as plain text for portability.
  console.log(`Agent Marketplace running on http://localhost:${PORT}`);
});
