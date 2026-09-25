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

// Slugs whose own src/pages/<dir>/meta.json sets `"noindex": true` (see
// scripts/build.js) — a real, working page with no standalone search
// value (currently just the lead-form thank-you page and the two paid
// commercial landing pages), as opposed to isGated()'s "not published
// yet" pages below. Read directly from meta.json rather than hardcoding
// page names here, so this stays correct as more pages opt in.
const explicitNoindexSlugs = new Set();
// Slugs whose meta.json sets `"publishGate": "<siteStatus key>"` — read
// dynamically for the same reason, so a new gate (e.g. the commercial
// battery assessment funnel) never has to be hand-added here too.
const gatedSlugs = new Map(); // slug -> siteStatus key
const SRC_PAGES = path.join(ROOT, 'src', 'pages');
for (const dir of fs.readdirSync(SRC_PAGES, { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  const metaPath = path.join(SRC_PAGES, dir.name, 'meta.json');
  if (!fs.existsSync(metaPath)) continue;
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  const slug = meta.canonical.replace(/^\/|\/$/g, '');
  if (meta.noindex === true) explicitNoindexSlugs.add(slug);
  if (meta.publishGate) gatedSlugs.set(slug, meta.publishGate);
}

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
  const key = gatedSlugs.get(relSlug);
  return key ? siteStatus[key] && !siteStatus[key].published : false;
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
  const rel = path.relative(SITE_DIR, file);
  const slug = rel === '404.html' ? '404' : rel.replace(/\/index\.html$/, '').replace(/^index\.html$/, '');
  const isBridge = isLegacyBridge(slug);
  const is404 = slug === '404';

  // --- zero HTML comments in generated output ---
  // scripts/build.js strips every HTML comment from a page immediately
  // before writing it (source files may still carry internal notes and
  // disabled draft blocks — none of that may reach a public HTML source
  // view). This is the invariant check for that, not a workaround for it:
  // if this ever fires, build.js has a real bug, not this check.
  if (rawHtml.includes('<!--')) {
    fail(`${rel}: generated output still contains an HTML comment — scripts/build.js must strip all comments before writing`);
  }

  // --- Tesla references gated to approved pages + approved titles only ---
  // Tesla written marketing/publication approval was obtained 25 Sep 2026
  // from energyproductsmarketing@tesla.com (see the Tesla section of
  // docs/owner-inputs-required.md for the full evidence trail), covering
  // exactly three placements: the homepage trust card, the battery-storage
  // feature block, and the dedicated /tesla-powerwall-3/ page — on
  // condition the official titles "Tesla Energy Certified Installer"
  // and/or "Tesla Powerwall Certified Installer" are used consistently.
  // This check enforces both halves of that: Tesla content may ONLY
  // appear on the three approved pages, and wherever it does, at least
  // one of the two approved titles must be present.
  const teslaApprovedSlugs = new Set(['index.html', 'battery-storage/index.html', 'tesla-powerwall-3/index.html']);
  if (/tesla/i.test(rawHtml)) {
    if (!teslaApprovedSlugs.has(rel)) {
      fail(`${rel}: generated output contains a Tesla reference outside the three Tesla-approved pages (/, /battery-storage/, /tesla-powerwall-3/)`);
    } else if (!/Tesla Energy Certified Installer|Tesla Powerwall Certified Installer/.test(rawHtml)) {
      fail(`${rel}: Tesla reference present but missing the official title ("Tesla Energy Certified Installer" or "Tesla Powerwall Certified Installer") Tesla's approval requires`);
    }
  }

  // --- zero unconfirmed contact-email addresses in generated output ---
  // Neither inbox has been owner-confirmed as real/monitored — see
  // docs/owner-inputs-required.md. Phone + /service-request/ are the only
  // confirmed contact paths until that changes.
  if (/admin@ozhomeenergy\.com\.au|support@ozhomeenergy\.com\.au/i.test(rawHtml)) {
    fail(`${rel}: generated output contains an unconfirmed contact email address`);
  }

  // --- zero superseded phone number in generated output ---
  // 0420 113 216 / +61420113216 was a genuine live NAP conflict found
  // during the critical audit repair pass (still present in the
  // Electrician schema's telephone array and the footer's "Alternate
  // phone" line despite an earlier doc entry claiming it was resolved).
  // Permanent regression check — the only confirmed number is
  // 0435 336 336 / +61435336336.
  if (/0420\s*113\s*216|\+?61\s*420\s*113\s*216/.test(rawHtml)) {
    fail(`${rel}: generated output contains the superseded phone number 0420 113 216`);
  }

  // --- "Greater Sydney" service-area claim ---
  // Superseded 24 Sep 2026 (site-loop, Home round 5): owner explicitly
  // confirmed the Greater Sydney boundary (previously this gate blocked
  // the phrase pending that confirmation — see docs/owner-inputs-required.md).
  // No specific suburb list has been supplied though, so a suburb grid or
  // individual suburb pages are still out of scope; that's a separate,
  // still-open item.

  // --- 15-Year Workmanship Warranty: owner-directed restoration, 24 Sep
  // 2026 — this is an owner-supplied business claim, not independently
  // verified or solicitor-reviewed (see docs/owner-inputs-required.md).
  // Rather than banning the phrase, these checks confirm the claim only
  // ever appears with its required context: the homepage and About page
  // state it, and the About/FAQ explanations both distinguish workmanship
  // coverage from manufacturer product warranties and preserve Australian
  // Consumer Law rights.
  const isHome = slug === '';
  const isAbout = slug === 'about';
  const isFaqs = slug === 'faqs';
  if ((isHome || isAbout) && !/15-Year Workmanship Warranty/.test(rawHtml)) {
    fail(`${rel}: expected the exact phrase "15-Year Workmanship Warranty"`);
  }
  if (isAbout || isFaqs) {
    if (!/manufacturer/i.test(rawHtml) || !/separate/i.test(rawHtml)) {
      fail(`${rel}: warranty explanation must distinguish Oz Home Energy's workmanship coverage from separate manufacturer product warranties`);
    }
    if (!/Australian Consumer Law/i.test(rawHtml)) {
      fail(`${rel}: warranty explanation must preserve Australian Consumer Law rights`);
    }
  }

  // --- Evnex Certified Installer badge: owner-directed publication, 24
  // Sep 2026 — badge path + accessible alt text must appear on the
  // homepage, and the badge file itself must exist in the generated
  // deployment (checked once, after this loop). Premium redesign, 24 Sep
  // 2026: switched from the white variant (shown on a boxed dark stage)
  // to the dark variant (shown directly against the section background,
  // no stage) — see docs/owner-inputs-required.md.
  if (isHome) {
    if (!rawHtml.includes('/img/brand/evnex/evnex-certified-installer-dark.png')) {
      fail(`${rel}: expected the Evnex Certified Installer badge image path`);
    }
    if (!/alt="Evnex Certified Installer"/.test(rawHtml)) {
      fail(`${rel}: Evnex Certified Installer badge is missing accessible alt text`);
    }
  }

  // html === rawHtml now that comments are stripped at build time (kept as
  // a separate variable, rather than removed, so every check below still
  // reads from a name that makes clear it's checking rendered content).
  const html = rawHtml;

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
    if (is404 || isBridge || isGated(slug) || explicitNoindexSlugs.has(slug)) {
      if (!robots || !robots.startsWith('noindex')) {
        fail(`${rel}: expected noindex in production (404/legacy-bridge/unpublished-gate/explicit-noindex page), found "${robots}"`);
      }
    } else if (robots !== 'index, follow') {
      fail(`${rel}: production build must be index, follow for a real published page (found "${robots}")`);
    }
  }

  // --- analytics: GTM + Meta Pixel loaders require BOTH a production
  // build AND a separate ENABLE_ANALYTICS=true opt-in (scripts/build.js's
  // ANALYTICS_ENABLED flag) — BUILD_TARGET=production alone must not load
  // them. This QA script doesn't rebuild the site, so it can't know which
  // flags produced the build it's checking; it trusts the same
  // ENABLE_ANALYTICS env var, which must be passed identically to both the
  // build and this check for the assertion below to test what actually
  // happened rather than what was merely intended. ---
  const analyticsShouldBeEnabled = IS_PRODUCTION_CHECK && process.env.ENABLE_ANALYTICS === 'true';
  const gtmCount = (html.match(/googletagmanager\.com\/gtm\.js/g) || []).length;
  const pixelCount = (html.match(/connect\.facebook\.net\/en_US\/fbevents\.js/g) || []).length;
  const gtmNoscriptCount = (html.match(/googletagmanager\.com\/ns\.html/g) || []).length;
  if (!analyticsShouldBeEnabled) {
    const mode = IS_PRODUCTION_CHECK ? 'production build without ENABLE_ANALYTICS=true' : 'preview build';
    if (gtmCount > 0) fail(`${rel}: ${mode} must not load GTM (found googletagmanager.com/gtm.js)`);
    if (pixelCount > 0) fail(`${rel}: ${mode} must not load the Meta Pixel (found connect.facebook.net/en_US/fbevents.js)`);
    if (gtmNoscriptCount > 0) fail(`${rel}: ${mode} must not include the GTM noscript iframe`);
    if (!/window\.dataLayer\s*=\s*window\.dataLayer\s*\|\|\s*\[\]/.test(html)) {
      fail(`${rel}: ${mode} should still declare an empty dataLayer so event-pushing code never throws`);
    }
  } else {
    if (gtmCount !== 1) fail(`${rel}: production build with ENABLE_ANALYTICS=true must load GTM exactly once (found ${gtmCount})`);
    if (pixelCount !== 1) fail(`${rel}: production build with ENABLE_ANALYTICS=true must load the Meta Pixel exactly once (found ${pixelCount})`);
    if (gtmNoscriptCount !== 1) fail(`${rel}: production build with ENABLE_ANALYTICS=true must include the GTM noscript iframe exactly once (found ${gtmNoscriptCount})`);
  }

  // --- no active form posts to "#" ---
  if (/<form\b[^>]*action="#"/.test(html)) {
    fail(`${rel}: a <form> still has action="#"`);
  }

  // --- no fake success affordance ---
  // The real success/pending-notice markup is only ever injected client-side
  // (see site/js/main.js) — it should never appear in
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
    // An empty alt is only valid a11y practice for a genuinely decorative
    // image — one explicitly marked aria-hidden="true" (its meaning, if any,
    // must already be conveyed elsewhere, e.g. an aria-label on a parent
    // link). Anything else with empty/missing alt is a real content image
    // missing its description.
    const isDecorative = /aria-hidden="true"/.test(tag);
    if ((!altMatch || !altMatch[1].trim()) && !isDecorative) {
      fail(`${rel}: <img> missing meaningful alt text: ${tag}`);
    }
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

// --- production robots.txt + sitemap exclusion for gated/noindex pages ---
if (IS_PRODUCTION_CHECK) {
  const robotsTxt = fs.readFileSync(path.join(SITE_DIR, 'robots.txt'), 'utf8');
  if (!/Allow: \//.test(robotsTxt)) fail('production robots.txt does not Allow: /');
  if (!robotsTxt.includes(PRODUCTION_ORIGIN)) fail('production robots.txt sitemap line does not use the production origin');

  // Every gated (publishGate, unpublished) or explicit-noindex page must be
  // both absent from the production sitemap AND still directly accessible
  // by URL — it's hidden from discovery, not deleted.
  const sitemapXml = fs.readFileSync(path.join(SITE_DIR, 'sitemap.xml'), 'utf8');
  const allExcludedSlugs = new Set([...explicitNoindexSlugs, ...[...gatedSlugs.keys()].filter(isGated)]);
  for (const slug of allExcludedSlugs) {
    const loc = `${PRODUCTION_ORIGIN}/${slug}/`;
    if (sitemapXml.includes(loc)) {
      fail(`sitemap.xml: gated/noindex page /${slug}/ must not appear in the production sitemap`);
    }
    if (!fs.existsSync(path.join(SITE_DIR, slug, 'index.html'))) {
      fail(`/${slug}/ is gated/noindex but was not built — it must still be directly accessible by URL, not removed`);
    }
  }

  // --- homepage must not link to /projects/ while that gate is unpublished ---
  if (!(siteStatus.projects && siteStatus.projects.published)) {
    const homeHtml = fs.readFileSync(path.join(SITE_DIR, 'index.html'), 'utf8');
    if (/href="\/projects\/"/.test(homeHtml)) {
      fail('index.html (production): links to /projects/ while siteStatus.projects.published is false — a visitor would land on an unpublished, noindex page');
    }
  }
} else {
  // Preview robots.txt must be crawlable (Allow: /), not a Disallow — see
  // the matching comment in scripts/build.js for why a Disallow can't
  // reliably keep a page out of Google's index on its own. Indexing
  // control is the page-level "noindex, nofollow" meta tag, already
  // asserted above for every preview page; this just checks robots.txt
  // isn't blocking crawlers from reaching it, and isn't advertising a
  // sitemap (nothing about a preview build should be discoverable).
  const robotsTxt = fs.readFileSync(path.join(SITE_DIR, 'robots.txt'), 'utf8');
  if (!/Allow: \//.test(robotsTxt)) fail('preview robots.txt does not Allow: / (crawlers must be able to reach the noindex meta tag)');
  if (/Disallow:/.test(robotsTxt)) fail('preview robots.txt still contains a Disallow directive — indexing control must be the page-level noindex meta tag only');
  if (/Sitemap:/.test(robotsTxt)) fail('preview robots.txt must not advertise a sitemap');
}

// --- no ?goal= links, data-pathway attributes, or ohe_pathway code ---
// Removed 25 Sep 2026 audit pass: the pathway-prefill mechanism never
// actually prefilled the cross-origin HighLevel forms — nothing read
// sessionStorage's ohe_pathway value — so it was link decoration with no
// effect. This is a permanent gate against it (or something like it)
// being reintroduced without first confirming a method HighLevel's own
// docs actually support.
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const rel = path.relative(SITE_DIR, f);
  if (/\?goal=/.test(html)) fail(`${rel}: contains a "?goal=" query parameter — the pathway-prefill mechanism was removed as non-functional; use a clean destination URL`);
  if (/data-pathway=/.test(html)) fail(`${rel}: contains a "data-pathway" attribute — the pathway-prefill mechanism was removed as non-functional`);
}
const siteJsDir = path.join(ROOT, 'site', 'js');
for (const f of findFiles(siteJsDir).filter((f) => f.endsWith('.js'))) {
  const js = fs.readFileSync(f, 'utf8');
  const rel = path.relative(ROOT, f);
  if (/ohe_pathway/.test(js)) fail(`${rel}: contains "ohe_pathway" — this sessionStorage key was removed as dead code (nothing ever read it); do not reintroduce it without a real, HighLevel-supported prefill integration`);
}

// --- Evnex badge file actually exists in the generated deployment ---
if (!fs.existsSync(path.join(SITE_DIR, 'img', 'brand', 'evnex', 'evnex-certified-installer-dark.png'))) {
  fail('site/img/brand/evnex/evnex-certified-installer-dark.png is missing from the generated deployment');
}

// --- Tesla asset files gated to the approved brand-asset folder only ---
// Complements the per-page text check above: a file whose name contains
// "tesla" may only exist under img/brand/tesla/ (the two assets covered by
// Tesla's 25 Sep 2026 written approval) — anywhere else, it must not exist.
function findFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findFiles(p));
    else out.push(p);
  }
  return out;
}
const teslaAssetDir = path.join('img', 'brand', 'tesla') + path.sep;
for (const f of findFiles(SITE_DIR)) {
  const rel = path.relative(SITE_DIR, f);
  if (/tesla/i.test(path.basename(f)) && !rel.startsWith(teslaAssetDir)) {
    fail(`${rel}: Tesla-named asset file must not exist outside img/brand/tesla/ in the generated deployment`);
  }
}

console.log(`Checked ${files.length} built HTML files under ${SITE_DIR} (${IS_PRODUCTION_CHECK ? 'production' : 'preview'} mode).`);
if (failures.length) {
  console.log(`\nSTATIC QA FAILURES (${failures.length}):`);
  failures.forEach((f) => console.log(' -', f));
  process.exitCode = 1;
} else {
  console.log('STATIC QA PASSED.');
}
