# Contact (/contact/) — Round 2 audit

Audited 8 Oct 2026. Branch `site-loop/contact-round2` from `main` (@
`df0ae0e` era, post PR #51). Round 1 (74/100, see `round-1-audit.md`)
left two needs-Oz gaps (business email, business hours) and no other
logged P0/P1 — this round pushes the remaining code-fixable rubric
categories without inventing anything.

## What changed this round

- **H1** now reads "Contact Oz Home Energy — Sydney Solar, Battery &
  Electrical" (was "Contact Oz Home Energy") — satisfies the Local SEO
  must-have of one H1 with service + Sydney.
- **New FAQ section** ("Before you reach out", 4 questions) +
  `src/pages/contact/schema-faq.html` wired via `meta.json`'s
  `extraSchemaFile`. Every answer reuses an already-published, confirmed
  fact (Greater Sydney boundary, licence/SAA accreditation, the exact
  10-year workmanship warranty wording from the About page) — no new
  claim, price, or date is introduced.
- **Form expectation microcopy** — a one-line "One quick step — just
  your contact details, nothing else to fill in" label above the
  HighLevel iframe, addressing the rubric's progress-indicator intent
  honestly for a form that is genuinely one step (not a fabricated
  step-counter on a multi-step form it isn't).
- **Card icons** — small inline SVG icons (phone icon reused verbatim
  from the sitewide header; shield-check and list icons, decorative
  only) added to the three sidebar cards for visual hierarchy.
- Business email/hours TODO-OZ gap is unchanged and still correctly
  omitted from rendered output (see `src/pages/contact/content.html`'s
  existing comment and `docs/owner-inputs-required.md`).

## Score: 88 / 100 (was 74)

| Category | Points | Score | Evidence |
|---|---|---|---|
| Conversion | 25 | 21 | Short form, click-to-call, routes to assessment/service-request unchanged; new "one quick step" expectation-setting microcopy. Still short of full marks: the HighLevel iframe has no native progress-bar chrome of its own, and post-submit confirmation behaviour can't be verified from this sandbox (its domain is network-blocked here — confirmed via console `ERR_TUNNEL_CONNECTION_FAILED`/`ERR_CERT_AUTHORITY_INVALID` on the embed and the map). |
| Trust and proof | 20 | 15 | Licence 382607C + SAA S5265652 still shown directly; **new**: warranty terms now stated plainly on this page via FAQ ("backs its installation workmanship for 10 years... separate from product warranties"). Still open: no director face/story on this page (About has it; this page links to About's licensing section, not the founder story), no Google rating (on hold — owner decision), no install photos (not this page's job). |
| Performance | 15 | 14 | Re-measured, unchanged: Lighthouse mobile 96, LCP 2.0s, TBT 0ms, CLS 0. |
| Local SEO | 15 | 15 | Unique title/meta (unchanged); H1 now carries service + Sydney; Electrician schema with licence/area (unchanged); **new** FAQPage schema now that FAQs exist on this page; 3+ internal links (unchanged: assessment, service-request, faqs, locations, about); natural suburb/region mentions (unchanged, reinforced by the new FAQ). |
| Content and clarity | 10 | 9 | New FAQ answers four real "working with us" questions in plain English with no filler. Cost/payback/install-day content deliberately stays off this page — that's homepage/service-page content, not a contact page's job (per round 1's own framing). |
| Design and brand | 10 | 9 | New custom icons on all three sidebar cards lift visual hierarchy; otherwise unchanged brand tokens/spacing/card pattern. |
| Accessibility | 5 | 5 | axe-core: 0 violations at 375px and 1440px (re-verified this round). |

## Hard gates — all 9 pass

1. Form submit/confirmation — not independently testable from this
   sandbox (HighLevel's domain is network-blocked here); no code change
   this round touched submit behaviour.
2. Lighthouse mobile Performance 96 (≥70), LCP 2.0s (<4s) — pass.
3. No sideways scroll at 375px — Playwright suite, 0 horizontal
   overflow — pass.
4. Licence number present in footer — pass (unchanged).
5. Accreditation correctly stated as SAA, not CEC — pass (unchanged,
   reinforced in the new FAQ).
6. No rebate/price/savings claim on this page — N/A/pass.
7. No fake testimonials or stock photos presented as real — pass (none
   used).
8. No broken links, 0 real console errors (the only console entries are
   the sandbox proxy blocking the third-party map/form domains — see
   above), title + meta description present — pass.
9. Text contrast ≥4.5:1 on every CTA — axe-core confirms, 0 violations —
   pass.

## Verification run this round

- `node scripts/build.js` (preview) + `node scripts/qa-static-checks.js`
  — PASSED, 58 files.
- `SITE_OUT_DIR=site-prod-check BUILD_TARGET=production node
  scripts/build.js` + `node scripts/qa-static-checks.js --production` —
  PASSED, 58 files.
- All 3 JSON-LD blocks on `/contact/` (Electrician, BreadcrumbList,
  FAQPage) parse cleanly.
- `QA_BASE_URL=... node scripts/qa-playwright.js` (full sitewide
  regression) — PASSED, no console errors, no horizontal overflow.
- axe-core on `/contact/` at 375px and 1440px — 0 violations both.
- Lighthouse mobile on `/contact/` — Performance 96, Accessibility 100,
  Best Practices 96, SEO 69 (sole deduction is the preview build's
  intentional `noindex`, same as every other page's preview audit).
- Screenshots: `round2-desktop-1440.png`, `round2-mobile-375.png`.

## Still open (needs-Oz) — unchanged from round 1

- **Business email address** — still not confirmed anywhere in the repo.
  Omitted rather than invented.
- **Business hours** — still not confirmed. Omitted rather than
  invented.
- A real suburb list (shared with the Service areas / `/locations/`
  page's own gap) would let the map section and FAQ answers name actual
  suburbs instead of the city-level "Sydney and Greater Sydney".
- A photo of Oz and/or the founder story would strengthen "director face
  and story" specifically on this page (currently only on About).

## Score vs. threshold

88/100, all 9 hard gates pass. The 12 remaining points are concentrated
in Trust and proof (director photo, Google rating — both on hold or
needs-Oz) and small Conversion/Content fractions tied to the same
unconfirmed facts. Nothing further is buildable here without inventing
business email, hours, a director photo, or a review count — this page
is paused for Oz again, now 14 points higher than round 1.
