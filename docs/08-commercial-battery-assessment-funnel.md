# Commercial Battery Assessment Funnel — BESS3/BESS4 (Meta paid traffic)

Design specification for `/commercial-battery-assessment/`, the landing page this
repo builds for Meta paid-social campaigns targeting NSW apartment buildings
(BESS3) and small/medium businesses (BESS4) under the NSW Peak Demand
Reduction Scheme (PDRS). Written before implementation, per the working
brief's Phase 2 requirement. See `docs/08a-bess3-bess4-facts.md` for the
sourced scheme facts this design is built against.

## 0. Why this is a separate page, not a repurposed existing form

`/assessment/` (residential) and `/commercial-project-enquiry/` (general
commercial) already exist and are not replaced. This funnel is deliberately
new because:
- The qualifying question ("apartment with 4+ dwellings" vs "business
  premises") is specific to this scheme and doesn't fit either existing
  form's structure without corrupting their own field sets.
- Paid Meta traffic needs its own landing page so campaign performance
  (bounce, completion rate, cost-per-qualified-lead) can be measured in
  isolation from organic commercial-page traffic.
- The classification labels this scheme requires (`bess3_review_required`,
  `bess4_review_required`, etc.) are specific to this campaign and would be
  meaningless custom fields on the general commercial enquiry.

## 1. Question-decision matrix

Every question below earns its place by changing routing, priority, or the
next action. Anything that doesn't clear that bar is explicitly deferred to
a post-submission follow-up call (listed in §1b), per the brief's
form-friction standard — this is not an oversight, it's the design.

| # | Question | Why it is needed | Branch / CRM action affected | Required now or later |
|---|---|---|---|---|
| 1 | Project location (suburb + postcode) | Confirms NSW (the scheme is NSW-only); postcode outside NSW ranges routes to `outside_campaign_scope` instead of a false "you qualify" | Campaign-scope classification; sales region routing | **Now** |
| 2 | Site type: apartment building (4+ dwellings) / commercial or business premises / a single home | The single largest branch driver — selects the BESS3 vs BESS4 pathway vs "not this campaign" | BESS3/BESS4/out-of-scope classification; which follow-up questions appear next | **Now** |
| 2a | (Apartment branch only) Approx. number of dwellings — banded: 4–9 / 10–24 / 25–49 / 50+ / fewer than 4 | Confirms the BESS3 minimum (4+ dwellings) without demanding an exact count the visitor may not know; "fewer than 4" is a real, valid answer that changes the outcome | If "fewer than 4" selected → `manual_eligibility_review`, not `bess3_review_required` | **Now** |
| 2b | (Apartment branch only) Your role: strata committee / owners corporation member · strata or building manager · resident/owner without formal authority · other | Decision-maker authority changes sales priority and the next follow-up action (a committee member can approve next steps; a resident raising it on their own needs a different, slower next step) | Sales priority tag; next-action tag | **Now** |
| 2c | (Business branch only) Your role: owner/director · facilities or operations manager · consultant/broker acting on their behalf · other | Same reasoning as 2b, for the commercial branch | Sales priority tag; next-action tag | **Now** |
| 2d | (Business branch only) Approximate quarterly electricity bill: under $5,000 / $5,000–$20,000 / $20,000–$50,000 / over $50,000 / not sure | A bill-size band is the one non-technical proxy a business contact can reliably answer for "is this likely BESS4 (small/medium, 20–200kWh) or BESS5 scale (large industrial, >200kWh)" — exact kWh capacity is a design decision made later, not something to ask a lead-gen visitor | "Over $50,000" → `bess5_or_manual_review` (outside this campaign's BESS4 scope, but not a dead end — flagged for specialist follow-up); every other answer, including "not sure" → `bess4_review_required` | **Now** |
| 3 | Existing battery on site? Yes / No / Not sure | Explicitly required by the brief; changes whether the follow-up call is about adding capacity vs a first installation | CRM custom field `has_existing_battery`; follow-up script selection | **Now** |
| 4 | Existing or planned solar? Existing solar / No solar, planning one / No solar, none planned | Explicitly required by the brief; also the ad-content dimension in the acceptance-test URL (`existing_solar_ad`) — this is the field that ad content is meant to pre-qualify against | CRM custom field `solar_status`; used to sanity-check ad-to-answer alignment (see §7) | **Now** |
| 5 | Project timeframe: ASAP / 3–6 months / 6–12 months / just researching | Explicitly required; directly sets sales priority and whether a fast human follow-up is warranted | Sales priority tag; workflow trigger timing | **Now** |
| 6 | Full name, phone, email | Cannot route or contact anyone without it | Contact record fields | **Now** |
| 7 | Consent checkbox (explicit, unticked by default) + captured timestamp | Legal requirement to contact; without it, no lead should be created at all | Blocks submission until checked; `consent_given_at` on the CRM payload | **Now** |

### 1b. Deliberately deferred to post-submission follow-up (not asked here)

Per the brief's friction standard, none of these change the *initial*
routing decision — they refine an already-qualified lead, which is a human
sales conversation's job, not a landing-page form's:

- Exact battery size (kWh) and exact solar system size
- Operating hours / load profile / demand-charge specifics
- Full street address (suburb + postcode is enough to confirm NSW and give
  sales a starting point; the exact site address is a follow-up-call
  question)
- Electricity bill upload
- Exact technical constraints (switchboard capacity, meter type, DNSP)
- Data-centre exclusion check for BESS4 — this is a real exclusion in the
  scheme, but adding a dedicated question for a rare edge case fails the
  "shortest form" standard for negligible routing value: every pathway in
  this funnel already lands on a `_review_required` label, never
  `eligible`, so a genuine data-centre operator is caught at the human
  qualification stage rather than by a fragile self-report checkbox that
  would only be worth adding if it changed the funnel's own eligibility
  claim (it doesn't — the funnel makes no eligibility claim at all).

An unknown/uncertain answer (e.g. "not sure" on solar, battery, or bill
size) never auto-disqualifies — it always still reaches a `_review_required`
outcome, per the brief's explicit instruction.

## 2. Branching table

| Site type | Sub-answer | Classification | Priority signal | Next action |
|---|---|---|---|---|
| Apartment (4+ dwellings) | dwelling band ≥ 4 | `bess3_review_required` | High if role = strata committee/manager; medium if resident | Route to residential/strata sales queue, "BESS3 apartment enquiry" |
| Apartment (4+ dwellings) | dwelling band = "fewer than 4" | `manual_eligibility_review` | Medium | Human confirms actual dwelling count before any scheme-specific pitch |
| Commercial/business premises | bill band ≤ $50,000/quarter or "not sure" | `bess4_review_required` | Set by timeframe answer | Route to commercial sales queue, "BESS4 business enquiry" |
| Commercial/business premises | bill band > $50,000/quarter | `bess5_or_manual_review` | High (large accounts) | Route to commercial sales queue flagged for a specialist/larger-account review, not a standard BESS4 script |
| A single home (not an apartment building, not a business) | — | `outside_campaign_scope` | N/A — not a dead end | UI offers a direct link to the existing residential battery-storage page/assessment instead of submitting this form |
| Any branch | postcode outside NSW ranges | `outside_campaign_scope` | N/A | Lead still captured and tagged, but flagged so sales knows this reached them from an ad that should be geo-restricted |

No branch ever produces a bare `eligible` label — every outcome is a
`_review_required`/`_review` variant, because true PDRS eligibility depends
on facts (exact usable capacity, CEC/product-list status, installer
accreditation, network approval) this short form deliberately does not
collect. Overstating eligibility here would violate priority #1 (factual
accuracy) to chase priority #4 (conversion) — not allowed by this brief's
own priority order.

## 3. CRM payload contract (HighLevel-shaped, per `docs/04-highlevel-integration.md`'s existing field-mapping convention)

```json
{
  "contact": {
    "firstName": "string (from fullName, split)",
    "lastName": "string (from fullName, split)",
    "phone": "string, E.164-normalised where possible",
    "email": "string"
  },
  "customFields": {
    "campaign": "bess3_bess4_launch",
    "site_type": "apartment_4plus | commercial_business | single_home",
    "dwelling_band": "4-9 | 10-24 | 25-49 | 50-plus | under-4 | null",
    "decision_maker_role": "string, options vary by site_type — see §1 rows 2b/2c",
    "bill_band": "under-5k | 5k-20k | 20k-50k | over-50k | not-sure | null",
    "has_existing_battery": "yes | no | not-sure",
    "solar_status": "existing | planned | none",
    "project_timeframe": "asap | 3-6-months | 6-12-months | researching",
    "project_suburb": "string",
    "project_postcode": "string",
    "bess_classification": "bess3_review_required | bess4_review_required | bess5_or_manual_review | manual_eligibility_review | outside_campaign_scope",
    "consent_given_at": "ISO 8601 timestamp, set at the moment the checkbox is ticked, not at submit time"
  },
  "tags": [
    "source:commercial-battery-assessment",
    "campaign:bess3_bess4_launch",
    "classification:<bess_classification value>",
    "priority:<high|medium> (derived from role + timeframe, see §2)"
  ],
  "attribution": {
    "utm_source": "string | null",
    "utm_medium": "string | null",
    "utm_campaign": "string | null",
    "utm_content": "string | null",
    "utm_term": "string | null",
    "campaign_id": "string | null",
    "adset_id": "string | null",
    "ad_id": "string | null",
    "placement": "string | null",
    "gclid": "string | null",
    "fbclid": "string | null",
    "landing_page": "string (URL)",
    "referrer": "string"
  },
  "meta": {
    "submitted_at": "ISO 8601 timestamp, set only on a confirmed-successful submission attempt",
    "form_version": "commercial-battery-assessment-v1"
  }
}
```

Every field above is either a standard HighLevel contact field or a custom
field this document defines — nothing here invents a HighLevel field ID,
since none exist yet (see the blocker in §8). No free-text notes field is
included by default in this payload (there is no open "anything else"
textarea on this form) specifically so priority-8 ("no name, phone, email,
address, bill or notes enter analytics") has nothing ambiguous to leak —
the only place any of this data goes is this payload, sent only to the
configured CRM adapter, never to `dataLayer`/analytics (see §4).

## 4. Attribution contract

Reuses and extends the sitewide capture already implemented in
`site/js/main.js` (`captureAttribution`/`populateAttributionFields`,
first-touch, `sessionStorage`-backed, never overwrites an existing stored
value). This funnel adds four Meta-specific identifiers to the sitewide
allowlist — `campaign_id`, `adset_id`, `ad_id`, `placement` — since they are
plain ad-attribution identifiers, not PII, and are useful on every form on
the site, not just this one.

**Allowlist (only these query parameters are ever captured):**
`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`,
`gclid`, `fbclid`, `campaign_id`, `adset_id`, `ad_id`, `placement` — plus
`landing_page` (the full URL at first touch) and `referrer` (`document.referrer`),
both captured without needing a matching query parameter.

**Everything else in the query string is read by nothing and stored
nowhere.** `URLSearchParams` is only ever queried for the exact keys above;
no wildcard/passthrough capture exists anywhere in this codebase.

## 5. Submission-state diagram

```
[Form idle]
    │ visitor fills fields, conditional sections reveal as answers are given
    ▼
[Consent checked] ──(submit clicked, checkValidity() fails)──▶ [Validation error shown, answers preserved, no submission attempt]
    │ (checkValidity() passes)
    ▼
[Submitting] (button disabled, single in-flight guard set — a second click while
              this state is active is a no-op, not a second request)
    │
    ├──(no submission adapter configured — the real, missing-CRM-endpoint case)──▶
    │        [Honest "not connected yet" notice shown, matches every other form
    │         on this site, in-flight guard cleared, answers stay in the DOM/state
    │         in case the visitor wants to screenshot/copy them before calling]
    │
    ├──(adapter configured, request fails or times out)──▶
    │        [Inline error shown, answers fully preserved (form is NOT cleared
    │         or replaced), in-flight guard cleared so a retry is possible,
    │         no conversion event fires, no redirect]
    │
    └──(adapter configured, request succeeds)──▶
             [Exactly one `bess_lead_submitted` conversion event pushed to
              dataLayer — non-PII payload only — THEN, and only then,
              window.location assigns the thank-you page URL]
                    │
                    ▼
             [Thank-you page loads]
             (fires NOTHING itself — no event, no pixel, no dataLayer push —
              specifically so a refresh, a bookmark, a crawler, or someone
              pasting the URL into a browser never manufactures a second
              conversion; the one true conversion already happened at the
              moment above, client-side, immediately after the confirmed
              success response and before navigation)
```

## 6. Test plan

Mirrors the brief's required end-to-end acceptance test and red-team pass
exactly (see `docs/08b-funnel-test-plan.md` for the full script and, after
execution, the recorded results) — summarised here as the design-time
checklist:

- Allowlisted attribution captured accurately; everything else discarded.
- Correct conditional questions appear per branch (apartment vs business vs
  single-home).
- Hidden/inactive-branch fields never appear in the submitted payload (e.g.
  BESS3 dwelling-band answer must not appear in a BESS4 submission's
  payload, and vice versa).
- Every branch classifies as a `_review_required`/`_review`/`_scope`
  variant, never `eligible`.
- Consent + its timestamp present in the payload.
- No PII (name/phone/email/address/bill/notes) in any `dataLayer` push.
- A failed request preserves all visitor answers (no data loss, no forced
  re-entry).
- A confirmed success fires exactly one conversion event, before redirect.
- Thank-you page reachable only after success, and firing nothing itself on
  direct load or refresh.
- Keyboard-only and screen-reader passes (labels, focus order, error
  announcement via `aria-live`).
- Viewport passes at 320/375/390/430px and desktop.
- No regression to any existing page (nav, other forms, build, QA suite).

## 7. Ad-content/answer alignment (a red-team-informed addition)

The acceptance test's example URL includes `utm_content=existing_solar_ad`
— implying the ad creative told the visitor they already have solar. This
funnel does **not** hard-block or auto-correct a visitor who selects "no
solar, none planned" after clicking that ad (their real situation might
differ from what the ad targeted, and auto-correcting a self-reported
answer against an ad-attribution string would be a worse defect than a
mismatched ad). Instead, the CRM payload's `attribution.utm_content` value
sits alongside `customFields.solar_status` in the same record, so sales can
see and reconcile any mismatch themselves — this is a monitoring signal,
not a form-logic branch.

## 8. Known blocker (per the brief's autonomy rules — reported, not worked around)

**No real HighLevel endpoint or credentials exist for this funnel.** Per
`docs/04-highlevel-integration.md`'s existing, unresolved checklist, this
applies to every form on the site, not just this new one. This funnel's
submission adapter (`site/js/commercial-battery-assessment.js`) is built to
call a pluggable adapter function; in production, with no adapter
configured, it correctly falls back to the same honest "this form isn't
connected yet, please call" notice every other form on the site already
shows — never a fake success. For the required acceptance test, a local
Playwright-injected adapter stands in for the real endpoint (`docs/08b-funnel-test-plan.md`),
satisfying "use a safe local or intercepted CRM destination; do not
transmit test data externally." This is not worked around further because
doing so would require inventing a HighLevel endpoint/credential this
session does not have — exactly the class of blocker the brief says to
report rather than fabricate.
