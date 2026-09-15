# Commercial Battery Assessment Funnel v2 — Deliverables

Companion to `docs/08-commercial-battery-assessment-funnel.md` (v1 design),
`docs/08a-bess3-bess4-facts.md` (sourced facts + v2 re-verification), and
`docs/08b-funnel-test-plan.md` (v1 test plan). This document covers what
changed in the v2 rebuild and the 11 deliverables requested for it.

## 1. Summary of changed files

| File | Change |
|---|---|
| `src/pages/commercial-battery-assessment/content.html` | Rewritten from a single-page conditional form to an accessible 3-stage wizard with the full question set (site fit / commercial need / contact & consent) |
| `src/pages/commercial-battery-assessment/meta.json` | Added `landingChrome: true` |
| `src/pages/commercial-battery-assessment-thanks/content.html` | Copy replaced with the exact required confirmation text |
| `src/pages/commercial-battery-assessment-thanks/meta.json` | Added `landingChrome: true` (already had `noindex: true` from v1) |
| `site/js/commercial-battery-assessment.js` | Rewritten: 3-stage navigation, expanded routing table, error summary + `aria-invalid`/`aria-describedby`, first-touch + latest-touch attribution, Meta Pixel interface, consent timestamps (two, separate) |
| `site/js/main.js` | Attribution allowlist extended with `site_source_name`, `creative_strategy` |
| `src/partials/header-landing.html` (new) | Minimal landing-page header: brand, click-to-call (desktop text link + mobile icon button), one CTA — no primary nav |
| `src/partials/footer-landing.html` (new) | Minimal landing-page footer: legal entity/ABN/licence line, privacy/terms/complaints links only — no sitemap columns |
| `scripts/build.js` | New `meta.landingChrome` flag selects the minimal header/footer per page |
| `site/css/styles.css` | `.assess-step h3` sizing, bare `<legend>` styling (not just inline-styled ones), `.error-summary`, `.hint` made usable outside `.form-field` + a light variant for dark sections (fixed a real contrast bug — see §8), `.landing-header` CTA/nav-toggle overrides, `prefers-reduced-motion` support |
| `docs/08a-bess3-bess4-facts.md` | v2 re-verification addendum (90-day rule correction, once-per-site rule, off-grid/non-Class-2 unverified flags) |
| `docs/08c-v2-deliverables.md` (this file) | New |

**Not changed:** `src/partials/header.html`, `src/partials/footer.html` (the
sitewide nav/footer used by every other page) — the minimal chrome is
additive, opt-in per page via `landingChrome`, not a replacement.

## 2. Scheme-claim register

| Claim | Status | Source | Verification date |
|---|---|---|---|
| BESS3/BESS4 commenced 1 September 2026 | VERIFIED (corroborated) | ~10 independent secondary sources (see `docs/08a`); primary `.gov.au` sources blocked by sandbox network policy both passes | 2026-09-13 |
| BESS3: BCA Class 2 apartment buildings, 4+ dwellings | VERIFIED (corroborated) | as above | 2026-09-13 |
| BESS4: business sites, excludes residential + data centres | VERIFIED (corroborated) | as above | 2026-09-13 |
| Capacity band >20kWh–≤200kWh (both activities) | VERIFIED (corroborated) | as above | 2026-09-13 |
| Once claimed at a site, BESS4/BESS5 cannot be claimed again; existing battery alone does not disqualify | VERIFIED (corroborated) | as above | 2026-09-13 |
| 90-day solar/battery window affects incentive tier, not a strict eligibility gate; solar not mandatory | VERIFIED (corroborated), with a correction to the brief's framing | as above | 2026-09-13 |
| Off-grid business sites not eligible | **UNVERIFIED** — supplied as an input fact, not independently corroborated by any source found | none found independently | 2026-09-13 |
| Non-Class-2 apartment building treatment | **UNVERIFIED** — no source addresses this specifically; routed to `manual_eligibility_review`, the conservative option | none found independently | 2026-09-13 |
| NSW Electrical Contractor Licence 382607C | Carried from prior owner confirmation (`docs/07-owner-confirmations.md`), unchanged by this pass | Owner-confirmed, prior session | 2026-09-12 |
| NETCC membership, SAA accreditation beyond what's already confirmed, ACP relationship, partnerships, project quantities, warranties, testimonials, "years in business" | **UNVERIFIED — not published anywhere in this funnel** (none of these claims appear in the new page's copy) | N/A — deliberately absent | 2026-09-13 |
| "Old production homepage displays 0420 113 216 and NETCC Member" (from the brief's audit findings) | **FALSE relative to this repository's current state** — both only exist as historical references in `docs/*.md` describing already-fixed past issues (fixed in a prior PR, merged before this session). No live `src/`/`site/` content shows either. Grepped directly before acting; not assumed. | This session's own grep of `src/`, `site/`, `docs/` | 2026-09-13 |
| "Production canonical route currently redirects to the old homepage" (from the brief) | **Not applicable** — `src/pages/commercial-battery-assessment/meta.json`'s canonical is `/commercial-battery-assessment/`, confirmed correct; no real `ozhomeenergy.com.au` production deployment exists yet for this repo to have broken (see `docs/owner-inputs-required.md`'s open hosting-platform decision) | This session's own inspection | 2026-09-13 |

No fixed discount amount, certificate quantity, payback period or savings
figure appears anywhere in the funnel's copy. None of the disallowed
phrases ("free battery", "guaranteed rebate", "government pays",
"approved", "claim $X", "guaranteed savings", "guaranteed eligibility",
fake urgency/deadline) appear anywhere in the new copy — checked by direct
text review of `content.html` against the disallowed list. No NSW
Government, IPART, NETCC, SAA, CEC, ACP, Tesla or other third-party logo
appears on this page (confirmed: the page includes no `<img>` tags at all
other than the Oz Home Energy brand icon in the header).

## 3. HighLevel field and tag map

| CRM field | Source | Notes |
|---|---|---|
| Contact: First/Last name | `contactName` split | |
| Contact: Email | `workEmail` | Used as the primary dedup key |
| Contact: Phone | `phone` | Used as the dedup key when email is absent/differs |
| Custom field `campaign` | fixed `bess3_bess4_launch` | |
| Custom field `site_address` / `site_suburb` / `site_postcode` | Stage 1 | |
| Custom field `nsw_confirm` | Stage 1 | |
| Custom field `site_type` | Stage 1 | `apartment_building \| commercial_business \| individual_home \| data_centre \| unsure` |
| Custom field `dwelling_count` / `bca_class_2` / `common_property_space` | Stage 1, apartment branch only | `null` on a non-apartment submission — verified by test (see §6) |
| Custom field `grid_connected` / `role` / `authority` / `existing_battery` / `prior_pdrs_activity` / `solar_status` | Stage 1 | |
| Custom field `main_objective` / `demand_charges` / `approx_quarterly_spend` / `operating_hours` / `capacity_band` / `project_timeframe` / `bill_request_ok` | Stage 2 | `operating_hours` optional, `null` if left blank |
| Custom field `preferred_contact_method` | Stage 3 | |
| Custom field `bess_classification` | Computed | One of the 13 routing outcomes in §5 — never `eligible` |
| Custom field `required_consent_given_at` / `marketing_consent_given_at` | Stage 3, captured at tick time | `marketing_consent_given_at` is `null` unless the separate optional box was ticked |
| Tags | Computed | `source:commercial-battery-assessment`, `campaign:bess3_bess4_launch`, `classification:<value>`, `priority:<high\|medium>`, `consent:marketing-opt-in` (only if marketing consent given) |
| Business/strata name | `businessName` | Mapped to a custom field, not HighLevel's own company-name field, until confirmed which fits the account's schema |

**Pipeline (as specified):** New commercial energy enquiry → Eligibility
review → Information/bill requested → Assessment booked → Technical
feasibility → Proposal issued → Won / Lost / Not eligible.

**Opportunity creation rule (implemented in the payload contract, enforced
downstream once a real endpoint exists — cannot be enforced client-side
today):** a submission alone does **not** create an opportunity. The
documented rule for whoever builds the real endpoint: create an
opportunity only when `bess_classification` is `bess3_review_required` or
`bess4_review_required` (the rule-based threshold) — every
`manual_eligibility_review_*`, `potential_bess5_manual_review`,
`influencer_authority_required`, `outside_campaign_area`,
`not_bess_residential_route`, and `not_bess4_data_centre` /
`not_bess3_under_4_dwellings` outcome instead creates only a contact +
task for manual review, with an opportunity created later by a team
member's manual approval if warranted.

**Dedup, attribution preservation, workflows — documented, not built**
(no real endpoint exists to build them against): contact dedup by
normalised email then normalised phone (implemented and tested against the
local mock, see §6); original/first-touch attribution must never be
overwritten by a repeat submission — store latest-touch separately (this
funnel's payload already separates `attribution.first_touch` from
`attribution.latest_touch`, see §4); internal notification, task creation,
bill-request workflow trigger (`bill_request_ok` flag), neutral
confirmation SMS/email, workflow stop conditions, and lost/not-eligible
reason capture are all HighLevel Automation configuration that depends on
account access this session does not have — **IMPLEMENTED BUT REQUIRES
EXTERNAL CONFIGURATION**.

## 4. Attribution parameter map

| Parameter | Captured | Where |
|---|---|---|
| `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` | Yes | First-touch (sitewide `sessionStorage`, never overwritten) AND latest-touch (this page load's own query string) |
| `campaign_id`, `adset_id`, `ad_id`, `placement` | Yes | As above |
| `site_source_name`, `creative_strategy` | Yes (new in v2) | As above |
| `fbclid`, `gclid` | Yes | As above |
| Landing-page URL | Yes | `landing_page` in both first- and latest-touch objects |
| Referrer | Yes | `referrer` in both | 
| Submission timestamp | Yes | `meta.submitted_at`, set only on a confirmed submission attempt |
| Everything else in the query string | **Discarded** | Only the allowlisted keys above are ever read from `URLSearchParams` — no wildcard/passthrough capture exists anywhere in this codebase |

Personal form answers (name, email, phone, business name, address, bill
details) are never placed in the URL, never pushed to `dataLayer`, and
never passed to the Meta Pixel interface — see `analyticsEventData()` in
`site/js/commercial-battery-assessment.js`, an explicit allowlist of
non-PII fields only.

## 5. Routing-logic table

Evaluated in this order (first match wins) — see the reasoning in
`docs/08a-bess3-bess4-facts.md`'s re-verification section for the
non-Class-2 and off-grid judgement calls:

| # | Condition | Outcome |
|---|---|---|
| 1 | `nswConfirm = no` OR postcode outside NSW ranges | `outside_campaign_area` |
| 2 | `siteType = individual_home` | `not_bess_residential_route` |
| 3 | `siteType = data_centre` | `not_bess4_data_centre` |
| 4 | `siteType = apartment_building` AND `dwellingCount < 4` | `not_bess3_under_4_dwellings` |
| 5 | `siteType = apartment_building` AND `bcaClass2 = no` | `manual_eligibility_review_non_class_2` |
| 6 | `gridConnected = no` | `manual_eligibility_review_offgrid` |
| 7 | `role = tenant` OR `authority = no` | `influencer_authority_required` |
| 8 | `capacityBand = over_200` | `potential_bess5_manual_review` |
| 9 | `existingBattery = yes` | `manual_eligibility_review_existing_battery` |
| 10 | `priorActivity = yes` OR `unsure` | `manual_eligibility_review_prior_activity` |
| 11 | `siteType = apartment_building` (none of the above matched) | `bess3_review_required` |
| 12 | `siteType = commercial_business` (none of the above matched) | `bess4_review_required` |
| 13 | `siteType = unsure` (none of the above matched) | `manual_eligibility_review_site_type_unsure` |

`capacityBand = unsure` never short-circuits — it falls through to rules
11/12 exactly like a known in-range answer, per "unknown capacity is
retained for assessment, not rejected." No path ever produces `eligible`.

## 6. Automated test results

All runs this session, against a local rebuild of this exact branch,
served on `localhost`, with a disposable local Node server standing in
for HighLevel (the same "safe local/intercepted CRM destination" method
as `docs/08b-funnel-test-plan.md`) — nothing sent to any real or
third-party endpoint. Test scripts are throwaway harness code, not
committed to the repo; this document is the durable record.

| Suite | Result |
|---|---|
| Routing scenarios (16): BESS3 plausible, apartment under 4, non-Class-2, BESS4 plausible, data centre, individual home, outside NSW (postcode), outside NSW (explicit no), off-grid, existing battery, prior activity (yes), prior activity (unsure), unknown capacity, capacity >200kWh, non-decision-maker (tenant), non-decision-maker (no authority) | **16/16 PASS** — each produced exactly the classification in §5's table |
| Validation/field scenarios (9): missing required answers, invalid postcode format, invalid email format, required-consent blocks submission, optional marketing-consent does not block, marketing-consent timestamp captured when checked, `null` when unchecked, back-navigation retains stage 1 + stage 2 answers | **9/9 PASS** |
| Server error / duplicate handling (4): simulated server error does not redirect or show success, duplicate email submission still reaches the CRM adapter (not silently dropped client-side) and both attempts are recorded server-side for the CRM's own dedup logic to resolve | **4/4 PASS** |
| Happy path (1): successful submission redirects to thank-you page, classification is never the literal string `eligible` | **1/1 PASS** |
| **Full suite total** | **36/36 PASS**, run twice (before and after the heading-hierarchy fix in §8 — no regression) |
| Accessibility-specific checks (11): every `aria-describedby` resolves to a real element, every fieldset has a legend, no heading-level skip, focus moves to the error summary on a failed Continue, error-summary links focus the actual field, stage-change announcements update, `prefers-reduced-motion` disables transitions, tap targets ≥44px (radio-card labels, desktop CTA, mobile call button — each measured on the viewport where it's actually visible) | **11/11 PASS** (first run found 2 real bugs — see §8 — both fixed, then reconfirmed clean) |
| Sitewide regression (`scripts/qa-static-checks.js` preview + `--production`, `scripts/qa-playwright.js`) | **PASS**, no regression to any existing page, form, or the mobile nav |

**48 total automated assertions this session, all passing on the final
build.**

## 7. Screenshots

Captured and sent to the user separately: 375px, 390px, 430px, tablet
(820px), desktop (1440px) — stage 1, stage 2, stage 3 at every width; the
thank-you page and the apartment-branch view at desktop; a validation
error state at every width. All confirmed zero horizontal overflow
(`scrollWidth - clientWidth === 0`) at every tested width.

## 8. Accessibility findings

**Fixed during this pass (found by actually rendering the page, not
assumed):**
- A real contrast bug: the scheme-qualification sentence in the hero
  used `<p class="hint">` outside any `.form-field` ancestor, so it
  inherited no color rule at all and rendered as default (dark) text on
  the hero's dark background — effectively invisible. Fixed by making
  `.hint` a standalone class with a light variant for dark sections.
- The landing header's primary CTA ("Check Site Eligibility") disappeared
  entirely between 720px and 860px viewport widths — the sitewide
  header's `.desktop-cta` relies on the hamburger menu to carry the CTA
  below 860px, but the landing header has no hamburger/drawer at all.
  Fixed with a landing-header-specific override.
- No click-to-call element existed on mobile at all (`.phone-link` is
  desktop-only; the landing header hadn't included the icon-only
  `.mobile-call-btn` counterpart). Fixed.
- A heading-hierarchy skip (H1 → H3), found by an automated heading-level
  scan: the two intro cards ("Apartment buildings" / "Business premises")
  used `<h3>` but appear in document order before the form section's own
  `<h2>` ("NSW Commercial Battery Site Check") — an H1→H3 skip. Fixed by
  making both `<h2>` (they're top-level content blocks alongside the form
  section, not children of it); the form's own stage headings stayed
  `<h3>` as children of that `<h2>`.

**Implemented:**
- `aria-describedby` linking every stage-1/3 text/email/tel field to its
  error message.
- `aria-invalid="true"` set on any field the error summary flags, cleared
  on the next successful validation pass.
- An error summary above the active stage's fields, listing every invalid
  field as a link; clicking a link moves focus directly to that control
  (not just a scroll-to-anchor).
- Focus moves to the error summary on a failed Continue/Submit attempt.
- Stage changes are announced via a `visually-hidden` `aria-live="polite"`
  region ("Stage 2 of 3: Commercial need").
- Keyboard-complete: native radio groups (arrow keys + Space), native
  checkboxes/selects — nothing custom that traps or bypasses standard
  keyboard behaviour.
- Interactive targets: `.btn` and `.radio-card label` both already carry
  `min-height: 48px` in the existing design system (exceeds the 44px
  minimum); consent checkboxes are wrapped in a full-width `<label>`, so
  the effective tap target is the whole row, not the tiny native checkbox
  square.
- Visible focus states: `.radio-card input:focus-visible + label` already
  had a 3px outline in the existing design system; native inputs/buttons
  use the browser/UA focus ring, not suppressed anywhere in this page's
  CSS.
- Heading hierarchy: H1 (page title) → H2 ("NSW Commercial Battery Site
  Check" form title) → H3 (each stage heading) — no skipped level on this
  page. (The sitewide footer's separate H2→H4 skip, found in the earlier
  audit dossier, is unrelated to this page and not fixed here — out of
  this pass's scope per "do not refactor unrelated sections.")
- `prefers-reduced-motion: reduce` disables the stage-transition fade and
  the progress-bar width transition.
- No horizontal overflow at any tested width (375/390/430/820/1440px).

**Not verified in this pass (disclosed gap, same as v1):** no automated
WCAG contrast-ratio scan or full screen-reader (NVDA/VoiceOver) pass — no
axe-core or equivalent tool is available in this sandbox, and no real
screen reader could be driven here. The specific contrast bug found above
was caught by actually rendering and looking at the page, not by an
automated contrast checker — a real one is still recommended before paid
traffic.

## 9. Remaining blockers

1. **No real HighLevel endpoint or credentials** — same blocker as v1,
   unchanged. `docs/04-highlevel-integration.md`'s checklist still
   applies. **BLOCKED.**
2. **No secure server-side/serverless endpoint** to front HighLevel from a
   static GitHub Pages site — required before any real submission can
   happen, regardless of HighLevel access. **BLOCKED.**
3. **Electricity bill upload replaced with a request workflow** — no
   secure upload infrastructure exists in this static build, so per the
   brief's own instruction, no file input was added. A checkbox instead
   captures consent to be asked for the bill later. **IMPLEMENTED (as a
   workaround) BUT the real bill-collection workflow itself still
   requires the same secure backend as #2.**
4. **Meta Pixel** — no Pixel ID supplied; the interface exists
   (`firePixelEvent`, calls `window.fbq` only if something else already
   defined it) but nothing loads or injects the Pixel itself.
   **IMPLEMENTED BUT REQUIRES EXTERNAL CONFIGURATION** (a real Pixel ID +
   the base code snippet, inserted the same way GTM is documented in
   `docs/analytics-integration.md`).
5. **Off-grid exclusion and non-Class-2 handling** — implemented per the
   brief's instruction, but the underlying scheme facts are unverified
   against a primary source (see §2). **UNVERIFIED** input, not a code
   blocker.
6. **Consent wording** — restrained, not legally reviewed. Same standing
   item as every other form on this site (`docs/owner-inputs-required.md`).
   **IMPLEMENTED BUT REQUIRES EXTERNAL CONFIGURATION** (legal sign-off).
7. **No automated WCAG/contrast scan tool available** — see §8.
   **UNVERIFIED.**
8. **Server-side validation** — this pass only adds client-side validation
   (required by the brief, done) plus removes the sole reliance on
   `novalidate`. Real server-side re-validation must live in whatever
   secure endpoint eventually fronts this form (#2) — it cannot exist in
   a static site. **BLOCKED**, tracked as part of #2.

## 10. Exact steps required to activate the real CRM endpoint

1. Obtain a HighLevel account with API/webhook access for Oz Home Energy.
2. Decide the integration path: (a) a HighLevel **Inbound Webhook**
   (Automation → Workflows → "Inbound Webhook" trigger), or (b) HighLevel's
   own exported form embed snippet, replacing this custom-built form.
3. Build a secure server-side/serverless endpoint (Cloudflare Worker,
   Vercel/Netlify function, or similar) that: validates every field
   server-side (never trusts that client-side `required`/`type=email` was
   enforced), applies a honeypot/challenge, rate-limits per IP/session,
   and holds the HighLevel API key/webhook secret as an environment
   secret — never in any file this repository ships to a browser.
4. Point that endpoint at the field/tag map in §3 above.
5. In this repo, define `window.OHE_BESS_SUBMIT_ADAPTER` to call the real
   endpoint (replacing the test-only local adapter used for this
   session's verification) — no other code in
   `site/js/commercial-battery-assessment.js` needs to change, since the
   adapter interface was built exactly for this swap.
6. Configure the HighLevel pipeline stages, tags, workflows, dedup rule,
   and opportunity-creation threshold from §3.
7. Run one authorised end-to-end test with real (but internal/test)
   contact details, confirm the contact/opportunity lands correctly with
   the right custom fields, tags and consent evidence.
8. Only after step 7 passes: remove `noindex` from the production build
   (already automatic once `BUILD_TARGET=production` is set and this page
   is not otherwise gated), confirm canonical/OG tags on the real
   `ozhomeenergy.com.au` domain, and begin paid traffic.

## 11. Rollback instructions

This work is on a dedicated branch, not merged to `main`. To roll back
before merge: simply do not merge the pull request — `main` is
unaffected. If it has already been merged and needs reverting:

```
git revert <merge-commit-sha>   # for a merge commit, add -m 1
git push origin main
```

No DNS, external account, or GitHub Pages configuration changes were made
by this pass — reverting the commit(s) fully restores the previous
`/commercial-battery-assessment/` funnel (the v1 single-page version) with
no other side effects, since this pass touched only the files listed in
§1 (no unrelated sections of the repository were refactored).

## 12. Completion status

| Item | Status |
|---|---|
| 3-stage wizard, full question set, progress indicator, retained answers | VERIFIED COMPLETE |
| Full routing table (13 outcomes, never "eligible") | VERIFIED COMPLETE |
| Landing-page minimal header/footer | VERIFIED COMPLETE |
| Thank-you page exact copy + no-false-success states | VERIFIED COMPLETE |
| Accessibility upgrades (error summary, aria-describedby/invalid, focus mgmt, reduced motion, heading hierarchy, tap targets) | VERIFIED COMPLETE (contrast/screen-reader automation gap disclosed) |
| Attribution (allowlist, first + latest touch, no PII) | VERIFIED COMPLETE |
| CRM payload v2 (fields, tags, consent timestamps) | VERIFIED COMPLETE (client-side; server-side enforcement pending #2) |
| Dedup logic | VERIFIED COMPLETE against local mock; real HighLevel dedup behaviour UNVERIFIED until a real endpoint exists |
| Meta Pixel interface | IMPLEMENTED BUT REQUIRES EXTERNAL CONFIGURATION (Pixel ID) |
| Bill upload → request workflow | IMPLEMENTED (workaround); real workflow BLOCKED on #2 |
| Real HighLevel connection | BLOCKED (no credentials/endpoint) |
| Secure server-side endpoint | BLOCKED (none exists; GitHub Pages cannot hold one) |
| Server-side validation | BLOCKED, tracked with the endpoint above |
| Scheme-claim accuracy (BESS3/BESS4 core facts) | VERIFIED (corroborated, not primary-source-confirmed — sandbox network policy blocks the two authoritative URLs directly) |
| Off-grid exclusion, non-Class-2 handling | UNVERIFIED (implemented per brief instruction; underlying fact not independently confirmed) |
| Legal/consent wording review | IMPLEMENTED BUT REQUIRES EXTERNAL CONFIGURATION (solicitor sign-off) |
| WCAG contrast/screen-reader automated scan | UNVERIFIED (no tool available in this sandbox) |
| Corrected "0420 113 216 / NETCC" audit claim | Confirmed FALSE relative to current repo state — no action taken (nothing to fix) |
