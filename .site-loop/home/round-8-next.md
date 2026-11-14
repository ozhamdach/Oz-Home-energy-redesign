# Home — Round 9 build prompt

Fix the fixable blockers from `round-8-audit.md`, P1s first. Invent no
facts: every sentence added must already be published elsewhere on this
site or be on file from Oz.

## 1. Performance on the tracked build (P1)

Goal: Lighthouse mobile on the production build with analytics on is
clear of the 70 gate with margin, and LCP is under 2.5 s.

- **Fonts.** Stop loading Google Fonts stylesheets (two render-blocking
  third-party requests, est. 880 ms). Self-host the same faces:
  Outfit (400-700), DM Sans (400-600, italic 400) and the "Your" subset of
  DM Serif Display italic. `@font-face` rules go in `site/css/styles.css`
  with relative URLs and `font-display: swap`; preload the faces used on
  the first screen. Files in `site/fonts/`. Check each file still carries
  its copyright and licence metadata (SIL OFL).
  Files: `src/layout.html`, `site/css/styles.css`, `src/pages/home/meta.json`.
- **Tracking.** Start GTM and the Meta Pixel after the page has loaded and
  the browser is idle, instead of during the first render. Keep the
  `dataLayer` and `fbq` queues in place from the start so no event is lost.
  Do not gate tracking on interaction (that is Oz's decision, blocker 7).
  File: `src/partials/analytics-head.html`.

Accept: 3 Lighthouse mobile runs on the production build with analytics;
report all three. No visual change to type.

## 2. Region mentions (P1)

Add one natural line on Home naming the regions served, each linked to its
published page: Sutherland Shire, Hills District, Northern Beaches, Inner
West, St George, North Shore, Penrith, Campbelltown & Macarthur
(`src/data/locations.json`). File: `src/pages/home/content.html`.

## 3. A suburb-tagged real install (P1, part)

"Recent installs" gains the Woolooware system: 13.3 kW solar, FoxESS 9.9 kW
hybrid inverter, 41.9 kWh FoxESS batteries; on 6 Nov 2026 it bought 0 kWh
from the grid. Facts and the owner's OK are on file
(`docs/owner-inputs-required.md`, `site/js/battery-day.js`). Link to the
battery page's day slider. No customer name, no dollar figure.

## 4. Install time and install day (P1)

Add "How long does an installation take?" to Home's FAQ, using the answer
already published on `/faqs/` word for word. Add it to Home's FAQ schema
the same way the other three are generated.

## 5. P2, only if nothing above is open

Credential badges: serve WebP alongside PNG.

## Not for this round (needs Oz)

Prices and payback; suburb and system for the three gallery photos;
HighLevel button label and redirect; whether tracking may wait for first
interaction.
