#!/usr/bin/env node
/**
 * Static site build: stitches src/layout.html + partials + per-page
 * content/meta into site/<slug>/index.html. No dependencies.
 * Run: node scripts/build.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC_PAGES = path.join(ROOT, 'src', 'pages');
// SITE_OUT_DIR lets QA build a production-mode copy into a throwaway
// directory (e.g. `site-prod-check`) without touching the committed
// `site/` tree, which is always the preview build. Defaults to `site`.
const SITE_DIR = path.join(ROOT, process.env.SITE_OUT_DIR || 'site');

const layout = fs.readFileSync(path.join(ROOT, 'src', 'layout.html'), 'utf8');
let header = fs.readFileSync(path.join(ROOT, 'src', 'partials', 'header.html'), 'utf8');
let footer = fs.readFileSync(path.join(ROOT, 'src', 'partials', 'footer.html'), 'utf8');
// Minimal chrome for dedicated paid-traffic landing pages (meta.landingChrome
// = true): brand + click-to-call + one CTA in the header, legal-minimum
// links only in the footer — no primary nav, no sitemap columns, so a
// visitor who clicked a Meta ad has nowhere to leak out to except the form
// itself or genuinely necessary legal/contact links.
let landingHeader = fs.readFileSync(path.join(ROOT, 'src', 'partials', 'header-landing.html'), 'utf8');
let landingFooter = fs.readFileSync(path.join(ROOT, 'src', 'partials', 'footer-landing.html'), 'utf8');
// Stricter chrome for single-page paid-traffic conversion pages
// (meta.landingChromeStrict = true): unlike landingChrome above, the logo
// is not a link and the footer drops the terms/complaints links — no way
// to leave the page at all except genuinely necessary contact/legal links.
// A distinct flag/partial pair rather than changing header-landing.html
// itself, so the existing BESS3/BESS4 funnel (which does link its logo
// home) is unaffected.
let conversionHeader = fs.readFileSync(path.join(ROOT, 'src', 'partials', 'header-conversion.html'), 'utf8');
let conversionFooter = fs.readFileSync(path.join(ROOT, 'src', 'partials', 'footer-conversion.html'), 'utf8');

// Defaults to PREVIEW (noindex/nofollow) — see the matching comment near
// robots.txt generation below for when/how this flips to production.
const IS_PRODUCTION = process.env.BUILD_TARGET === 'production';

// Publication status for sections that are only real once genuine,
// owner-approved content exists (see docs/owner-inputs-required.md).
// Unpublished sections still BUILD (so they're reviewable in preview and
// stay live in dev) but in a production build they're pulled out of primary
// navigation and out of the sitemap, and the page itself is marked
// noindex — never shown as "coming soon" copy, just quietly not promoted.
const siteStatus = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'site-status.json'), 'utf8'));

// Strip <!--NAV:key--> ... <!--/NAV:key--> blocks from header/footer markup
// for any key that isn't published, but only for the production build —
// the preview build always shows every nav entry so it stays fully
// reviewable and clickable during development.
function applyNavGating(html) {
  if (!IS_PRODUCTION) return html.replace(/<!--\/?NAV:[\w-]+-->/g, '');
  return html.replace(/<!--NAV:([\w-]+)-->([\s\S]*?)<!--\/NAV:\1-->/g, (m, key, inner) =>
    siteStatus[key] && siteStatus[key].published ? inner : ''
  );
}
header = applyNavGating(header);
footer = applyNavGating(footer);
landingHeader = applyNavGating(landingHeader);
landingFooter = applyNavGating(landingFooter);

function fill(tpl, vars) {
  return tpl.replace(/{{(\w+)}}/g, (m, key) => (key in vars ? vars[key] : ''));
}

// Production origin: https://ozhomeenergy.com.au (non-www) — the live
// domain's www subdomain redirects here, so every canonical/OG/schema/
// sitemap URL this build emits uses the apex host consistently. See
// docs/legacy-url-migration.md.
const PRODUCTION_ORIGIN = 'https://ozhomeenergy.com.au';

// site/ is committed to the repo so it already exists, but a throwaway
// SITE_OUT_DIR (see above) needs creating on a fresh checkout/CI run.
fs.mkdirSync(SITE_DIR, { recursive: true });

// css/js/img are committed directly under site/ (this build only ever
// generates HTML, never those assets) — fine for the default SITE_DIR,
// but a throwaway SITE_OUT_DIR starts empty and would otherwise build HTML
// that references /img/... paths nothing on disk backs, tripping the
// missing-local-asset check in scripts/qa-static-checks.js for every real
// <img> the page has (a false failure of the QA harness, not a real broken
// deploy — see the production-mode QA step in .github/workflows/qa.yml).
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}
const CANONICAL_SITE_DIR = path.join(ROOT, 'site');
if (path.resolve(SITE_DIR) !== path.resolve(CANONICAL_SITE_DIR)) {
  for (const dir of ['css', 'js', 'img']) {
    copyDir(path.join(CANONICAL_SITE_DIR, dir), path.join(SITE_DIR, dir));
  }
}

function breadcrumbSchema(crumbs, canonical) {
  const items = crumbs.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: c.name,
    item: PRODUCTION_ORIGIN + c.url,
  }));
  return `<script type="application/ld+json">\n${JSON.stringify(
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items },
    null,
    2
  )}\n</script>`;
}

const pageDirs = fs
  .readdirSync(SRC_PAGES)
  .filter((d) => fs.statSync(path.join(SRC_PAGES, d)).isDirectory())
  .sort();

const builtPages = [];

for (const dir of pageDirs) {
  const pageDir = path.join(SRC_PAGES, dir);
  const metaPath = path.join(pageDir, 'meta.json');
  const contentPath = path.join(pageDir, 'content.html');
  if (!fs.existsSync(metaPath) || !fs.existsSync(contentPath)) {
    console.warn(`Skipping ${dir}: missing meta.json or content.html`);
    continue;
  }
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  const body = fs.readFileSync(contentPath, 'utf8');

  let schema = '';
  if (meta.breadcrumbs && meta.breadcrumbs.length) {
    schema += breadcrumbSchema(meta.breadcrumbs, meta.canonical) + '\n';
  }
  if (meta.extraSchemaFile) {
    schema += fs.readFileSync(path.join(pageDir, meta.extraSchemaFile), 'utf8') + '\n';
  }

  let extraScript = '';
  if (meta.extraScripts) {
    extraScript = meta.extraScripts.map((s) => `<script src="${s}" defer></script>`).join('\n');
  }

  // The 404 page is never indexed, in preview or production — a "not found"
  // page ranking in search results is a bug in every configuration.
  const is404 = meta.canonical === '/404.html';

  // publishGate points a page at a src/data/site-status.json key (e.g.
  // "projects", "products") — a page whose gate isn't published yet stays
  // out of the sitemap and gets noindex even in a production build, until
  // real, owner-approved content exists for it.
  const gate = meta.publishGate ? siteStatus[meta.publishGate] : null;
  const gateUnpublished = gate ? !gate.published : false;

  // meta.noindex: true is for pages that are real, working destinations —
  // not gated on missing owner content like publishGate above — but have
  // no standalone search value and shouldn't be a page a stranger can land
  // on cold from Google (a lead-capture thank-you page, reached only by a
  // genuine successful submission redirect, is the first use of this).
  const explicitNoindex = meta.noindex === true;

  let robotsMeta;
  if (is404) robotsMeta = 'noindex, nofollow';
  else if (!IS_PRODUCTION) robotsMeta = 'noindex, nofollow';
  else if (explicitNoindex) robotsMeta = 'noindex, follow';
  else robotsMeta = gateUnpublished ? 'noindex, follow' : 'index, follow';

  const html = fill(layout, {
    TITLE: meta.title,
    DESCRIPTION: meta.description,
    CANONICAL: meta.canonical,
    SCHEMA: schema,
    ROBOTS_META: robotsMeta,
    EXTRA_HEAD: meta.extraHead || '',
    HEADER: meta.landingChromeStrict ? conversionHeader : meta.landingChrome ? landingHeader : header,
    BODY: body,
    FOOTER: meta.landingChromeStrict ? conversionFooter : meta.landingChrome ? landingFooter : footer,
    EXTRA_SCRIPT: extraScript,
  });

  if (is404) {
    // Ships at the site root as a literal 404.html — the filename GitHub
    // Pages (and most static hosts) look for to serve a real 404 status on
    // any unmatched route, rather than a folder needing /404.html/ as a URL.
    fs.writeFileSync(path.join(SITE_DIR, '404.html'), html, 'utf8');
    console.log('Built /404.html');
    continue;
  }

  const outDir = meta.canonical === '/' ? SITE_DIR : path.join(SITE_DIR, meta.canonical.replace(/^\/|\/$/g, ''));
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
  // Unpublished-gate pages are still built (reviewable, and always in the
  // preview build) but never listed in the sitemap once in production.
  if (!(IS_PRODUCTION && gateUnpublished) && !explicitNoindex) builtPages.push(meta.canonical);
  console.log(`Built ${meta.canonical}${IS_PRODUCTION && gateUnpublished ? ' (production: noindex, kept out of sitemap/nav — publishGate not yet published)' : ''}`);
}

// ---------------------------------------------------------------------
// Legacy URL compatibility bridge pages (see docs/legacy-url-migration.md)
//
// Every route in redirects/legacy-routes.json gets a real, built page at
// its old URL so it never 404s — but this is a CLIENT-SIDE bridge
// (`<meta http-equiv="refresh">` + a visible fallback link), not a real
// HTTP redirect: GitHub Pages, where this repo's preview is hosted, cannot
// serve server-side redirects at all. scripts/build-redirects.js generates
// the actual 301/302 configuration for whatever the real production host
// needs, from this same source file. Both must exist together — this loop
// is what stops the legacy route 404ing on the preview; build-redirects.js
// is what makes it a real redirect once deployed for real. These bridge
// pages are always noindex and are never added to the sitemap in any
// build — they carry no content of their own worth ranking.
const legacyRoutes = JSON.parse(fs.readFileSync(path.join(ROOT, 'redirects', 'legacy-routes.json'), 'utf8')).routes;
for (const route of legacyRoutes) {
  const slug = route.from.replace(/^\/|\/$/g, '');
  const destLabel = route.to === '/' ? 'the homepage' : route.to;
  const body = `<section class="section-tight">\n  <div class="container container-narrow text-center">\n    <p class="eyebrow">Page moved</p>\n    <h1>This page has moved</h1>\n    <p class="lede" style="margin-inline:auto;">You should be redirected automatically. If not, continue to <a href="${route.to}">${destLabel}</a>.</p>\n  </div>\n</section>\n`;
  const html = fill(layout, {
    TITLE: 'Page Moved | Oz Home Energy',
    DESCRIPTION: `This page has moved to ${route.to}.`,
    CANONICAL: route.to,
    SCHEMA: '',
    ROBOTS_META: 'noindex, follow',
    EXTRA_HEAD: `<meta http-equiv="refresh" content="0; url=${route.to}">`,
    HEADER: header,
    BODY: body,
    FOOTER: footer,
    EXTRA_SCRIPT: '',
  });
  const outDir = path.join(SITE_DIR, slug);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
  console.log(`Built legacy bridge ${route.from} -> ${route.to} (${route.status}, client-side only — see build-redirects.js for the real host config)`);
}

// sitemap.xml
const urls = builtPages
  .sort()
  .map((p) => `  <url><loc>${PRODUCTION_ORIGIN}${p}</loc><changefreq>monthly</changefreq></url>`)
  .join('\n');
fs.writeFileSync(
  path.join(SITE_DIR, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  'utf8'
);

// robots.txt mirrors the same IS_PRODUCTION flag used for ROBOTS_META above —
// defaults to blocking crawling (preview), only opens up with
// BUILD_TARGET=production for the real ozhomeenergy.com.au domain.
fs.writeFileSync(
  path.join(SITE_DIR, 'robots.txt'),
  IS_PRODUCTION
    ? `User-agent: *\nAllow: /\nSitemap: ${PRODUCTION_ORIGIN}/sitemap.xml\n`
    : `User-agent: *\nDisallow: /\n`,
  'utf8'
);

console.log(`\nBuilt ${builtPages.length} pages (${IS_PRODUCTION ? 'production' : 'preview'} robots.txt).`);
