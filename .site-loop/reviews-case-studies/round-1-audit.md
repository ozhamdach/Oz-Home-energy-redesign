# Reviews / case studies (/projects/) — Round 1 audit

Audited 24 Sep 2026. Branch `site-loop/reviews-case-studies` from `main`,
carrying the same sitewide fixes as PRs #30-#33.

**This page is structurally blocked, independent of its rubric score.**
`src/data/site-status.json`'s `projects` gate requires "at least three
owner-approved, real completed-project case studies" before the page is
indexed or linked from navigation/sitemap in production
(`currentCount: 0`). That gate is correct and untouched this round — no
case study was invented to get around it. Everything below is Oz-
independent polish on a page that stays hidden until real case studies
exist, not progress toward removing the gate itself.

## Score: 68 / 100

| Category | Points | Score | Evidence |
|---|---|---|---|
| Conversion | 25 | 18 | Final CTA + sticky bar present. No dedicated form on this page (links to `/assessment/`), same structural gap as elsewhere. |
| Trust and proof | 20 | 6 | This category is the page's whole job, and it's the most content-blocked page in the tracker. Genuine recent-work and in-progress photography (already present, plentiful). **Added this round:** the same real HighLevel review widget used on Home — genuine reviews shown even though the case studies above remain unavailable; no rating number or case study was invented to compensate. **Miss (the real gap):** 0 of the required 3+ case studies with system/suburb/cost/savings. |
| Performance | 15 | 15 | Lighthouse mobile: 97, LCP 1.8s, TBT 0ms, CLS 0. |
| Local SEO | 15 | 10 | H1 → `Sydney Solar & Battery Projects — Real Installations, Real Reviews`. Technical quality is fine; the page's actual search visibility is controlled by the publish gate above, not by on-page SEO. |
| Content and clarity | 10 | 6 | The page is honest and clear about *why* nothing is published yet, and what a real case study will include when one exists — arguably better than silence, but doesn't answer the rubric's buyer-question criteria the way a service page would. |
| Design and brand | 10 | 8 | Same as other pages. |
| Accessibility | 5 | 5 | axe-core: 0 violations at 375px and 1440px. |

## Hard gates — all 9 pass

No fake testimonials or case studies (the one gate this page is most directly about) — confirmed still true; genuine photography; Lighthouse 97/LCP 1.8s; 0px overflow; licence/SAA correct sitewide; no rebate/price claim on this page; 0 console errors/broken links; title+meta present; CTA contrast via axe.

## Still open (needs-Oz) — and this is the blocking one

1. **At least 3 real, customer-approved case studies** (system, suburb, cost range, savings) — this is the actual gate. Nothing else in this round can substitute for it.
2. A live numeric Google rating strip — same standing decision as Home (6 reviews, not headlined as a bare number; the genuine review widget carries the proof instead).

## Score vs. threshold

68/100, all 9 hard gates pass, but the page stays out of production nav/sitemap regardless of this score until the case-study gate is met — that's the one item that actually matters for this page.
