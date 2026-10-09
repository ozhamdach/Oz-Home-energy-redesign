# EV chargers (/ev-charging/) — Round 2 audit

Audited 9 Oct 2026. Branch `site-loop/ev-chargers-round2` from `main`.
Round 1 (72/100, see `round-1-audit.md`) had its lowest category score by
far in Trust and proof (6/20) with two of its four listed misses being
genuinely code-fixable without inventing anything: "licence/SAA only in
footer" and "no director link." This round closes both.

## What changed this round

- **Licence/SAA stated on-page**, not just the sitewide footer — a second
  hero-trust line under the Ohme badge: "Licensed NSW electrical
  contractor (382607C) · SAA accredited (S5265652)." Same confirmed
  numbers already published elsewhere (About, footer, schema) — reused,
  not re-sourced.
- **New 4th FAQ** ("Who's actually doing the install?") + matching entry
  in `schema-service.html`'s `FAQPage` block — links to About's existing
  founder-story section (`/about/#founder`) rather than needing a new
  photo or bio specific to this page. Closes the round-1 "no director
  link" gap. The answer deliberately sticks to confirmed facts (licence,
  SAA) — an earlier draft of this answer claimed work was "led by its
  founder rather than outsourced to subcontractors," which isn't
  something this repo has actually confirmed, so it was cut before
  commit.
- **Icons** added to the "Brands we install" and "Typical install
  timeline" card headings, matching the style shipped on Contact/About
  rounds 2.
- No change to pricing, the recent-work photo's missing suburb label, or
  the Google rating decision — all unchanged needs-Oz/on-hold items.

## Score: 80 / 100 (was 72)

| Category | Points | Score | Evidence |
|---|---|---|---|
| Conversion | 25 | 19 | Unchanged — embedded quote form front and centre, reachable from the hero CTA anchor; same single-step HighLevel form structurally. |
| Trust and proof | 20 | 12 | **New**: licence/SAA stated on-page (was footer-only); **new**: a director link to About's founder story (was no link at all). "Brands we install" card (Ohme, Evnex) unchanged from round 1. Still open: the one recent-work photo has no suburb label; no live rating (on hold); the FAQ links to the founder story rather than this page carrying a founder photo itself. |
| Performance | 15 | 15 | Lighthouse mobile 98, LCP 2.3s, TBT 0ms, CLS 0 (re-measured; comfortably under the 4s hard-gate threshold). |
| Local SEO | 15 | 12 | Unchanged — H1 with service + Sydney, FAQPage schema (now 4 entries, still valid), `areaServed` includes Greater Sydney. Still missing suburb mentions (needs a real suburb list, shared gap with Service areas/About/Contact). |
| Content and clarity | 10 | 8 | New FAQ answers a real, practical question in plain English. Charger pricing remains the one real content gap — needs-Oz, same as Solar panels. |
| Design and brand | 10 | 9 | New icons on two card headings lift hierarchy; otherwise unchanged brand tokens/spacing. |
| Accessibility | 5 | 5 | axe-core: 0 violations at 375px and 1440px (re-verified this round). |

## Hard gates — all 9 pass

1. Form submit/confirmation — not independently testable from this
   sandbox (HighLevel's domain is network-blocked here); no code change
   this round touched submit behaviour.
2. Lighthouse mobile Performance 98 (≥70), LCP 2.3s (<4s) — pass.
3. No sideways scroll at 375px — Playwright suite, 0 horizontal
   overflow — pass.
4. Licence number present in footer — pass (unchanged; also now stated
   on-page).
5. Accreditation correctly stated as SAA, not CEC — pass (unchanged,
   reinforced in the new hero-trust line).
6. No rebate/price/savings claim on this page — N/A/pass.
7. No fake testimonials or stock photos presented as real — pass (the
   recent-work photo is genuine, unchanged).
8. No broken links, 0 real console errors (the only console entries are
   the sandbox proxy blocking the HighLevel iframe and Google Fonts —
   not a site bug), title + meta description present — pass.
9. Text contrast ≥4.5:1 on every CTA — axe-core confirms, 0 violations —
   pass.

## Verification run this round

- `node scripts/build.js` (preview) + `node scripts/qa-static-checks.js`
  — PASSED, 58 files (includes the audit-remediation pass's new
  phone-consistency and HighLevel-form-ID checks).
- `SITE_OUT_DIR=site-prod-check BUILD_TARGET=production node
  scripts/build.js` + `node scripts/qa-static-checks.js --production` —
  PASSED, 58 files.
- All 4 JSON-LD blocks on `/ev-charging/` (Electrician, BreadcrumbList,
  Service, FAQPage with 4 entries) parse cleanly.
- `node scripts/build-pages.js` + `QA_BASE_URL=... node
  scripts/qa-playwright.js` (full sitewide regression, including the
  nested-404 GitHub Pages subpath check) — PASSED, no console errors, no
  horizontal overflow.
- axe-core on `/ev-charging/` at 375px and 1440px — 0 violations both.
- Lighthouse mobile on `/ev-charging/` — Performance 98, Accessibility
  100, Best Practices 96, SEO 69 (sole deduction is the preview build's
  intentional `noindex`, same pattern as every other page's preview
  audit).
- Screenshots: `round2-desktop-1440.png`, `round2-mobile-375.png`. Note:
  the three lazy-loaded Evnex images render blank in both full-page
  screenshots — a Playwright screenshot-timing artifact with
  `loading="lazy"` images below the fold on first paint, not a real site
  defect; the Playwright suite's own asset-existence and console-error
  checks (which fetch every image) passed cleanly, and nothing in this
  round touched those images or their markup.

## Still open (needs-Oz)

1. EV charger pricing (no indicative range published anywhere) — same
   gap as Solar panels.
2. Suburb label for the one recent-work photo.
3. A real suburb list (shared gap with Service areas/About/Contact).
4. Same `/assessment/`-adjacent form-structure question shared sitewide —
   this page's own embedded form already does better than most by being
   on-page rather than a link-out.
5. A photo of Oz specifically — the new director link points to the
   existing founder story, but a dedicated photo remains About's own
   open gap (`docs/owner-inputs-required.md`), not something this round
   invents.

## Score vs. threshold

80/100, all 9 hard gates pass. The 20 remaining points split between the
same price/suburb/form-structure gaps every page shares and the
charger-specific suburb-label/pricing items above — nothing further is
buildable here without inventing a price, a suburb, or a photo. Paused
for Oz again, now 8 points higher than round 1.
