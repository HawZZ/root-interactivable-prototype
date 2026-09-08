import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { BASE_PATH } from "./catalog-lib.mjs";

const CONTENT_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

function safePath(root, requestPath) {
  let pathname = decodeURIComponent(new URL(requestPath, "http://localhost").pathname);
  if (pathname === BASE_PATH) pathname = `${BASE_PATH}/`;
  if (pathname.startsWith(`${BASE_PATH}/`)) pathname = pathname.slice(BASE_PATH.length);
  const relative = pathname.replace(/^\/+/, "");
  const resolved = path.resolve(root, relative || "index.html");
  if (!resolved.startsWith(`${path.resolve(root)}${path.sep}`) && resolved !== path.resolve(root)) return null;
  return resolved;
}

export async function startStaticServer(root, port = 0) {
  const server = createServer(async (request, response) => {
    try {
      let filePath = safePath(root, request.url || "/");
      if (!filePath) {
        response.writeHead(403).end("Forbidden");
        return;
      }
      const fileStats = await stat(filePath).catch(() => null);
      if (fileStats?.isDirectory()) filePath = path.join(filePath, "index.html");
      const body = await readFile(filePath);
      response.writeHead(200, {
        "cache-control": "no-store",
        "content-type": CONTENT_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream"
      });
      response.end(body);
    } catch {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
    }
  });

  await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
  const address = server.address();
  return {
    server,
    origin: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  };
}
