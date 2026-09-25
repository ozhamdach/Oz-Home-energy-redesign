# Home — Round 5 audit (independent, blind)

This is the first truly blind audit run for Home: a fresh Claude agent
scored the page from evidence only (screenshots, the built production
HTML, Lighthouse and axe output) with no access to this repo's git
history, prior round scores, or the builder's own reasoning. Prior
rounds (1–4, see `round-1-audit.md` and `round-4-audit.md`) were scored
by the same agent that built the page — this round corrects that and
should be treated as the more reliable number going forward, even
though it isn't directly comparable to the 64→69 trend in rounds 1–4.

Audited against the production build (`BUILD_TARGET=production`), which
is what ships to real visitors, after merging in a separate branch's
fixes ([PR #42](https://github.com/ozhamdach/Oz-Home-energy-redesign/pull/42),
not yet merged to `main` at audit time) that touched this page: the
federal battery rebate correction, decluttering the NSW/SAA trust cards
down to a single footer licence display, the workmanship warranty
correcting from 15 to 10 years, the Tesla/Ohme badge swap, the enlarged
badge grid, and removing the dead `?goal=`/`ohe_pathway` prefill
plumbing. Round 5's own prior code work (crediting FoxESS/Sungrow/
Sigenergy/GoodWe as inverter brands too, and restoring the "Greater
Sydney" service-area claim) was already merged to `main` before this
audit — see `85fe441` and `docs/owner-inputs-required.md`.

## Score: 60/100

| Category | Points | Score | Evidence |
|---|---|---|---|
| Conversion | 25 | 12.5 (50%) | Primary CTA above the fold on mobile + desktop, click-to-call everywhere, sticky mobile bar all present. **Docked:** the quote flow is an opaque third-party iframe with no visible step count/progress bar in the shipped markup, and no "what happens after you submit" copy on the page itself. |
| Trust and proof | 20 | 10 (50%) | NSW licence + SAA + named brands (10 total, including Tesla/Ohme/Evnex) + warranty terms all present and correctly worded. **Docked:** zero real install photos carry a suburb name; founder quote has no photo; the review widget rendered only its loading spinner in the captured screenshot (see caveat below). |
| Performance | 15 | 15 (100%) | Lighthouse mobile, production build: 95 performance, LCP 2.33s, TBT 0ms, CLS 0. AVIF/WebP hero with explicit dimensions. |
| Local SEO | 15 | 7.5 (50%) | Unique title/description, correct H1, Electrician + FAQPage schema, 8+ internal links. **Docked:** no specific Sydney suburb named anywhere in body copy, only "Sydney"/"Greater Sydney". |
| Content and clarity | 10 | 5 (50%) | Plain English, no filler. **Docked:** none of cost range, payback, rebate amount, install duration or install-day walkthrough appear on this page. |
| Design and brand | 10 | 5 (50%) | Consistent brand tokens, clear hierarchy, generous whitespace. **Docked:** the page leans on one photograph and generic outline-SVG icons throughout, reading as templated rather than bespoke. |
| Accessibility | 5 | 5 (100%) | axe-core: zero violations at 375px and 1440px. Skip link, descriptive alt text, labelled nav controls. |

**Caveat on the Trust/proof deduction for the review widget:** the
"Loading reviews…" spinner in the screenshot is a sandbox artifact, not
a production defect — this environment's egress proxy blocks
`link.ozhomeenergy.com.au` (confirmed: the same domain the quote iframe
also uses), so the widget's real fetch never completes here. The
widget's actual behaviour (real Google reviews, or a documented
failure state) can't be verified from this sandbox and needs a real
browser hit against the live/staging domain.

**Caveat on Lighthouse SEO:** the *preview* build scores 69 on SEO
because it correctly ships `noindex, nofollow` for safety — that is
expected and not a defect. The number that matters is the *production*
build's score, which is 100. This audit used the production number.

## Hard gates (all pass or not-testable; none fail)

1. Form submits without confirmation — **not independently testable**
   here (the GoHighLevel iframe's domain is network-blocked in this
   sandbox). The static HTML shows a real, fully-parameterized embed
   (form ID, data attributes, `form_embed.js`), not fake or dead markup.
2. Mobile Performance ≥70 / LCP ≤4s — **pass** (95, 2.33s).
3. No sideways scroll at 375px — **pass** (0px overflow, verified).
4. NSW licence in footer — **pass** (`382607C`).
5. Accreditation stated as SAA, not CEC — **pass** (SAA only; zero "CEC" references).
6. Rebate/price/savings claim without an as-of date or source — **pass** (no such claim exists on this page — it's correctly deferred to the dedicated rebate/pricing pages).
7. Fake/unattributed testimonials or stock-as-real photos — **pass** (no testimonial text renders statically on this page; the hero photo makes no "our install" claim).
8. Broken links / console errors / missing title-meta — **pass** (0 console errors, 0 dead `#`/empty hrefs, unique title + description present).
9. CTA text contrast ≥4.5:1 — **pass** (axe clean at both viewports).

## Steal list (vs. a top-tier competitor solar site)

1. Suburb-tagged install photo gallery ("Bondi — 6.6 kW + Powerwall 3") for both trust and local SEO.
2. An on-page ballpark pricing calculator instead of hiding all cost behind the lead form.
3. A live Google star-rating badge near the hero rather than a widget that only resolves further down the page.
4. A founder photo/video next to the founder quote.
5. A visible 3-step quote flow with a progress bar, replacing the opaque iframe.

## Blockers

| Blocker | Severity | Tag |
|---|---|---|
| No cost/payback/rebate/install-duration/install-day content anywhere on the page | P1 | needs-owner-input (these are real business figures) |
| No real, suburb-tagged install photos on the homepage | P1 | needs-owner-input (needs real project photos + suburb/system labels) |
| No founder photo | P1 | needs-owner-input |
| Review widget's live behaviour unverified from this sandbox | P1 | needs-owner-input / needs a real-network re-test |
| Zero specific Sydney suburb mentions in body copy | P1 | needs-owner-input (a real suburb list; "fixable" once supplied) |
| Quote iframe has no visible step/progress indicator | P2 | needs-owner-input (lives inside the third-party HighLevel platform) |
| Homepage feels templated — one photo, mostly generic icons | P2 | needs-owner-input (needs real photography to fix properly) |

## Score vs. threshold

60/100, all hard gates pass or are marked not-testable (none fail).
Still well below 90. This is **round 5, the loop's hard cap for this
page** — per the loop's own rule, this page now pauses for Oz
regardless of score. Every remaining blocker is tagged
needs-owner-input; there is no further Oz-independent implementation
work available on this page right now.
