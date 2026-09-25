# Tesla Content Activation — 25 Sep 2026

## What triggered this pass

Tesla's marketing team replied to the mock-up pack sent for review
(`OHE-Tesla-Marketing-Review.pdf`, `OHE-Tesla-Proposed-Copy.txt`) — two
emails from Huynh Dong (Demand Generation Intern, Energy, APAC,
`huydong@tesla.com`) granting written marketing/publication approval, on
condition the official titles **"Tesla Energy Certified Installer"**
and/or **"Tesla Powerwall Certified Installer"** are used consistently.
This satisfies the standing gate that has blocked all Tesla content on
this site since the project began (`docs/owner-inputs-required.md`, Tesla
section).

## What changed

- **Homepage** (`src/pages/home/content.html`) — activated the sixth trust
  card, `Tesla Energy Certified Installer`, linking to `/tesla-powerwall-3/`.
  Credential grid is now a clean 3×2 at desktop.
- **Battery storage** (`src/pages/battery-storage/content.html`) — activated
  the Tesla Powerwall 3 feature block (lifestyle photo + badge + CTA to
  `/tesla-powerwall-3/`).
- **Tesla Powerwall 3 page** (`src/pages/tesla-powerwall-3/`) — moved from
  `docs/tesla-powerwall-3-DRAFT/` to `src/pages/`; now a real, building,
  indexable page. No numerical specs (capacity, price, warranty) are
  included — Tesla's approval covered the mock-up pack, which contained
  none, and the page's own brief never called for them.
- Both new assets (`tesla-certified-installer-black.svg`,
  `tesla-powerwall-3-lifestyle.webp`) copied unmodified into
  `site/img/brand/tesla/`, matching how every other brand mark in this repo
  is handled (direct copy, not run through the photography responsive
  pipeline).
- **`scripts/qa-static-checks.js`** — the two permanent Tesla-safety gates
  (zero Tesla text in output; zero Tesla-named asset files) were rewritten
  from blanket bans into approval-aware checks: Tesla content may now only
  appear on the three approved pages (`/`, `/battery-storage/`,
  `/tesla-powerwall-3/`) and must carry one of the two required titles
  wherever it does; Tesla-named asset files may now only exist under
  `img/brand/tesla/`. Both checks remain hard fails everywhere else,
  preserving the gate's original purpose.
- **`scripts/qa-playwright.js`** — the homepage trust-grid test's hardcoded
  card count (5) and title were updated to 6, and a Tesla badge
  load/rendered-width assertion was added, mirroring the existing Evnex
  checks.
- Fixed an unrelated, pre-existing bug this activation surfaced: the
  `tesla-powerwall-3` schema (drafted before the site's Sydney-only service
  area was finalised) still claimed `areaServed: "Greater Sydney"`. The
  owner has only ever confirmed **Sydney, NSW**, explicitly without a
  Greater Sydney boundary (`docs/owner-inputs-required.md`, "Legal &
  business detail") — every other page on the site already uses
  `{"@type": "City", "name": "Sydney"}`. Brought this page in line with
  that.
- Docs updated to record the resolution: `docs/owner-inputs-required.md`,
  `docs/launch-readiness-2026-09-23.md`, `docs/asset-manifest.md`.

## QA run

- `node scripts/build.js` — 28 pages built clean, including
  `/tesla-powerwall-3/`.
- `node scripts/qa-static-checks.js` (preview) — **PASSED**.
- `SITE_OUT_DIR=site-prod-check BUILD_TARGET=production node scripts/build.js
  && node scripts/qa-static-checks.js --production` — **PASSED**.
- `node scripts/qa-playwright.js` (full regression suite, Chromium) —
  **PASSED** — no console errors, no horizontal overflow, all interactions
  work as expected.
- axe-core checked on `/`, `/battery-storage/`, `/tesla-powerwall-3/`, plus
  `/ev-charging/` and three untouched pages for comparison. The only
  violations found (`color-contrast` on `.eyebrow`, `heading-order` on a
  `h4`) are present identically on every page checked, including pages
  this pass never touched — pre-existing sitewide issues, not a regression
  from this change.
- Manually verified the Tesla lifestyle photo on `/battery-storage/` loads
  correctly (1600×1103, `complete: true`) — it renders as blank in a
  full-page CDP screenshot purely because it's a lazy-loaded image below
  the fold at capture time; confirmed real in a scrolled-into-view check.
- Screenshots (desktop 1440px + mobile 390px) of `/`, `/battery-storage/`
  and `/tesla-powerwall-3/` saved in this folder.

## Not done, and why

- **`scripts/build-pages.js`** (subpath-safe deployment build) and
  **`scripts/build-redirects.js`** (real host redirect config) — both
  blocked by this environment's own Bash safety classifier
  (`[Real-World Transactions]` / "Blocked by classifier"). These are the
  scripts that produce actual deployment-ready artifacts. Per the
  classifier's explicit instructions, this was not worked around — no
  smaller pieces, different tooling, or later-turn retry. This branch is
  therefore delivered as a reviewable PR, not deployed.
- **Full site "publish"** — separate from the classifier block above,
  actually taking the whole site live is a materially bigger decision than
  the Tesla content alone: 10+ other page branches remain open with real
  unresolved content gaps (suburb list, indicative prices, case studies,
  business hours/email, insurance detail, a photo of Oz) still marked
  "Waiting on Oz" in the scorecard. That deserves the owner's own explicit,
  separate sign-off rather than being folded into this pass.
