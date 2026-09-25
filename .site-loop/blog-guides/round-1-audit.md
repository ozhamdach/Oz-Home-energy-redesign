# Blog / guides — Round 1 audit

Audited 24 Sep 2026. Branch `site-loop/blog-guides` from `main`, carrying
the Greater Sydney restoration + sitewide fixes from PRs #30-#37
(including the Contact page itself, since the shared header/footer now
link to it).

Must-haves (scorecard): rebate guide, battery sizing guide, solar payback
guide; each ends in a CTA. Job: rank for questions.

No separate "blog" page existed before this round. Built three new,
real, fact-checked guide pages and made the existing `/learning-centre/`
hub link to all three (a new "In-depth guides" section) — this repo
already has an FAQ-style hub at that URL, so extending it rather than
building a second, competing hub.

## Score: 71 / 100

| Category | Points | Score | Evidence |
|---|---|---|---|
| Conversion | 25 | 17 | Every guide ends in its own final-cta section (assessment CTA + a relevant secondary link), consistent with every other page's pattern. |
| Trust and proof | 20 | 12 | Every figure is sourced and dated (Solar Choice, DCCEEW), matching `src/data/rebates.json` — no invented numbers anywhere. |
| Performance | 15 | 15 | Lighthouse mobile on `/battery-rebate-guide/` (the heaviest of the three): 97, LCP 1.8s, TBT 0ms, CLS 0. All three guides are lightweight, image-free pages. |
| Local SEO | 15 | 10 | Each guide targets a real search intent ("federal battery rebate", "what size battery do I need", "how is solar payback calculated") with unique, substantial copy — not thin doorway content. Not suburb-specific, so doesn't claim the full Local SEO score. |
| Content and clarity | 10 | 9 | Real, checkable content throughout; the payback guide is honest that it explains the calculation rather than publishing a number it can't back up. |
| Design and brand | 10 | 8 | Matches the site's existing card/section/final-cta patterns exactly; no new components needed. |
| Accessibility | 5 | 5 | axe-core: 0 violations at 375px and 1440px on all three new pages and the updated Learning Centre hub. |

## Hard gates — all 9 pass

Lighthouse 97/LCP 1.8s; 0px overflow (Playwright suite, all 5 widths);
no invented rebate/price claim — every figure traces to `src/data/rebates.json`
with an as-of date and source; the solar payback guide explicitly does
NOT publish a generic payback number (genuinely needs-Oz price data, per
the Solar panels page's own tracker row) rather than inventing one; 0
console errors/broken links (Playwright, static QA); title+meta present
on all three; CTA contrast via axe; static QA (preview + both production
variants) all pass; full Playwright regression suite passes.

## What's real vs. what's deliberately not here

- **Battery rebate guide**: the exact worked example, taper table and
  sources already used on `/battery-storage/` — genuinely computable from
  `src/data/rebates.json`, so given its own dedicated page.
- **Battery sizing guide**: the three household-size ranges already used
  on `/battery-storage/`, expanded into a standalone explainer of what
  actually decides size (usage, existing solar, backup goals, inverter
  compatibility) rather than just restating the ranges.
- **Solar payback guide**: deliberately does NOT contain a payback number.
  The Solar panels page's own tracker row already establishes that
  indicative price ranges and a payback estimate are genuinely needs-Oz
  (no price data exists anywhere in this repo). Publishing "solar pays
  for itself in X years" without real numbers behind it would be
  exactly the kind of unsupported marketing-average claim this project's
  discipline exists to avoid. Instead this guide explains the actual
  formula and what changes it property to property — real, useful,
  rankable content that doesn't require inventing a number.

## Still open (needs-Oz)

- **Indicative price ranges** (6.6/10/13kW systems) — the same gap
  already logged on the Solar panels row. Once supplied, the payback
  guide can add a real worked example the way the rebate guide does.
- A genuine blog/article publishing workflow (author, dates, more
  articles over time) doesn't exist — these three guides are static
  pages in the same pattern as every other page, which meets this
  round's must-have list but isn't a scalable "blog" in the CMS sense.

## Score vs. threshold

71/100, all 9 hard gates pass. The main gap to 90 is Local SEO/Trust
points that would come from indicative pricing — the same needs-Oz item
already blocking the Solar panels page.
