# Legacy URL Migration & Redirect Plan

This document is the single explanation of how old ozhomeenergy.com.au URLs
map onto this rebuild, why the production origin decision changed this pass,
and — critically — what is and isn't a *real* redirect at each stage of
deployment. Read this before touching `redirects/` or `scripts/build.js`'s
legacy-route handling.

## 1. Production origin: apex domain, not `www`

**Decision this pass:** every canonical, Open Graph, JSON-LD and sitemap URL
this build emits now uses `https://ozhomeenergy.com.au` (no `www`), not
`https://www.ozhomeenergy.com.au` used previously.

**Why:** the current live production domain's `www` subdomain redirects to
the bare apex domain. Canonicalising this rebuild's pages against a hostname
that itself 301s elsewhere is a real SEO defect — search engines are meant to
follow canonical tags to the *actual* indexed URL, not a redirecting one, and
mismatched canonical/redirect chains waste crawl budget and can confuse which
URL gets indexed. `https://ozhomeenergy.com.au` is the origin that actually
serves the site, so it's the one every URL in this build now points at.

**If this is wrong:** if the `www` → apex redirect is ever reversed, or the
production domain decision changes for any other reason, update
`PRODUCTION_ORIGIN` in `scripts/build.js` (one constant) and the hardcoded
origin in `src/layout.html`'s canonical/OG tags and JSON-LD `url` field —
search the repo for `ozhomeenergy.com.au` to confirm every reference agrees.

## 2. Two entirely different "redirect" mechanisms — do not confuse them

This repo can only ever demonstrate one of these two; the other requires the
real production host and cannot be tested from here.

| | GitHub Pages preview (what's live now) | Real production host (future) |
|---|---|---|
| Mechanism | A built HTML page at the old URL containing `<meta http-equiv="refresh" content="0;url=...">` plus a visible fallback link | A genuine HTTP 301/302 response, configured at the web server/CDN |
| HTTP status a bot/crawler sees | **200 OK** — the page loads normally, then the browser (not every crawler) follows the meta-refresh | **301/302**, exactly as intended |
| Preserves link equity for SEO purposes | Not reliably — meta-refresh is a much weaker signal than a real 3xx and is not guaranteed to be treated as a redirect for ranking purposes | Yes — this is what actually protects existing search rankings |
| Where it's generated | `scripts/build.js`, from `redirects/legacy-routes.json` — runs on every build, preview and production alike | `scripts/build-redirects.js`, from the same source file, into `redirects/_redirects` and `redirects/redirects.json` |
| Why it exists at all | So a legacy URL never hard-404s on the GitHub Pages preview, since GitHub Pages cannot serve server-side redirects under any configuration | This is the actual migration mechanism — required before launch |

**Consequence: the GitHub Pages preview bridge pages are a safety net, not a
substitute for real redirects.** Before this site goes live on
`ozhomeenergy.com.au`, whoever configures the production host must translate
`redirects/_redirects` (or `redirects/redirects.json`) into that host's real
redirect mechanism — see §4.

## 3. Single source of truth

`redirects/legacy-routes.json` is the only place mappings are hand-maintained.
Everything else is generated from it:

- `node scripts/build.js` reads it and builds a noindex bridge page (§2) at
  every `from` route, for both preview and production builds.
- `node scripts/build-redirects.js` reads it and (re)writes
  `redirects/_redirects` and `redirects/redirects.json` — **both are
  generated files; don't hand-edit them**, edit `legacy-routes.json` and
  re-run the script.

Run both after changing `legacy-routes.json`. `scripts/qa-playwright.js`'s
"legacy route coverage" check (see `docs/06-qa-report.md`) fails the build if
a route in `legacy-routes.json` doesn't actually resolve.

## 4. Confirmed mappings

| Old URL | New URL | Status | Notes |
|---|---|---|---|
| `/home` | `/` | 301 | |
| `/solar` | `/residential-solar/` | 301 | |
| `/solar-installation` | `/residential-solar/` | 301 | |
| `/solar--battery-upgrades` | `/solar-battery-upgrades/` | 301 | Old URL has a double hyphen |
| `/solar-panel-cleaning` | `/panel-cleaning/` | 301 | |
| `/solar-panel-bird-proofing` | `/bird-proofing/` | 301 | |
| `/ev-charger-installation` | `/ev-charging/` | 301 | |
| `/battery-storage-installation` | `/battery-storage/` | 301 | |
| `/electrical` | `/residential-electrical/` | 301 | |
| `/commercial-project-enquires` | `/commercial-project-enquiry/` | 301 | Misspelled old URL. A previous pass deliberately left this unmapped pending confirmation that the old page's intent matched the new dedicated enquiry form rather than general commercial electrical enquiries — this pass's brief explicitly confirmed the mapping. Worth a final Search Console / ad-campaign check before go-live regardless. |
| `/about-us` | `/about/` | 301 | |
| `/contact-us` | `/assessment/` | 301 | Contact now routes into the energy assessment flow |
| `/terms-and-conditions` | `/terms/` | 301 | |

Every mapping above is generated for **both** the trailing-slash and
non-trailing-slash form of the old URL (e.g. `/solar` and `/solar/`) — see
`redirects/_redirects`/`redirects/redirects.json` for the literal rule pairs.

## 5. Existing location routes — temporary, not permanent

These nine routes exist on the current live site and must keep resolving,
but this rebuild does not yet have genuine, unique local content for any of
them (see `docs/02-sitemap-and-design-system.md` for why a single
consolidated `/locations/` page was chosen over thin per-suburb pages):

```
/greater-sydney            /canterbury-bankstown       /south-western-sydney
/western-sydney            /inner-west-sydney          /liverpool-and-fairfield
/parramatta-and-auburn     /blacktown-and-penrith      /campbelltown-and-camden
```

Each is mapped to `/locations/` with a **302 (temporary)** status, not 301 —
deliberately, because a 301 tells search engines "this content has
permanently moved here," which would be false: the intent is that each of
these routes eventually gets its own genuinely useful local page again, not
that `/locations/` is its permanent replacement. Do not change any of these
to 301 until real, unique content exists at that specific route — at that
point, delete its entry from `legacy-routes.json` entirely (it becomes a real
page, not a redirect) rather than reclassifying the redirect.

## 6. What's still not covered

This sandbox could not crawl `ozhomeenergy.com.au` directly (see
`docs/01-audit-and-positioning.md`), so `legacy-routes.json` only covers the
routes explicitly named in the working brief plus the nine location routes
above. **Before go-live**, export the full indexed URL list (Google Search
Console → Pages report, plus an independent full crawl) and add a mapping
for every URL not already covered here — a 404 at volume is lost link
equity and a crawl-budget/trust problem, not just a broken link.

## 7. Host-specific deployment guidance

`redirects/_redirects` uses Netlify/Cloudflare Pages `_redirects` syntax as a
readable, host-agnostic starting point. Translate it for whatever the real
production host turns out to be:

- **Netlify / Cloudflare Pages**: `redirects/_redirects` can likely be used
  close to as-is (verify status-code and splat/matching syntax against that
  host's current docs).
- **nginx**: convert each row into `rewrite ^/solar$ /residential-solar/
  permanent;` (301) or `redirect;` (302), or a `map` block for large lists.
- **Apache**: `Redirect 301 /solar /residential-solar/` per row in
  `.htaccess` or the vhost config (`Redirect 302` for the temporary location
  routes).
- **A custom Node/Express or serverless origin**: read
  `redirects/redirects.json` directly and serve a real `res.redirect(status,
  to)` — this is the most direct translation, since the JSON is already
  structured exactly as `{ from, to, status }`.
- **GitHub Pages**: not applicable — see §2. GitHub Pages cannot serve
  server-side redirects under any configuration; if the production site
  stays on GitHub Pages long-term, the meta-refresh bridge pages in §2 are
  the permanent mechanism, not a temporary preview-only stand-in, and that
  tradeoff (weaker SEO signal than a real 301) should be an explicit,
  informed decision rather than a default.

## 8. Automated testing

`scripts/qa-playwright.js` includes a legacy-route coverage check: it reads
`redirects/legacy-routes.json` and, for every route, loads the built bridge
page and asserts it (a) returns 200 (not a hard 404), (b) is marked
`noindex`, and (c) contains a working link to its `to` destination. This
runs in CI on every pull request (`.github/workflows/qa.yml`) — see
`docs/06-qa-report.md` for the full acceptance-test matrix.
