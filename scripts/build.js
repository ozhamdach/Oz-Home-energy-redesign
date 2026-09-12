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
const SITE_DIR = path.join(ROOT, 'site');

const layout = fs.readFileSync(path.join(ROOT, 'src', 'layout.html'), 'utf8');
const header = fs.readFileSync(path.join(ROOT, 'src', 'partials', 'header.html'), 'utf8');
const footer = fs.readFileSync(path.join(ROOT, 'src', 'partials', 'footer.html'), 'utf8');

// Defaults to PREVIEW (noindex/nofollow) — see the matching comment near
// robots.txt generation below for when/how this flips to production.
const IS_PRODUCTION = process.env.BUILD_TARGET === 'production';

function fill(tpl, vars) {
  return tpl.replace(/{{(\w+)}}/g, (m, key) => (key in vars ? vars[key] : ''));
}

function breadcrumbSchema(crumbs, canonical) {
  const items = crumbs.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: c.name,
    item: 'https://www.ozhomeenergy.com.au' + c.url,
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

  const html = fill(layout, {
    TITLE: meta.title,
    DESCRIPTION: meta.description,
    CANONICAL: meta.canonical,
    SCHEMA: schema,
    ROBOTS_META: is404 ? 'noindex, nofollow' : IS_PRODUCTION ? 'index, follow' : 'noindex, nofollow',
    EXTRA_HEAD: meta.extraHead || '',
    HEADER: header,
    BODY: body,
    FOOTER: footer,
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
  builtPages.push(meta.canonical);
  console.log(`Built ${meta.canonical}`);
}

// sitemap.xml
const urls = builtPages
  .sort()
  .map(
    (p) =>
      `  <url><loc>https://www.ozhomeenergy.com.au${p}</loc><changefreq>monthly</changefreq></url>`
  )
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
    ? `User-agent: *\nAllow: /\nSitemap: https://www.ozhomeenergy.com.au/sitemap.xml\n`
    : `User-agent: *\nDisallow: /\n`,
  'utf8'
);

console.log(`\nBuilt ${builtPages.length} pages (${IS_PRODUCTION ? 'production' : 'preview'} robots.txt).`);
