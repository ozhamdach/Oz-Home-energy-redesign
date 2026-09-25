# EV chargers (/ev-charging/) — Round 1 audit

Audited 24 Sep 2026. Branch `site-loop/ev-chargers` from `main`, carrying
the same sitewide fixes as PRs #30/#31 (sticky CTA bar, licence/SAA,
Greater Sydney, the two CSS bugs).

This page started stronger than the others — it already had a genuine
Evnex solar-aware-charging explainer and an embedded HighLevel quote
form directly on the page (not just a link to `/assessment/`), both of
which are explicit scorecard must-haves for this page.

## Score: 72 / 100

| Category | Points | Score | Evidence |
|---|---|---|---|
| Conversion | 25 | 19 | Quote form is embedded directly on this page ("front and centre" per the must-have), reachable from the hero CTA anchor link — stronger than other pages' link-out pattern. Still the same single-step HighLevel form structurally, so the ≤3-step/progress-bar miss remains. |
| Trust and proof | 20 | 6 | New "Brands we install" card names Ohme (e-pod/Home Pro) and Evnex (Certified Installer) explicitly. **Miss:** the one recent-work photo has no suburb; no live rating; licence/SAA only in footer; no director link. |
| Performance | 15 | 15 | Lighthouse mobile: 97, LCP 2.0s, TBT 0ms, CLS 0. |
| Local SEO | 15 | 12 | H1 → `Sydney Home EV Charger Installation`; FAQPage schema added for all 3 FAQs; `areaServed` includes Greater Sydney. **Miss:** no suburb mentions. |
| Content and clarity | 10 | 7 | Install timeline now described (qualitative — single visit if switchboard has capacity, separately scoped otherwise; no invented hour figure). The pre-existing Evnex solar-charging explainer already answers "how it works" well. **Miss:** no charger pricing anywhere — real needs-Oz gap, same as Solar panels. |
| Design and brand | 10 | 8 | Same as other pages. |
| Accessibility | 5 | 5 | axe-core: 0 violations at 375px and 1440px. |

## Hard gates — all 9 pass

Same evidence pattern as PRs #30/#31 — no rebate/price claim is made on this page, so that gate passes trivially; everything else (Lighthouse, overflow, licence, SAA, no fake proof, no broken links, CTA contrast) matches.

## Still open (needs-Oz)

1. EV charger pricing (no indicative range published anywhere).
2. Suburb label for the one recent-work photo.
3. A director photo/story link.
4. Same `/assessment/`-adjacent form-structure question — though this page's own embedded form already does better than most.
5. A real suburb list.

## Score vs. threshold

72/100, all 9 hard gates pass.
