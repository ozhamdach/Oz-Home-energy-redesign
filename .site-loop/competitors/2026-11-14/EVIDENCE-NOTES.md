# Evidence pack: how it was collected (facts only)

Collected 14 November 2026 with headless Chromium (Playwright), axe-core
4.10 and Lighthouse 12.6. Nothing was clicked except FAQ items; no form was
filled in or submitted on any site.

## The page under audit: `oz/`

Oz Home Energy home page (Sydney solar, battery and EV installer). The
build audited is the production build with analytics enabled (the
configuration real visitors get), served locally by a static file server.

- `evidence.json`: DOM facts at 375x812 (phone) and 1440x900 (desktop):
  first-screen CTAs, sticky bar, title/description, headings, schema types,
  internal links, images (alt, size attributes, formats), captions, region
  mentions, FAQ questions, dollar/percent claims, embedded frames (Google
  reviews widget, quick quote form), console errors on load and after
  scrolling, failed requests, axe results, first 12 keyboard tab stops,
  link check of every link on the page.
- `page-text.txt`: every word a visitor can read on the page at phone
  width, in page order, plus the FAQ answers, the footer text and every
  link in the main content with its destination.
- `lighthouse-mobile-3-runs.json`: three consecutive Lighthouse mobile runs.
  INP cannot be measured in a lab run; Total Blocking Time and "max
  potential FID" are the lab stand-ins.
- `*-first-screen.png`: what loads first at each width.
- `mobile-375-full-page-4-columns.png` and
  `desktop-1440-full-page-3-columns-half-scale.png`: the whole page, cut
  into columns that read top to bottom, left to right. In a full-page
  capture the fixed bottom bar is drawn once mid-page and third-party
  frames (reviews, form) come out blank; use the `section-*` shots for
  those areas.
- `section-*.png`: the credentials, reviews, recent installs, FAQ and form
  areas scrolled into view.

Facts the screenshots cannot show:

- Form submission (hard gate 1) was NOT tested in this audit, because a
  submission creates a real lead in the owner's CRM. The owner confirmed on
  10 Oct 2026 that the live form submits and shows a confirmation. The
  quick form on this page is a third-party (HighLevel) embed; its fields and
  button label are in `evidence.json` under `frames.quickForm`. The primary
  "Get a Free Quote" buttons go to a separate quote page (`/assessment/`),
  which is not part of this page's evidence.
- `failedRequests` in `evidence.json` are analytics beacons and third-party
  widget calls cut off when the test browser closed, or blocked by the test
  network; none is a first-party file.
- Console messages after scrolling come from Cloudflare's bot check inside
  the third-party form frame (see the `from` field of each message).
- The reviews shown are loaded live from the business's Google reviews via
  an embedded widget (`frames.reviews`).
- The three hero figures and all install photos are stated by the owner to
  be real; the photos are the owner's own job photos.

## Competitors: `competitors/<name>/`

Home pages of five Australian solar installers, captured the same way from
their live sites: `evidence.json`, first-screen shots at both widths,
full-page shots (capped at 12,000 px), and one Lighthouse mobile run each
(`lighthouse-mobile.json`) against the live site. Their numbers include real
network latency, which the local run of the audited page does not; treat
performance comparisons with that in mind. Competitor forms were not tested.

## What is stored in this folder

Only the measured facts for each competitor (`evidence.json`,
`lighthouse-mobile.json`). The screenshots and page-text samples the
auditor looked at are not kept in the repository: they are other
companies' pages. Re-capture them when the benchmark is refreshed.
