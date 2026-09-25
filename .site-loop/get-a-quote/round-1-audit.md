# Get a quote (/assessment/) — Round 1 audit

Audited 24 Sep 2026. Branch `site-loop/get-a-quote` from `main`, carrying
the same sitewide fixes as PRs #30-#32.

## Score: 72 / 100

| Category | Points | Score | Evidence |
|---|---|---|---|
| Conversion | 25 | 20 | **Switched this page to `landingChrome` (minimal header/footer, no primary nav)** — directly satisfies the must-have "no navigation distractions." Real HighLevel form embedded front and centre. **Miss:** still the same single-step form structurally, so the ≤3-step/progress-bar want isn't met. |
| Trust and proof | 20 | 8 | "Licensed & local" sidebar card now states the licence (382607C) and SAA (S5265652) numbers explicitly, not just the claim. This page type doesn't carry photos/reviews by nature, so several sub-criteria don't really apply — scored per the rubric as written regardless. |
| Performance | 15 | 15 | Lighthouse mobile: 98, LCP 1.8s, TBT 0ms, CLS 0. |
| Local SEO | 15 | 10 | H1 → `Sydney Energy Assessment — Let's Understand Your Property First`. No suburb mentions; no FAQ content exists on this page to add schema to. |
| Content and clarity | 10 | 6 | "What happens after you submit" card already existed and answers most of "what happens next." **Miss, needs-Oz:** no stated response time (didn't invent one), and "optional bill upload" can't be confirmed — the form is a cross-origin HighLevel iframe, so whether it already has a bill-upload field isn't visible from this repo. |
| Design and brand | 10 | 8 | Same as other pages. |
| Accessibility | 5 | 5 | axe-core: 0 violations at 375px and 1440px — including on the two other `landingChrome` pages spot-checked after the header change. |

## Hard gates — all 9 pass

Real form (no fake success), Lighthouse 98/LCP 1.8s, 0px overflow, licence + SAA now stated on-page too (not just footer), no rebate/price claim on this page, no fake proof, 0 console errors/broken links, title+meta present, CTA contrast confirmed via axe.

## A real bug found and fixed (sitewide mechanism, not just this page)

`src/partials/header-landing.html` — the shared header used by every `landingChrome` page — hardcoded its CTA button to `href="#bessForm"`, the Home Battery Assessment page's own form ID. That page itself was fine (it really does have `#bessForm`), but **`/commercial-battery-assessment/thanks/`** (the same header, no form on the page at all) had a dead CTA — clicking "Check Site Eligibility" on the thank-you page did nothing.

Fixed properly rather than worked around: `header-landing.html`'s CTA target/label are now `{{LANDING_CTA_HREF}}`/`{{LANDING_CTA_TEXT}}` placeholders, filled per-page from new `meta.landingCtaHref`/`meta.landingCtaText` fields (defaulting to `#main`/`Get Started` if a future page forgets to set them, so nothing can go back to being silently dead). Updated:
- `commercial-battery-assessment/meta.json` — kept its correct `#bessForm` / "Check Site Eligibility" (no behavior change).
- `commercial-battery-assessment-thanks/meta.json` — fixed to `/` / "Back to Home" (was dead).
- `assessment/meta.json` (this page) — set to `#quoteForm` (a new id added to the form's wrapper section) / "Start Assessment".

Verified via axe + the full Playwright suite that all three pages render correctly and the existing `commercial-battery-assessment` test coverage still passes unchanged.

## Still open (needs-Oz)

1. Whether the existing HighLevel form already supports bill upload — can't be confirmed from outside the iframe.
2. A stated response time / SLA (e.g. "we respond within 1 business day") — not invented.
3. The underlying single-step-vs-3-step form structure decision, same as every other page.
4. A real suburb list.

## Score vs. threshold

72/100, all 9 hard gates pass.
