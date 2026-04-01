#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docsRoot = path.resolve(__dirname, '..', 'docs');
const port = Number(process.env.PORT || 4173);

const MIME = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.ico', 'image/x-icon'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.xml', 'application/xml; charset=utf-8']
]);

function safeJoin(root, requestPath) {
  const decoded = decodeURIComponent(requestPath || '/');
  const clean = decoded.split('?')[0].split('#')[0];
  const rel = clean.replace(/^\/+/, '');
  const resolved = path.resolve(root, rel);
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

const server = http.createServer(async (req, res) => {
  try {
    const urlPath = String(req.url || '/');
    let target = safeJoin(docsRoot, urlPath);
    if (!target) {
      res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Bad Request');
      return;
    }

    let st;
    try {
      st = await fsp.stat(target);
    } catch {
      st = null;
    }

    if (st?.isDirectory()) target = path.join(target, 'index.html');
    if (!st || st.isDirectory()) {
      try {
        await fsp.stat(target);
      } catch {
        res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
        return;
      }
    }

    const ext = path.extname(target).toLowerCase();
    const type = MIME.get(ext) || 'application/octet-stream';
    res.writeHead(200, {
      'content-type': type,
      'cache-control': 'no-store'
    });
    fs.createReadStream(target).pipe(res);
  } catch (error) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(`Internal Server Error: ${error?.message || 'unknown'}`);
  }
});

server.listen(port, '127.0.0.1', () => {
  // eslint-disable-next-line no-console
  console.log(`Docs server: http://127.0.0.1:${port}/`);
  // eslint-disable-next-line no-console
  console.log(`Root: ${docsRoot}`);
});

