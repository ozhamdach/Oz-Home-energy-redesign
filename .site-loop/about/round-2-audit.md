# About (/about/) — Round 2 audit

Audited 8 Oct 2026. Branch `site-loop/about-round2` from `main`. Round 1
(72/100, see `round-1-audit.md`) had no logged P0s — just three needs-Oz
gaps (insurance detail, a photo of Oz, the shared assessment-form
question). This round closes the two Trust/Local SEO sub-criteria that
were fixable without inventing anything.

## What changed this round

- **"Brands we install" line** added to the Licensing & compliance
  section — reuses, verbatim, the exact owner-confirmed sentence already
  published on the homepage (24 Sep 2026, site-loop Home round 2),
  including its deliberate Tesla omission (consent still pending under
  the installer agreement). This was a flat gap before: the Trust rubric
  asks for "named brands installed" and About had none.
- **New FAQ section** ("Common questions about working with us", 3
  questions) + `src/pages/about/schema-faq.html` wired via `meta.json`'s
  `extraSchemaFile`. Distinct from the sitewide `/faqs/` page's process
  questions — these tie directly to content already on this page
  (electrician-led approach, the warranty section, the new brands line).
  Every answer reuses an already-published fact; no new claim.
- **Icons** added to the "Licensed NSW Electrical Contractor" and
  "10-Year Workmanship Warranty" headings, matching the style already
  shipped on the Contact page's round 2.
- No change to the founder-story section, the hero, or any CTA/form —
  the director-photo gap and the shared assessment-flow question are
  unchanged needs-Oz/cross-page items, out of scope for a single-page
  round.

## Score: 82 / 100 (was 72)

| Category | Points | Score | Evidence |
|---|---|---|---|
| Conversion | 25 | 18 | Unchanged — CTA + sticky bar present; same structural `/assessment/` form question shared across every page, not this page's alone to resolve. |
| Trust and proof | 20 | 14 | Licence 382607C + SAA S5265652 stated on-page (unchanged); warranty terms stated plainly (unchanged); **new**: named brands installed, previously blank. Still open: no director photo (About's founder-story section stays text-only rather than using a stock image — see the existing `TODO-OZ` comment), no live Google rating (on hold, owner decision), no suburb-tagged install photos (not this page's job — that's Projects'). |
| Performance | 15 | 15 | Lighthouse mobile 97, LCP 2.1s, TBT 0ms, CLS 0 (re-measured; comfortably under the 4s hard-gate threshold). |
| Local SEO | 15 | 13 | Unique title/meta, H1 with service + Sydney, Electrician schema with licence/area all unchanged; **new** FAQPage schema now that FAQs exist on this page. Still missing suburb-level specificity beyond "Sydney and Greater Sydney" (needs a real suburb list, shared gap with Service areas/Contact). |
| Content and clarity | 10 | 8 | New FAQ directly answers three real "why Oz Home Energy" questions in plain English, grounded in content already on the page. Buyer cost/payback questions deliberately stay off this page — that's homepage/service-page territory, not About's job (per round 1's own framing). |
| Design and brand | 10 | 9 | New icons on two section headings lift hierarchy; otherwise unchanged brand tokens/spacing. |
| Accessibility | 5 | 5 | axe-core: 0 violations at 375px and 1440px (re-verified this round). |

## Hard gates — all 9 pass

1. Form submit/confirmation — About has no embedded form itself (CTA
   links to `/assessment/` and `tel:`); unaffected by this round.
2. Lighthouse mobile Performance 97 (≥70), LCP 2.1s (<4s) — pass.
3. No sideways scroll at 375px — Playwright suite, 0 horizontal
   overflow — pass.
4. Licence number present in footer — pass (unchanged).
5. Accreditation correctly stated as SAA, not CEC — pass (unchanged,
   reinforced in the licensing section).
6. No rebate/price/savings claim on this page — N/A/pass.
7. No fake testimonials or stock photos presented as real — pass (team
   and fleet photos are genuine, unchanged; founder section stays
   text-only rather than using a placeholder image).
8. No broken links, 0 real console errors (the only console entries are
   the sandbox proxy blocking Google Fonts — `ERR_CERT_AUTHORITY_INVALID`
   — not a site bug), title + meta description present — pass.
9. Text contrast ≥4.5:1 on every CTA — axe-core confirms, 0 violations —
   pass.

## Verification run this round

- `node scripts/build.js` (preview) + `node scripts/qa-static-checks.js`
  — PASSED, 58 files.
- `SITE_OUT_DIR=site-prod-check BUILD_TARGET=production node
  scripts/build.js` + `node scripts/qa-static-checks.js --production` —
  PASSED, 58 files.
- All 3 JSON-LD blocks on `/about/` (Electrician, BreadcrumbList,
  FAQPage) parse cleanly.
- `QA_BASE_URL=... node scripts/qa-playwright.js` (full sitewide
  regression) — PASSED, no console errors, no horizontal overflow.
- axe-core on `/about/` at 375px and 1440px — 0 violations both.
- Lighthouse mobile on `/about/` — Performance 97, Accessibility 100,
  Best Practices 96, SEO 69 (sole deduction is the preview build's
  intentional `noindex`, same pattern as every other page's preview
  audit).
- Screenshots: `round2-desktop-1440.png`, `round2-mobile-375.png`.

## Still open (needs-Oz) — unchanged from round 1

- **A photo of Oz** specifically, for the founder-story section (the
  existing team photo is genuine but shows installers, not the
  founder).
- **Insurance detail** (type/amount, or confirmation it can be stated) —
  not mentioned anywhere currently, and not invented.
- A real suburb list (shared gap with Service areas/Contact) would let
  this page's service-area mention and FAQ answers name actual suburbs.
- The shared `/assessment/`-adjacent form-structure question that
  applies sitewide, not specific to this page.

## Score vs. threshold

82/100, all 9 hard gates pass. The 18 remaining points are concentrated
in Trust and proof (director photo, Google rating — both needs-Oz or on
hold) and the shared Conversion/form-structure item that spans every
page. Nothing further is buildable here without inventing a founder
photo, insurance detail, or a review count — paused for Oz again, now
10 points higher than round 1.
