# Home batteries (/battery-storage/) — Round 1 audit

Audited 24 Sep 2026 against the "Oz Home Energy — Top 1% Solar Website
Scorecard". Branch `site-loop/home-batteries` from `main`, with the
sitewide fixes from the (still-open) Home PR #29 carried in too — sticky
mobile CTA bar, licence/SAA numbers, Greater Sydney boundary, and the
`page-banner .eyebrow` contrast fix found during this round's audit —
since those affect every page's Conversion/Trust/Local SEO score and
duplicating that work across every page branch would be wasteful. See
"Sitewide fixes carried in" below.

## Score: 73 / 100

| Category | Points | Score | Evidence |
|---|---|---|---|
| Conversion | 25 | 18 | Primary CTA above the fold (hero "Start Your Free Energy Assessment"), sticky mobile call/quote bar, click-to-call. **Miss:** same as Home — `/assessment/` is a single-step HighLevel embed, not a visible ≤3-step form. |
| Trust and proof | 20 | 6 | Battery/inverter brands (FoxESS, Sungrow, Sigenergy, GoodWe) now explicitly compared. Licence/SAA/warranty are stated sitewide (footer) but not restated on this specific page. **Miss:** recent-work photos have no suburb names; no live rating; no director photo/story link. |
| Performance | 15 | 15 | Lighthouse mobile: Performance 97, LCP 1.9s, TBT 0ms, CLS 0. |
| Local SEO | 15 | 12 | H1 rewritten to `Sydney Home Battery Storage — Use More of Your Solar` (service + Sydney); FAQPage JSON-LD added for the page's 3 FAQs; unique title/description; schema `areaServed` now includes Greater Sydney. **Miss:** no suburb/region mentions beyond "Sydney." |
| Content and clarity | 10 | 9 | This round added a sourced, dated federal battery rebate worked example, a sizing guide by household type, and an explicit backup-vs-savings explainer — directly answers the rubric's "cost ranges, payback, rebates" ask, unlike Home. |
| Design and brand | 10 | 8 | Consistent with the established design system. Competitor benchmark (Page 0) still not run, so "beats competitors" can't be confirmed — same caveat as Home. |
| Accessibility | 5 | 5 | axe-core: 0 violations at 375px and 1440px, `wcag2a`/`wcag2aa`/`wcag22aa`. |

## Hard gates — all 9 pass

Quote CTA links through honestly (no fake success); Lighthouse 97/LCP 1.9s; 0px horizontal overflow at 375px (full Playwright suite); NSW licence 382607C in footer; SAA (not CEC); the rebate claim carries an "as of 24 Sep 2026" date, a source link (Solar Choice), and an explicit "indicative only, confirmed as part of your quote" caveat; photos are genuine, no fake testimonials; 0 broken links/console errors, title+meta present; CTA contrast confirmed via axe (0 violations).

## Sitewide fixes carried in this round

- **Sticky mobile call/quote bar** + licence/SAA numbers + Greater Sydney boundary: cherry-picked from the still-open Home PR #29 (`src/layout.html`, `src/partials/footer.html`, `scripts/qa-static-checks.js`) rather than re-doing the same work. Once #29 merges, this becomes a no-op on future page branches.
- **New bug found and fixed:** `.page-banner .eyebrow` (the small label above every inner page's H1) used the default link-blue color on the page banner's dark background — 2.85:1 contrast, well under the 4.5:1 requirement. This is a **pre-existing, sitewide bug**, not something introduced this round — every inner page using `.page-banner` (About, Locations, FAQs, every service page) had this violation. Fixed in `site/css/styles.css` with a `.page-banner .eyebrow` override matching the existing `.section-inverse .eyebrow` color, which sits on the same background. Spot-verified 0 violations on About, Locations, FAQs and Residential Solar after the fix, not just this page.
- **Second bug found and fixed:** the sticky mobile CTA bar's CSS wasn't present on this branch (it was only cherry-picked from `layout.html`'s markup, not `styles.css`'s rule for it) — without it, the "Get My Free Quote" button rendered at ~17px tall instead of the intended 44px, failing axe's `target-size` (WCAG 2.2 AA 2.5.8). Fixed by adding the missing CSS block.

## Battery rebate figures — sourcing note

Could not fetch either the government DCCEEW page or the Solar Choice page directly (network egress blocked in this environment) — figures are from search-engine-indexed summaries of those pages, cross-checked against the scorecard doc's own already-cited "next step-down 1 Jan 2027" fact (consistent). Recorded in the new shared data file `src/data/rebates.json` (as the scorecard's Page 0 requires — "one shared data file for rebates, STC factor and prices, each with as-of date and source") with an explicit as-of date, source links, and a caveat that the figure is indicative and confirmed as part of a real quote. This file should become the single source other pages (Solar panels' STC note, Get a quote) draw from too.

## Still open (needs-Oz)

1. Suburb + system-size labels for the recent-work photos (same content-pack gap as Home).
2. A director photo/story link on this page (About/Home have it; this page doesn't link to it yet).
3. A live Google rating strip (same Home decision applies — 6 reviews, deliberately not headlined).
4. A real suburb list, for natural local-SEO mentions.
5. Same `/assessment/` form-structure decision as Home.

## Score vs. threshold

73/100, all 9 hard gates pass. Below 90 — remaining gap is concentrated in Trust (suburb labels, director link) and the sitewide form-structure decision, both already-known, already-logged needs-Oz items rather than new blockers.
