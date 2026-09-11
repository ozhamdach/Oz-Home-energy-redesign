#!/usr/bin/env node
/**
 * Converts the root-relative `site/` build (correct for the real custom
 * domain, ozhomeenergy.com.au) into a fully relative-path build suitable
 * for hosting under a URL subpath — e.g. GitHub Pages project sites, which
 * serve from https://<user>.github.io/<repo>/ rather than domain root.
 *
 * Run: node scripts/build.js && node scripts/build-pages.js
 * Output: pages-dist/ (gitignored — generated at deploy time, not committed)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const OUT = path.join(ROOT, 'pages-dist');

if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

// Static assets copy as-is
copyDir(path.join(SITE, 'css'), path.join(OUT, 'css'));
copyDir(path.join(SITE, 'js'), path.join(OUT, 'js'));
copyDir(path.join(SITE, 'img'), path.join(OUT, 'img'));
fs.copyFileSync(path.join(SITE, 'robots.txt'), path.join(OUT, 'robots.txt'));
fs.copyFileSync(path.join(SITE, 'sitemap.xml'), path.join(OUT, 'sitemap.xml'));

const ATTR_RE = /(href|src)="(\/[^"]*)"/g;

function rewriteValue(value, prefix) {
  const m = value.match(/^([^?#]*)([?#].*)?$/);
  const pathPart = m[1];
  const rest = m[2] || '';
  const stripped = pathPart.slice(1); // drop leading "/"
  let resolved;
  if (stripped === '') resolved = 'index.html';
  else if (stripped.endsWith('/')) resolved = stripped + 'index.html';
  else resolved = stripped;
  return prefix + resolved + rest;
}

function rewriteHtml(html, prefix) {
  return html.replace(ATTR_RE, (m, attr, value) => `${attr}="${rewriteValue(value, prefix)}"`);
}

// Every page is one level deep (site/<slug>/index.html) except the home
// page (site/index.html) itself, so this is a flat two-tier structure.
const entries = fs.readdirSync(SITE, { withFileTypes: true });
let count = 0;
for (const entry of entries) {
  if (!entry.isDirectory() || ['css', 'js', 'img'].includes(entry.name)) continue;
  const srcFile = path.join(SITE, entry.name, 'index.html');
  if (!fs.existsSync(srcFile)) continue;
  const html = fs.readFileSync(srcFile, 'utf8');
  const rewritten = rewriteHtml(html, '../');
  const outDir = path.join(OUT, entry.name);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), rewritten, 'utf8');
  count++;
}

const homeHtml = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
fs.writeFileSync(path.join(OUT, 'index.html'), rewriteHtml(homeHtml, ''), 'utf8');
count++;

// GitHub Pages serves this file (with a real 404 status) for any unmatched
// route under the project site — site/404.html is the same branded page
// scripts/build.js writes for the real domain; just needs the same
// root-relative-to-relative path rewrite as every other page here.
const notFoundHtml = fs.readFileSync(path.join(SITE, '404.html'), 'utf8');
fs.writeFileSync(path.join(OUT, '404.html'), rewriteHtml(notFoundHtml, ''), 'utf8');

console.log(`Built ${count} pages into ${OUT} (relative paths, subpath-safe)`);

// Sanity check: no root-relative refs should remain
let leftover = 0;
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name.endsWith('.html')) {
      const txt = fs.readFileSync(p, 'utf8');
      const matches = txt.match(ATTR_RE);
      if (matches) leftover += matches.length;
    }
  }
}
walk(OUT);
console.log('Leftover root-relative refs:', leftover);
if (leftover > 0) process.exitCode = 1;
