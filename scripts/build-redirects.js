#!/usr/bin/env node
/**
 * Generates the host-agnostic real-redirect configuration
 * (redirects/_redirects, redirects/redirects.json) from the single source
 * of truth at redirects/legacy-routes.json. Run alongside scripts/build.js
 * (which generates the GitHub Pages *compatibility* bridge pages from the
 * same file — see the comment there and docs/legacy-url-migration.md for
 * why those are a different, weaker mechanism than what this script emits).
 *
 * Run: node scripts/build-redirects.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const routes = JSON.parse(fs.readFileSync(path.join(ROOT, 'redirects', 'legacy-routes.json'), 'utf8')).routes;

// Every `from` is stored without a trailing slash; most redirect engines
// (Netlify/Cloudflare Pages `_redirects` included) match trailing and
// non-trailing paths as distinct literal rules, so both are emitted.
function bothSlashVariants(route) {
  return [
    { from: route.from, to: route.to, status: route.status },
    { from: route.from + '/', to: route.to, status: route.status },
  ];
}

const allVariants = routes.flatMap(bothSlashVariants);

const redirectsFileLines = [
  '# Production redirect configuration for ozhomeenergy.com.au',
  '#',
  '# GENERATED FILE — do not hand-edit. Source of truth: redirects/legacy-routes.json',
  '# (run `node scripts/build-redirects.js` to regenerate).',
  '#',
  '# Format: Netlify/Cloudflare Pages-style `_redirects` (source destination code).',
  '# Host-agnostic starting point — translate into whatever the production host',
  '# actually needs (nginx `return 301`/`302`, Apache `.htaccess` RewriteRule, a',
  '# platform-specific redirects config, etc). GitHub Pages, where the preview',
  '# in this repo is hosted, CANNOT serve real server-side redirects at all — see',
  '# docs/legacy-url-migration.md for what this repo does instead for the preview',
  '# (a client-side compatibility bridge page, not a substitute for this file).',
  '#',
  '# 301 = confirmed permanent mapping to a page that now exists.',
  '# 302 = temporary — a location route preserved so it never 404s, pending real',
  '#       localized content; do NOT convert to 301 until that content exists.',
  '',
];
for (const r of allVariants) {
  redirectsFileLines.push(`${r.from.padEnd(32)} ${r.to.padEnd(30)} ${r.status}`);
}
redirectsFileLines.push(
  '',
  '# NOT included above — every current-site URL not named in the working brief.',
  '# This sandbox could not crawl ozhomeenergy.com.au directly (see',
  '# docs/01-audit-and-positioning.md), so this file only covers the specific',
  '# old URLs the brief named plus the existing location routes. Before go-live,',
  '# export the full indexed URL list (Search Console -> Pages, plus a full',
  '# crawl) and add a 1:1 mapping for anything not already covered here — see',
  '# docs/legacy-url-migration.md.'
);
fs.writeFileSync(path.join(ROOT, 'redirects', '_redirects'), redirectsFileLines.join('\n') + '\n', 'utf8');

const redirectsJson = {
  _comment:
    'GENERATED FILE — do not hand-edit. Source of truth: redirects/legacy-routes.json (run `node scripts/build-redirects.js` to regenerate). Host-agnostic JSON for whatever production redirect mechanism is used (Cloudflare Worker, Express middleware, nginx map file generator, etc). See docs/legacy-url-migration.md for the full migration plan, including why GitHub Pages (this repo’s preview host) cannot serve any of these as real HTTP redirects.',
  redirects: allVariants,
};
fs.writeFileSync(path.join(ROOT, 'redirects', 'redirects.json'), JSON.stringify(redirectsJson, null, 2) + '\n', 'utf8');

console.log(`Generated ${allVariants.length} redirect rules (${routes.length} routes x 2 slash variants) into redirects/_redirects and redirects/redirects.json`);
