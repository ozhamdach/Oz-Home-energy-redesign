# Home — Round 1 audit

Audited 24 Sep 2026 against the "Oz Home Energy — Top 1% Solar Website
Scorecard" (https://claude.ai/code/artifact/79d93774-b775-4267-986d-dade5b75f999).

Build state at audit time: `site-loop/home` branch (base `main` @
`b3c936e0bab2eb28f64202ae6bced6e5eb867669`), rebuilt and QA'd after Round 1's
build/fix step (see "Changes this round" below).

## Score: 64 / 100

| Category | Points | Score | Evidence |
|---|---|---|---|
| Conversion | 25 | 18 | Primary "Start Your Free Energy Assessment" CTA above the fold on mobile and desktop (hero); sticky mobile call/quote bar now present (`src/layout.html`); click-to-call in hero and sticky bar. **Miss:** `/assessment/` is a single HighLevel iframe (form id `7CTbeFedTXyoPJoS2CmH`), not a native ≤3-step form with a visible progress bar — the rubric's Conversion criterion names this explicitly. |
| Trust and proof | 20 | 5 | NSW licence 382607C, SAA S5265652 and 15-Year Workmanship Warranty now stated plainly in the trust grid + warranty strip (fixed this round). **Miss:** no live Google rating/review count strip (only a genuine but non-numeric HighLevel review widget); "Recent installs" photos (added this round) are real but carry no suburb or system-size labels; no named panel/inverter brands anywhere on the page (only EV/battery brands: FoxESS, Sungrow, Sigenergy, GoodWe, Ohme, Evnex); no director photo or founder story. |
| Performance | 15 | 15 | Lighthouse mobile (simulated throttling, 375×667@2x): Performance 95/100, LCP 2.6s, CLS 0, TBT 0ms, FCP 1.5s. Clears the 90+/2.5s-ish bar with margin. AVIF/WebP images with explicit `width`/`height` throughout; no render-blocking third-party scripts in preview (analytics gated to production). |
| Local SEO | 15 | 9 | Unique title/description (`Solar, Battery & EV Charging Sydney \| Oz Home Energy`); LocalBusiness/Electrician schema now carries licence + SAA `identifier` fields and `areaServed: Sydney`; FAQPage schema added this round for the on-page FAQ block (`src/pages/home/schema-faq.html`); 6+ internal links (pathway cards, split panels, FAQ, recent-installs). H1 changed this round to `Sydney Solar, Battery Storage & EV Charging, Done Right.` to carry service + Sydney, per the rubric's literal wording. **Miss:** no suburb/region mentions beyond generic "Sydney" (service area is Sydney-only with no suburb list per `docs/owner-inputs-required.md`). |
| Content and clarity | 10 | 5 | Plain-English, short-paragraph copy throughout; no filler. **Miss:** no cost ranges, payback estimate or rebate content anywhere on the page — the shared rebate/STC/price data file the scorecard's Page 0 calls for doesn't exist yet in this repo, and no price content is published sitewide. |
| Design and brand | 10 | 8 | Consistent design-system tokens (colour/type/spacing) from the existing system; clean hierarchy; generous whitespace; the 24 Sep premium credential-grid redesign (PR #28) reads as a deliberate, custom system rather than a template. Not scored at 100%: the scorecard's competitor benchmark (page 0) hasn't been run yet, so "beats the top Sydney competitors" can't be confirmed against real comparators — scored on internal quality only. |
| Accessibility | 5 | 5 | axe-core (`@axe-core/playwright`, tags `wcag2a`/`wcag2aa`/`wcag22aa`) — **0 violations** at both 375px and 1440px, including `color-contrast`. |

## Hard gates

| Gate | Result |
|---|---|
| Quote/contact form submits with confirmation | **Pass** — real HighLevel iframe embeds throughout (no `action="#"`, no fake success state; existing permanent QA gate). |
| Mobile Lighthouse Performance ≥70, LCP ≤4s | **Pass** — 95/100, LCP 2.6s. |
| No sideways scroll at 375px | **Pass** — 0px horizontal overflow confirmed. |
| NSW licence number in footer | **Pass** — 382607C now shown (owner-confirmed this round via `AskUserQuestion`; see `docs/owner-inputs-required.md`). |
| Accreditation is SAA, not CEC | **Pass** — already correct sitewide. |
| Rebate/price/savings claim has as-of date + source | **Pass** (vacuously) — no rebate/price/savings claim appears anywhere on this page. |
| No fake/unattributed testimonials or stock-as-real | **Pass** — review widget is a genuine HighLevel embed; "Recent installs" photos are real, previously-verified installation photography, honestly captioned. |
| No broken links, console errors, or missing title/meta | **Pass** — full Playwright suite green (0 console errors, 0 broken links); title/description present in `meta.json`. |
| CTA text contrast ≥4.5:1 | **Pass** — confirmed via axe `color-contrast` (0 violations, both viewports). |

**All 9 hard gates pass.** The page does not fail outright; it scores 64 because several Trust/Content sub-criteria need content only Oz can supply.

## Changes this round

- Restored NSW licence (382607C) and SAA (S5265652) numbers to the footer, `Electrician` schema (`hasCredential[].identifier`), and homepage trust-card meta lines, on owner confirmation.
- Added a sitewide sticky mobile call/quote bar (`src/layout.html`, new CSS in `site/css/styles.css`).
- Replaced the "Featured project & reviews — intentionally omitted" placeholder comment with a real "Recent installs" section: 3 genuine, previously-verified photos with honest (unlabelled-by-suburb) captions, plus a factual "brands we install" line.
- Rewrote the H1 to `Sydney Solar, Battery Storage & EV Charging, Done Right.` (was `Lower Energy Bills Start Here.`) to satisfy the Local SEO must-have literally (H1 = service + Sydney).
- Added `FAQPage` JSON-LD for the homepage's on-page FAQ block (`src/pages/home/schema-faq.html`, wired via `meta.json`'s `extraSchemaFile`).
- Fixed a QA-script timing bug found during this round's audit: `scripts/qa-playwright.js`'s trust-grid test asserted `naturalWidth`/`naturalHeight` on the (deliberately `loading="lazy"`) Evnex badge right after the `load` event; at 390px width the trust section now sits far enough down the page (2380px) that Chromium hadn't started prefetching it yet, so the assertion failed intermittently depending on how far below the fold prior content pushed it. Fixed by scrolling the badge into view and waiting for `img.complete` before asserting — matches how a real visitor actually encounters it. Not a content regression: the badge itself loads correctly once in view (verified manually before changing the test).

## Evidence

- Screenshots: `.site-loop/home/round1-mobile-375.png`, `.site-loop/home/round1-desktop-1440.png` (full page, both taken after forcing all `loading="lazy"` images to resolve).
- Lighthouse JSON: performance 0.95, LCP 2.6s, CLS 0, TBT 0ms, FCP 1.5s, SI 3.9s (mobile preset, simulated throttling).
- axe-core: 0 violations at 375px and 1440px (`wcag2a`, `wcag2aa`, `wcag22aa`).
- `node scripts/qa-static-checks.js` (preview) — PASSED.
- `SITE_OUT_DIR=site-prod-check BUILD_TARGET=production node scripts/build.js && node scripts/qa-static-checks.js --production` — PASSED.
- Full `scripts/qa-playwright.js` suite — PASSED (0 console errors, 0 horizontal overflow, all interactions work).
- `git diff origin/main --check` — clean, no whitespace issues.

## Score vs. threshold

64/100, all hard gates pass. Below the 90 threshold — continuing to Round 2.
