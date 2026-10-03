# Home batteries (/battery-storage/) — Round 2 audit (independent, blind)

First blind audit for this page: a fresh agent scored it from evidence
only (screenshots, the built production HTML, Lighthouse/axe output)
with no access to this repo's git history or prior round scores. Round
1 (see `round-1-audit.md`) was scored by the same agent that built the
page — this round corrects that, and should be treated as the more
reliable number going forward even though the 73→68 delta isn't a real
regression (different methodology, not a worse page — see the same
caveat on Home's round-5 audit).

Audited the production build after merging in two other branches'
fixes that also touch this page: [PR #42](https://github.com/ozhamdach/Oz-Home-energy-redesign/pull/42)
(the federal battery rebate correction — this page's rebate section was
completely rewritten with real CER-sourced figures, replacing the
round-1 version's since-corrected Zone 3/dollar-figure content) and
[PR #44](https://github.com/ozhamdach/Oz-Home-energy-redesign/pull/44)
(the photographic hero banner). Round 2's own build work: added a
founder-story link (`/about/#warranty` warranty link + `/about/#founder`
excerpt, matching Home's pattern — round 1 flagged "no director
photo/story link" as fixable) and a one-line 10-year workmanship
warranty mention in the "Licensed installation" card (round 2's own
audit flagged "no warranty terms stated anywhere in body copy" — the
warranty already exists as approved sitewide content, this page just
never mentioned it).

## Score: 68/100 (67.5 rounded)

| Category | Points | Score | Evidence |
|---|---|---|---|
| Conversion | 25 | 12.5 (50%) | Primary CTA above the fold on mobile + desktop, sticky mobile CTA bar, click-to-call everywhere. **Docked:** no quote/contact form exists on this page itself — the CTA routes off-page to `/assessment/`, so the "≤3-step form with progress bar, clear next step after submit" criterion can't be met here. |
| Trust and proof | 20 | 10 (50%) | Named brands with real install photos, footer licence/SAA, founder quote linking to `/about/#founder`. **Docked:** no Google rating/review count on page; gallery captions name brand only, never suburb; no warranty terms in body copy *(the warranty line was added after this audit ran — see note below)*; founder story is text-only on this page, no face. |
| Performance | 15 | 15 (100%) | Lighthouse mobile, production build: 94 performance, LCP 2.47s, TBT 0ms, CLS 0. |
| Local SEO | 15 | 15 (100%) | Unique title/description, H1 with service+Sydney, Electrician + FAQPage schema, 8+ internal links, natural Sydney/Greater Sydney mentions. |
| Content and clarity | 10 | 5 (50%) | Strong on sizing, backup-vs-savings, rebate mechanics with a worked example and two CER sources, compatibility guidance. **Docked:** "how long does installation take" — a named required buyer question — is answered nowhere on the page. |
| Design and brand | 10 | 5 (50%) | Consistent tokens, generous spacing. **Docked:** roughly seven near-identical card-grid sections in a row read as repetitive; the "Recent battery work" gallery renders as flat, low-contrast tiles that read closer to placeholder than showcase photography. |
| Accessibility | 5 | 5 (100%) | axe-core: zero violations at 375px and 1440px. Skip link, ARIA nav attributes, meaningful alt text throughout. |

**Note on the Trust score:** the audit ran before the warranty-line fix
above was added (both landed in the same round). The "no warranty
terms in body copy" deduction should no longer apply post-fix; the
"no photo/face" and "no suburb captions"/"no live rating" deductions
still do — those remain genuinely open.

## Hard gates (all pass or not-testable; none fail)

1. Form submits without confirmation — **not testable** (no form exists on this page itself; the CTA links to `/assessment/`, outside this audit's scope).
2. Mobile Performance ≥70 / LCP ≤4s — **pass** (94, 2.47s).
3. No sideways scroll at 375px — **pass** (0px overflow, verified).
4. NSW licence in footer — **pass** (`382607C`).
5. Accreditation stated as SAA, not CEC — **pass**.
6. Rebate/price/savings claim without an as-of date or source — **pass** (the 1 May–31 Dec 2026 period plus two direct Clean Energy Regulator source links).
7. Fake/unattributed testimonials or stock-as-real photos — **pass** (no testimonials; the Tesla lifestyle photo is clearly manufacturer product imagery in its own labelled section, not claimed as an Oz Home Energy job).
8. Broken links / console errors / missing title-meta — **pass**.
9. CTA text contrast ≥4.5:1 — **pass** (axe clean at both viewports).

## Steal list (vs. a top-tier competitor battery page)

1. Live Google rating + review count badge near the hero.
2. Suburb-tagged captions on every install photo ("FoxESS install — Beecroft") instead of brand-only captions.
3. Embed the quote flow (3 steps, progress bar) directly on this page instead of a click-out to `/assessment/`.
4. A founder headshot/video next to the quote, not text-only.
5. A short "what happens on install day" timeline graphic answering install duration.

## Blockers

| Blocker | Severity | Tag |
|---|---|---|
| No Google rating/review widget on this page | P1 | needs-owner-input |
| Gallery captions lack suburb names | P1 | needs-owner-input (real project data) |
| Warranty terms not mentioned in body copy | P1 | **fixed this round** — 10-year workmanship warranty line added to the "Licensed installation" card |
| "How long does install take" unanswered | P1 | needs-owner-input (a real day/hour estimate) |
| Quote CTA exits to a separate page rather than an inline stepped form | P2 | needs-owner-input (the underlying `/assessment/` form-structure decision, same as Home) |
| Repetitive card-grid sections / flat gallery tiles reduce premium feel | P2 | fixable, but a sitewide `.photo-gallery`/`.gallery-item` CSS change — deliberately not done solo inside this page's round, since it would affect every page using that component (Home, /projects/, every other service page) without re-auditing them all. Logged for a dedicated sitewide design pass instead of an ad-hoc single-page fix. |

## Score vs. threshold

68/100 (pre-warranty-fix baseline; the fix should move Trust up
slightly on a re-audit), all hard gates pass or are marked
not-testable — none fail. Round 2 made two real, Oz-independent fixes
(founder-story link, warranty-terms mention). Every other open
blocker is either needs-owner-input (rating widget, suburb labels,
install-duration figure, the form-structure decision) or a sitewide
design change out of scope for a single page's round. Following the
same reasoning applied to Home's round-5 closure: no further
Oz-independent, single-page implementation work is available here
right now, so this page pauses for Oz rather than spending rounds 3–5
on busywork.
