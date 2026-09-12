#!/usr/bin/env node
/**
 * Minimal static server that mimics GitHub Pages project-site serving
 * closely enough for QA: files under `pages-dist/` are served beneath a
 * `/<repo>/` URL prefix, and any unmatched path (at any depth) gets
 * `404.html`'s content back with a real 404 status — exactly the behaviour
 * scripts/build-pages.js's 404 link rewrite (see the comment there) has to
 * survive. Not a general-purpose server; QA-only, no dependencies.
 *
 * Usage: node scripts/qa-pages-server.js [port] [basePath]
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.argv[2]) || 8822;
const BASE_PATH = process.argv[3] || '/Oz-Home-energy-redesign';
const ROOT = path.join(__dirname, '..', 'pages-dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
};

function send(res, status, filePath) {
  const ext = path.extname(filePath);
  res.writeHead(status, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (!urlPath.startsWith(BASE_PATH)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not under ' + BASE_PATH);
    return;
  }
  let rel = urlPath.slice(BASE_PATH.length) || '/';
  if (rel.endsWith('/')) rel += 'index.html';
  const filePath = path.join(ROOT, rel);
  if (filePath.startsWith(ROOT) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    send(res, 200, filePath);
    return;
  }
  // Unmatched route, any depth: GitHub Pages' actual 404 behaviour.
  send(res, 404, path.join(ROOT, '404.html'));
});

server.listen(PORT, () => {
  console.log(`QA GitHub-Pages-alike server: http://localhost:${PORT}${BASE_PATH}/ (root: ${ROOT})`);
});
