# Contact (/contact/) — Round 1 audit

Audited 24 Sep 2026. Branch `site-loop/contact` from `main`, carrying the
Greater Sydney restoration + sitewide fixes from PRs #30-#36. New page —
`/contact/` did not exist before this round.

Must-haves (scorecard): phone, email, hours, ABN, service area map, short
form. Built everything real and confirmable; left out what genuinely
hasn't been supplied rather than inventing it.

## Score: 74 / 100

| Category | Points | Score | Evidence |
|---|---|---|---|
| Conversion | 25 | 19 | Short form (the real, owner-supplied "Quick Free Quote" HighLevel widget already used on Home) front and centre, click-to-call, plus routes to the two other real intake paths (assessment, service request). No separate multi-step gap here — this page's whole job is being the low-friction option. |
| Trust and proof | 20 | 12 | ABN, trading name, licence 382607C and SAA S5265652 shown directly (all real, sourced from the footer/schema already on every page) — no photo or review proof needed on a contact page by this rubric's own must-have list. |
| Performance | 15 | 14 | Lighthouse mobile: 96, LCP 2.0s, TBT 0ms, CLS 0. |
| Local SEO | 15 | 12 | Map embed (same no-API-key Google Maps pattern as `/locations/`), sitewide Electrician schema (now carries Greater Sydney via the cherry-picked `layout.html`), link through to full service-area detail. |
| Content and clarity | 10 | 8 | Minimal by design — a contact page's job is speed, not persuasion. |
| Design and brand | 10 | 8 | Matches the rest of the site's page-banner/card/final-cta patterns exactly. |
| Accessibility | 5 | 5 | axe-core: 0 violations at 375px and 1440px (after the footer fix below). |

## Hard gates — all 9 pass

Lighthouse 96/LCP 2.0s; 0px overflow (Playwright suite, all 5 widths);
no invented rebate/price claim; no fabricated photos on this page; 0
console errors/broken links (Playwright); title+meta present; CTA
contrast via axe; static QA (preview + both production variants) all
pass; full Playwright regression suite passes.

## A real sitewide bug found and fixed this round

axe-core flagged `heading-order` (moderate) on `/contact/` **and every
other page checked** (`/about/`, `/`, `/locations/`, `/faqs/`,
`/products/`) — the shared footer partial's four nav-column headings were
`<h4>`, which skips a level after any page whose last on-page heading is
`<h2>` (true on every normal-chrome page). Fixed by changing
`src/partials/footer.html`'s four column headings to `<h3>` and updating
the matching CSS selector (`site/css/styles.css`, `.site-footer h4` →
`.site-footer h3`) — visually identical, semantically correct. Verified
0 violations afterward on all 6 pages checked, and the full Playwright
suite + both static QA passes still pass.

## Still open (needs-Oz)

- **Business email address** — not published anywhere on the site yet
  (`docs/owner-inputs-required.md`, "Contact email addresses";
  `docs/07-owner-confirmations.md`, "Business email address"). Omitted
  from this page rather than invented; phone is the confirmed channel.
- **Business hours** — no hours have been confirmed anywhere in the repo.
  Omitted rather than invented.
- A real suburb list (shared with the Service areas page's own gap) would
  let the map section be more specific, but isn't required to meet this
  page's own must-have list.

## Score vs. threshold

74/100, all 9 hard gates pass. The two points genuinely missing from
"must-haves" (email, hours) are both needs-Oz facts this round cannot
supply without inventing them — everything buildable without invented
facts is now on the page.
