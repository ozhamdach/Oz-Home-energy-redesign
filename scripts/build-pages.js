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
// Legacy-route compatibility bridge pages (scripts/build.js) carry their
// redirect target inside a <meta http-equiv="refresh" content="0; url=/foo/">
// tag, not an href/src — needs the exact same root-relative -> relative
// rewrite as every other link on the page, or the bridge page would loop
// back into a 404 on GitHub Pages once this page's own URL rewriting runs.
const REFRESH_RE = /(<meta http-equiv="refresh" content="\d+;\s*url=)(\/[^"]*)(")/g;

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
  return html
    .replace(ATTR_RE, (m, attr, value) => `${attr}="${rewriteValue(value, prefix)}"`)
    .replace(REFRESH_RE, (m, pre, value, post) => `${pre}${rewriteValue(value, prefix)}${post}`);
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

// GitHub Pages serves 404.html (with a real 404 HTTP status) for ANY
// unmatched route under the project site, at ANY depth — e.g.
// /Oz-Home-energy-redesign/missing/deep-page. A path-relative rewrite (the
// same one every other page here gets) breaks for that case: relative links
// resolve against the *requested* URL's directory, so a link meant to reach
// the site root instead lands one or more folders too deep, 404-ing again.
// The fix is to anchor every link in this one file to an absolute path that
// includes the known GitHub Pages project-site base path — absolute-root
// paths resolve identically regardless of how deep the missing URL was,
// unlike this build's usual "../"-style relative rewrite, which assumes
// every page sits exactly one level below the site root (true for every
// normal page, never true for a 404 served under an arbitrary missing
// path). The PAGES_BASE_PATH must match this repo's actual GitHub Pages
// project path; override it via env if the repo is ever renamed or moved.
const PAGES_BASE_PATH = process.env.PAGES_BASE_PATH || '/Oz-Home-energy-redesign';
// Reuses the same rewriteValue()/rewriteHtml() logic (including the
// "/foo/" -> "foo/index.html" directory-index-safe suffixing) every other
// page gets — just with an absolute base prefix instead of a "../"-style
// relative one, so the result is depth-independent instead of depth-0-only.
const notFoundHtml = fs.readFileSync(path.join(SITE, '404.html'), 'utf8');
fs.writeFileSync(path.join(OUT, '404.html'), rewriteHtml(notFoundHtml, PAGES_BASE_PATH + '/'), 'utf8');

console.log(`Built ${count} pages into ${OUT} (relative paths, subpath-safe)`);

// Sanity check: no root-relative refs should remain, EXCEPT 404.html, whose
// links are deliberately absolute-with-base (see above) rather than
// relative — that's correct, not leftover, so it's checked separately.
let leftover = 0;
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name.endsWith('.html') && p !== path.join(OUT, '404.html')) {
      const txt = fs.readFileSync(p, 'utf8');
      const matches = txt.match(ATTR_RE);
      if (matches) leftover += matches.length;
    }
  }
}
walk(OUT);

// 404.html's own sanity check: every href/src must start with PAGES_BASE_PATH
// (not be genuinely root-relative, and not still be missing it).
const notFoundOut = fs.readFileSync(path.join(OUT, '404.html'), 'utf8');
const badRefs = (notFoundOut.match(ATTR_RE) || []).filter((m) => !m.includes(`="${PAGES_BASE_PATH}/`));
if (badRefs.length) {
  console.log('404.html has refs not anchored to PAGES_BASE_PATH:', badRefs);
  leftover += badRefs.length;
}
console.log('Leftover root-relative refs:', leftover);
if (leftover > 0) process.exitCode = 1;
