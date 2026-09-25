# Fix: Evnex product photos rendering stretched on /ev-charging/

Reported directly by Oz: "evnex photos look stretched".

## Root cause

`site/css/styles.css`'s global image reset only set `max-width: 100%`,
not `height: auto`:

```css
img { max-width: 100%; display: block; }
```

Per the HTML/CSS spec, an `<img>` with both `width` and `height`
attributes gets those mapped as presentational hints. When only
`max-width` is constrained by author CSS, the browser still honours the
`height` attribute literally rather than scaling it to match the
constrained width — so a 1920×1080 image placed in a 588px-wide column
rendered at 588×1080 (the raw attribute value), stretching the image
content roughly 3× taller than its correct proportions instead of the
correct 588×331.

This only affects bare `<img>` tags that aren't otherwise given an
explicit height (e.g. `.photo-frame img`, which already sets
`height: 100%` with `object-fit: cover` and was unaffected — that's an
intentional crop, not a bug). A sitewide audit (Playwright, checking
every `img[width][height]` on all 51 built pages for a computed
aspect-ratio mismatch where `object-fit` is not `cover`/`contain`) found
exactly two images actually affected:

- `/img/brand/evnex/evnex-e2-core-plus.webp` (EV charging page)
- `/img/brand/evnex/evnex-app-solar-charging.webp` (EV charging page)

Both are the two figure images directly under "Evnex smart chargers, set
up around how you charge" — matching exactly what was reported.

## Fix

```diff
-img { max-width: 100%; display: block; }
+img { max-width: 100%; height: auto; display: block; }
```

One line, sitewide, root cause. Also protects every future bare `<img>`
added anywhere on the site from the same class of bug — nothing else
needed to change since more specific selectors (`.photo-frame img`,
`.trust-card-mark img`, etc.) already override height explicitly and are
unaffected by this change (confirmed via the same sitewide sweep: 0
regressions, identical rendering before/after for every `.photo-frame`-
or `.trust-card-mark`-wrapped image).

## Verification

- Sitewide Playwright sweep across all 51 built pages: 0 remaining
  aspect-ratio distortions after the fix (down from the 2 confirmed
  above; everything else was already a correct `object-fit: cover` crop).
- Static QA: preview + both production variants (with/without analytics)
  — all PASSED.
- Full `scripts/qa-playwright.js` regression suite — PASSED.
- axe-core on `/ev-charging/`, `/`, `/battery-storage/`, `/projects/`,
  `/about/` at 375px and 1440px — only the two known, pre-existing,
  already-fixed-on-other-open-PRs issues remain (page-banner eyebrow
  contrast — fixed on `site-loop/home-batteries`; footer heading order —
  fixed on `site-loop/contact`), neither touched or introduced by this
  change.
- Screenshots: `evnex-section-desktop-1440.png`,
  `evnex-section-mobile-375.png` — both show the two Evnex images at
  their correct, undistorted aspect ratio.
