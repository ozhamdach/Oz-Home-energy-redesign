# Solar panels (/residential-solar/) — Round 1 audit

Audited 24 Sep 2026 against the scorecard. Branch `site-loop/solar-panels`
from `main`, with the same sitewide carry-ins as Home batteries (sticky
CTA bar, licence/SAA, Greater Sydney, the two CSS bugs fixed there) —
see PR #30 for the detail; not re-explained per page from here on.

## Score: 70 / 100

| Category | Points | Score | Evidence |
|---|---|---|---|
| Conversion | 25 | 18 | Same as other pages — CTA + sticky bar present; `/assessment/` single-step gap unchanged. |
| Trust and proof | 20 | 6 | Panel (Jinko Solar, JA Solar, Trina Solar) and inverter (FoxESS, Sungrow, Sigenergy, GoodWe) brands now compared. Licence/SAA/warranty only in footer, not restated on-page. **Miss:** photos lack suburb names; no live rating; no director link. |
| Performance | 15 | 15 | Lighthouse mobile: 97, LCP 1.9s, TBT 0ms, CLS 0. |
| Local SEO | 15 | 12 | H1 → `Sydney Solar Panel Installation — Sized to Your Roof`; FAQPage schema added for all 5 FAQs; `areaServed` includes Greater Sydney. **Miss:** no suburb mentions. |
| Content and clarity | 10 | 6 | STC rebate explained with real Zone 3 data, sourced and dated; three system sizes (6.6/10/13 kW) described by who they suit; two new roof/shading FAQs. **Miss, genuinely needs-Oz:** no indicative $ price ranges and no payback estimate — the scorecard's own content pack lists pricing as "none on site," and a payback figure needs a real installed price to compute. Did not invent either. |
| Design and brand | 10 | 8 | Same as other pages — competitor benchmark (Page 0) not run yet. |
| Accessibility | 5 | 5 | axe-core: 0 violations at 375px and 1440px. |

## Hard gates — all 9 pass

Same pattern as Home batteries: real CTAs (no fake success), Lighthouse 97/LCP 1.9s, 0px overflow, licence 382607C in footer, SAA correct, the STC rebate note carries an as-of date + source + "indicative only, confirmed as part of your quote" caveat, genuine photos, 0 console errors/broken links, title+meta present, CTA contrast confirmed via axe.

## Why price ranges and a payback estimate are still missing

The scorecard's own Page 0 content-pack checklist already logs "indicative price ranges for common solar sizes, batteries and EV chargers" as **"none on site."** A payback estimate is derived from (installed price − STC rebate) ÷ annual savings — without a real installed price, any number here would be invented, which this project has consistently avoided. The STC rebate side of that formula is now real and sourced; the price side needs Oz.

## Still open (needs-Oz)

1. Indicative price ranges for 6.6/10/13 kW systems.
2. A payback estimate (blocked on #1).
3. Suburb + system-size labels for the recent-work photos.
4. A director photo/story link.
5. Same `/assessment/` form-structure decision as other pages.
6. A real suburb list.

## Score vs. threshold

70/100, all 9 hard gates pass. The two biggest remaining gaps (price ranges, payback) are the same genuine content-pack gap the scorecard itself already flagged before this round started — not something further implementation work can close.
