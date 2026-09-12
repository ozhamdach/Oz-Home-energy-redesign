#!/usr/bin/env node
/**
 * Static (non-browser) QA checks against the built site — fast, exact,
 * regex/string-based checks that don't need a browser. Complements
 * scripts/qa-playwright.js (which covers interaction/visual/console-error
 * checks a static pass can't). No dependencies, matches this repo's
 * "no dependencies" build philosophy.
 *
 * Usage:
 *   node scripts/build.js && node scripts/build-redirects.js
 *   node scripts/qa-static-checks.js                    # preview build in site/
 *   SITE_OUT_DIR=site-prod-check BUILD_TARGET=production node scripts/build.js \
 *     && node scripts/qa-static-checks.js --production   # production build
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const IS_PRODUCTION_CHECK = process.argv.includes('--production');
const SITE_DIR = path.join(ROOT, IS_PRODUCTION_CHECK ? 'site-prod-check' : 'site');
const PRODUCTION_ORIGIN = 'https://ozhomeenergy.com.au';

const legacyRoutes = JSON.parse(fs.readFileSync(path.join(ROOT, 'redirects', 'legacy-routes.json'), 'utf8')).routes;
const siteStatus = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'site-status.json'), 'utf8'));

const failures = [];
const fail = (msg) => failures.push(msg);

function walkHtml(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkHtml(p));
    else if (entry.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function isLegacyBridge(relSlug) {
  return legacyRoutes.some((r) => r.from.replace(/^\/|\/$/g, '') === relSlug);
}

function isGated(relSlug) {
  const meta = { projects: 'projects', products: 'products' }[relSlug];
  return meta ? siteStatus[meta] && !siteStatus[meta].published : false;
}

const files = walkHtml(SITE_DIR);
if (!files.length) {
  console.error(`No .html files found under ${SITE_DIR} — did you run the build first?`);
  process.exit(1);
}

const titles = new Map();
const descriptions = new Map();
const FORBIDDEN_PHRASES = [
  /OWNER CONFIRMATION REQUIRED/,
  /coming soon/i,
  /under construction/i,
  /we.?re building this (page|section) out/i,
  /we.?re finalising/i,
  /we.?re finalizing/i,
];

for (const file of files) {
  const rawHtml = fs.readFileSync(file, 'utf8');
  // Strip HTML comments before any text/content check below — an internal
  // dev comment (e.g. header.html's disabled announcement bar) is invisible
  // to users and to search engines, and this project's convention is
  // explicitly that only comments may reference draft/internal markers like
  // "OWNER CONFIRMATION REQUIRED". Structural checks (canonical, robots,
  // h1 count, links) all read from the same stripped string too, since none
  // of those should ever legitimately live inside a comment either.
  const html = rawHtml.replace(/<!--[\s\S]*?-->/g, '');
  const rel = path.relative(SITE_DIR, file);
  const slug = rel === '404.html' ? '404' : rel.replace(/\/index\.html$/, '').replace(/^index\.html$/, '');
  const isBridge = isLegacyBridge(slug);
  const is404 = slug === '404';

  // --- title / description uniqueness ---
  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  const descMatch = html.match(/<meta name="description" content="([^"]*)">/);
  if (!isBridge) {
    if (titleMatch) {
      const t = titleMatch[1];
      if (!titles.has(t)) titles.set(t, []);
      titles.get(t).push(rel);
    } else {
      fail(`${rel}: missing <title>`);
    }
    if (descMatch) {
      const d = descMatch[1];
      if (!descriptions.has(d)) descriptions.set(d, []);
      descriptions.get(d).push(rel);
    } else {
      fail(`${rel}: missing meta description`);
    }
  }

  // --- exactly one H1 ---
  const h1Count = (html.match(/<h1[ >]/g) || []).length;
  if (h1Count !== 1) fail(`${rel}: expected exactly one <h1>, found ${h1Count}`);

  // --- canonical uses the chosen non-www production origin ---
  const canonicalMatch = html.match(/<link rel="canonical" href="([^"]*)">/);
  if (canonicalMatch) {
    if (!canonicalMatch[1].startsWith(PRODUCTION_ORIGIN)) {
      fail(`${rel}: canonical "${canonicalMatch[1]}" does not use ${PRODUCTION_ORIGIN}`);
    }
  } else {
    fail(`${rel}: missing canonical link`);
  }
  if (html.includes('www.ozhomeenergy.com.au')) {
    fail(`${rel}: still references the redirecting www hostname`);
  }

  // --- robots meta ---
  const robotsMatch = html.match(/<meta name="robots" content="([^"]*)">/);
  const robots = robotsMatch ? robotsMatch[1] : null;
  if (!IS_PRODUCTION_CHECK) {
    // Legacy bridge pages and 404 are deliberately "noindex, follow" in
    // BOTH preview and production (see scripts/build.js) — only real
    // content pages must be the stricter "noindex, nofollow" in preview.
    if (is404 || isBridge) {
      if (!robots || !robots.startsWith('noindex')) fail(`${rel}: expected noindex (found "${robots}")`);
    } else if (robots !== 'noindex, nofollow') {
      fail(`${rel}: preview build must be noindex, nofollow (found "${robots}")`);
    }
  } else {
    if (is404 || isBridge || isGated(slug)) {
      if (!robots || !robots.startsWith('noindex')) {
        fail(`${rel}: expected noindex in production (404/legacy-bridge/unpublished-gate page), found "${robots}"`);
      }
    } else if (robots !== 'index, follow') {
      fail(`${rel}: production build must be index, follow for a real published page (found "${robots}")`);
    }
  }

  // --- no active form posts to "#" ---
  if (/<form\b[^>]*action="#"/.test(html)) {
    fail(`${rel}: a <form> still has action="#"`);
  }

  // --- no fake success affordance ---
  // The real success/pending-notice markup is only ever injected client-side
  // (see site/js/main.js, site/js/assessment.js) — it should never appear in
  // the static, server-rendered HTML at all. This just catches a regression
  // back toward the old server-rendered "success" class or copy.
  if (/class="assess-success"/.test(html) || /Thanks[^<]{0,40}noted/i.test(html)) {
    fail(`${rel}: possible fake success affordance found in static HTML`);
  }

  // --- no placeholder / unfinished-page language ---
  for (const re of FORBIDDEN_PHRASES) {
    if (re.test(html)) fail(`${rel}: forbidden placeholder/unfinished-page language matching ${re}`);
  }

  // --- images: local assets exist, alt text present ---
  const imgTags = html.match(/<img\b[^>]*>/g) || [];
  for (const tag of imgTags) {
    const altMatch = tag.match(/alt="([^"]*)"/);
    if (!altMatch || !altMatch[1].trim()) fail(`${rel}: <img> missing meaningful alt text: ${tag}`);
    const srcMatch = tag.match(/src="([^"]*)"/);
    if (srcMatch && srcMatch[1].startsWith('/')) {
      const assetPath = path.join(SITE_DIR, srcMatch[1]);
      if (!fs.existsSync(assetPath)) fail(`${rel}: <img> references missing local asset ${srcMatch[1]}`);
    }
  }

  // --- internal links resolve to a real built page ---
  const hrefs = [...html.matchAll(/href="([^"]*)"/g)].map((m) => m[1]);
  for (const href of hrefs) {
    if (!href.startsWith('/') || href === '/') continue;
    if (href.startsWith('//')) continue;
    // Static assets (css/js/img) live directly in site/ and aren't part of
    // build.js's per-page HTML output — a throwaway SITE_OUT_DIR (used for
    // the production-mode QA pass) never has them copied in, so checking
    // for them here would be checking the wrong thing. site/css, site/js
    // and site/img are version-controlled directly; nothing generates them.
    if (/^\/(css|js|img)\//.test(href)) continue;
    const cleanPath = href.split(/[?#]/)[0];
    const target = cleanPath.endsWith('/')
      ? path.join(SITE_DIR, cleanPath, 'index.html')
      : path.join(SITE_DIR, cleanPath);
    const targetAsDir = path.join(SITE_DIR, cleanPath, 'index.html');
    if (!fs.existsSync(target) && !fs.existsSync(targetAsDir)) {
      fail(`${rel}: internal link "${href}" does not resolve to a built page`);
    }
  }

  // --- legacy bridge pages: meta refresh + noindex + working link ---
  if (isBridge) {
    const route = legacyRoutes.find((r) => r.from.replace(/^\/|\/$/g, '') === slug);
    if (!html.includes(`content="0; url=${route.to}"`)) {
      fail(`${rel}: legacy bridge page missing meta-refresh to ${route.to}`);
    }
    if (!robots || !robots.startsWith('noindex')) {
      fail(`${rel}: legacy bridge page must be noindex (found "${robots}")`);
    }
    if (!html.includes(`href="${route.to}"`)) {
      fail(`${rel}: legacy bridge page missing a visible fallback link to ${route.to}`);
    }
  }
}

// --- uniqueness across the whole build (excluding bridge/gated-noindex pages) ---
for (const [title, pages] of titles) {
  if (pages.length > 1) fail(`Duplicate <title> "${title}" on: ${pages.join(', ')}`);
}
for (const [desc, pages] of descriptions) {
  if (pages.length > 1) fail(`Duplicate meta description "${desc.slice(0, 60)}..." on: ${pages.join(', ')}`);
}

// --- every legacy route actually has a built bridge page ---
for (const route of legacyRoutes) {
  const slug = route.from.replace(/^\/|\/$/g, '');
  if (!files.some((f) => path.relative(SITE_DIR, f) === path.join(slug, 'index.html'))) {
    fail(`Legacy route ${route.from} -> ${route.to} has no built bridge page`);
  }
}

// --- production robots.txt ---
if (IS_PRODUCTION_CHECK) {
  const robotsTxt = fs.readFileSync(path.join(SITE_DIR, 'robots.txt'), 'utf8');
  if (!/Allow: \//.test(robotsTxt)) fail('production robots.txt does not Allow: /');
  if (!robotsTxt.includes(PRODUCTION_ORIGIN)) fail('production robots.txt sitemap line does not use the production origin');
} else {
  const robotsTxt = fs.readFileSync(path.join(SITE_DIR, 'robots.txt'), 'utf8');
  if (!/Disallow: \//.test(robotsTxt)) fail('preview robots.txt does not Disallow: / (must block all crawling)');
}

console.log(`Checked ${files.length} built HTML files under ${SITE_DIR} (${IS_PRODUCTION_CHECK ? 'production' : 'preview'} mode).`);
if (failures.length) {
  console.log(`\nSTATIC QA FAILURES (${failures.length}):`);
  failures.forEach((f) => console.log(' -', f));
  process.exitCode = 1;
} else {
  console.log('STATIC QA PASSED.');
}
