# HighLevel Integration Specification

**Update 23 Sep 2026 (launch-readiness repair pass) — all four of this
site's general lead forms are now live HighLevel embeds.** In addition to
`/assessment/` and the homepage quick-quote (already live before this pass),
Commercial Project Enquiry and Service Request have also been switched from
this repo's custom `data-prototype-form` markup to real HighLevel-hosted
form embeds (widget iframes + HighLevel's `form_embed.js`) — form IDs
`UyzHXWGEaLtIQqI9z2kc` and `D54fnMMf1LWTXOCNlh28` respectively. All four now
follow the third path described below (keep the page shell/copy, let
HighLevel's own hosted widget be the form itself), not the webhook/API path.
See `docs/analytics-integration.md`'s "Attribution regression" section for
the real trade-off this introduces on all four forms (this site's own
UTM/`gclid`/`fbclid` capture cannot reach into a same-origin HighLevel
iframe). **None of this has been tested against a live HighLevel account
from this repo's side** — confirming a real submission lands in the correct
pipeline with correct tags is still outstanding for all four, see
`docs/owner-inputs-required.md`.

**Three separate funnels remain genuinely unconnected — not iframe embeds,
not prototypes with a fake success state, but this repo's own HTML/JS with
no CRM endpoint configured at all:** Commercial Load Review
(`/commercial-load-review/`), Commercial Solar & Battery Quote
(`/commercial-solar-battery-quote/`), and Commercial Battery Assessment
(`/commercial-battery-assessment/`). Each shows an honest "not connected
yet — call 0435 336 336" state on submit rather than any success-style
affordance. **Everything below this point (field mapping, pipeline
suggestions, server-side safety requirements) still applies to these three**
— see `docs/owner-inputs-required.md`'s "Lead capture / HighLevel
integration checklist" for their current per-funnel state and what's needed
to reconnect each one, including a webhook-rotation note for Commercial
Load Review and Commercial Solar & Battery Quote (a hardcoded, public
webhook URL that lived in both files' source until this pass was removed,
but should be treated as compromised and rotated on the HighLevel side
regardless).

---

This build is a static front-end prototype (`site/`) for its three
remaining unconnected funnels. Commercial Load Review and Commercial Solar
& Battery Quote use a `LEAD_ENDPOINT` constant left deliberately empty
(`site/js/commercial-load-review.js`, `site/js/commercial-solar-battery-
quote.js`); Commercial Battery Assessment's submit handler
(`site/js/commercial-battery-assessment.js`) likewise has no CRM adapter
configured. All three show an on-page "not connected" notice instead of
posting data. **None has been tested against a live HighLevel account** —
this document specifies exactly what needs to be built, and by whom, to
make them live, following the same approach (options below) or the
iframe-embed approach now used for the site's four general lead forms.

## System of record

**HighLevel is the customer, communications and pipeline system of
record** for every lead this site generates. **GreenSketch only enters the
picture after a lead is qualified** and ready for technical system design,
product selection, pricing or a formal quotation — it is not a lead-capture
tool and should never receive a raw, unqualified form submission directly.

## Forms requiring HighLevel connection

All four of the site's general lead forms are now real HighLevel embeds
(form IDs above); the field set each one captures is whatever's configured
on that form inside HighLevel, not something this repo controls or lists.

The three funnels that still need a HighLevel connection are the
commercial-specific ones, each still this repo's own markup:

| Funnel | Page | Fields captured client-side |
|---|---|---|
| Commercial Load Review | `/commercial-load-review/` | Business/site qualification answers — see `site/js/commercial-load-review.js` for the exact field set; `selected_service`, `submitted_at`, + attribution fields |
| Commercial Solar & Battery Quote | `/commercial-solar-battery-quote/` | Business/site qualification answers — see `site/js/commercial-solar-battery-quote.js`; `selected_service`, `submitted_at`, + attribution fields |
| Commercial Battery Assessment (BESS3/BESS4 pre-screen) | `/commercial-battery-assessment/` | Strata/business classification, site and usage answers — see `site/js/commercial-battery-assessment.js`; `submitted_at` + attribution fields |

`selected_service` and `submitted_at` are populated client-side at submit
time (see `data-service-field` on each `<form>` and the shared handler in
`site/js/main.js`) specifically so HighLevel receives a normalised "what did
they actually ask about" value and an ISO timestamp on every lead, regardless
of which form it came through.

Attribution fields, present on all three forms: `utm_source`, `utm_medium`,
`utm_campaign`, `utm_term`, `utm_content`, `gclid`, `fbclid`, `landing_page`,
`referrer`.

## Recommended implementation approach

Two viable paths — pick based on how much of this front-end Oz Home Energy
wants to keep:

1. **Keep this front-end, embed HighLevel forms via API/webhook.** Replace
   the client-side `data-prototype-form` submit handlers with a `fetch()`
   POST to a HighLevel **Inbound Webhook** (Automation → Workflows →
   "Inbound Webhook" trigger) or the HighLevel **Forms/Contacts API**. This
   preserves the custom multi-step UX exactly as designed.
2. **Rebuild page content inside HighLevel's own Funnel/Website builder**,
   using its native multi-step form element, and re-apply this design
   system as a custom CSS/JS embed. More native to the platform Oz Home
   Energy already uses for CRM, but loses some control over the exact
   step-by-step interaction built here.

Either way, the field mapping, pipeline routing and workflow logic below
apply.

## Field → HighLevel mapping

Map each captured field to a HighLevel **custom field** on the Contact
record (create custom fields for anything not in HighLevel's default
schema — e.g. `property_type`, `has_solar`, `has_battery`, `has_ev`,
`bill_frequency`, `bill_range`, `goal`, `preferred_contact_method`,
`preferred_contact_time`). Map both `billAmountQuarterly` and
`billAmountMonthly` to the same `bill_range` custom field (only one is ever
populated, based on the `billFrequency` answer) rather than creating two
separate CRM fields.
Standard fields (`fullName` → first/last name, `emailAddr` → email,
`phoneNum` → phone, `suburb`/`siteAddress` → address) map to HighLevel's
built-in Contact fields directly.

**File uploads** (`billUpload`, `srPhoto`) — HighLevel forms support native
file upload fields tied to the contact record; if using the webhook
approach instead, files need to be uploaded to storage first (e.g. via
HighLevel's Media Library API) and the resulting URL passed in the webhook
payload, since raw file binaries shouldn't go through a JSON webhook body.

## Pipeline & tagging

Suggested pipeline routing (create these pipelines/stages in HighLevel if
they don't exist):

| Source | Pipeline | Suggested tags |
|---|---|---|
| Assessment — residential goal | Residential Sales Pipeline → "New Enquiry" | `source:assessment`, `goal:<selected goal>`, `residential` |
| Assessment — commercial goal | Commercial Sales Pipeline → "New Enquiry" | `source:assessment`, `commercial` |
| Commercial Project Enquiry | Commercial Sales Pipeline → "New Enquiry" | `source:project-enquiry`, `commercial`, one tag per selected interest (`interest:commercial-solar`, etc.) |
| Service Request | Support/Service Pipeline → "New Request" | `source:service-request`, `type:<srType value>` |

## Workflow triggers (to configure in HighLevel Automation)

- **Assessment submitted** → auto-reply email/SMS confirming receipt +
  internal notification to sales inbox with a summary of answers →
  assign to residential or commercial rep based on `propertyOwner` tag.
- **Commercial Project Enquiry submitted** → internal notification with
  full details, routed to whoever owns commercial sales → no auto-reply
  promising a specific response time unless that SLA is confirmed (see
  `07-owner-confirmations.md`).
- **Service Request submitted** → internal notification to support/service
  team; auto-reply confirming receipt and pointing to the phone number for
  anything urgent.

## Attribution preservation (already implemented client-side)

`site/js/main.js` captures `utm_source`, `utm_medium`, `utm_campaign`,
`utm_term`, `utm_content`, `gclid`, `fbclid`, landing page and referrer into
`sessionStorage` on first page load (first-touch, never overwritten), so a
visitor who lands on a service page from a paid ad and later reaches
`/assessment/` doesn't lose that attribution. `site/js/assessment.js` reads
this back into hidden form fields before submission. **When wiring to
HighLevel**, map these hidden fields to HighLevel's own UTM/attribution
tracking fields (HighLevel captures some of this automatically via its
tracking script — reconcile rather than duplicate once the HighLevel
tracking snippet is installed sitewide).

## Server-side safety requirements (not optional)

None of this exists yet — GitHub Pages is a static host with no backend at
all, so every item below is a requirement for whatever secure
server-side/serverless endpoint eventually fronts these forms, not something
this preview can demonstrate:

- **Server-side validation** — re-validate every field server-side; never
  trust that the browser's `required`/`type="email"` etc. was actually
  enforced (a direct POST to the endpoint bypasses all client-side checks).
- **Spam protection** — a honeypot field and/or a challenge (e.g. Cloudflare
  Turnstile, hCaptcha) before forwarding to HighLevel; a public lead form
  with no protection will attract bot submissions within days of going live.
- **Rate limiting** — per-IP and/or per-session submission limits on the
  endpoint, independent of anything HighLevel itself does downstream.
- **File upload safety** (bill photos, site photos) — enforce a max file
  size and an allow-list of MIME types server-side (not just the `accept`
  attribute, which is a UI hint only and enforces nothing); scan or at
  minimum re-encode uploaded images before they reach any storage HighLevel
  or GreenSketch can read from.
- **No credentials in the browser** — the HighLevel API key/webhook secret
  lives only in the server-side endpoint's environment, never in any file
  this repository ships to a visitor's browser (see the checklist below).

## What must be verified before claiming this "works"

- [ ] A secure server-side/serverless endpoint exists and is what these
      forms actually POST to — GitHub Pages cannot host this itself (see
      "Because GitHub Pages is static" in the working brief this doc was
      written against)
- [ ] Webhook/API credentials configured as environment secrets on that
      endpoint, never hardcoded in front-end JS
- [ ] Server-side validation, spam protection, rate limiting and file-upload
      safety (above) are actually implemented, not just planned
- [ ] Test submission end-to-end for all three unconnected funnels
      (Commercial Load Review, Commercial Solar & Battery Quote, Commercial
      Battery Assessment), confirmed to land in the correct HighLevel
      pipeline with correct tags
- [ ] File upload tested with a real PDF/image bill, once the Commercial
      Load Review bill-upload control is restored (removed 23 Sep 2026
      pending the server-side file-handling requirements above)
- [ ] Auto-reply and internal-notification workflows tested, not just built
- [ ] Consent/privacy checkbox wording finalised by Oz Home Energy /legal
      before the form is used to collect real personal information (see
      `docs/owner-inputs-required.md`)
- [ ] GrowthLocal or any other legacy vendor script fully removed from
      customer-facing pages once HighLevel is the sole lead-capture system
- [x] `/assessment/`, the homepage quick-quote widget, `/commercial-
      project-enquiry/` and `/service-request/` are all real HighLevel
      embeds now, not prototypes — the "design preview" notice was removed
      from all four for that reason
- [ ] Commercial Load Review, Commercial Solar & Battery Quote and
      Commercial Battery Assessment are still unconnected: each must keep
      showing its "not connected yet — call 0435 336 336" notice and must
      not be treated as capable of collecting genuine customer information
      until a secure endpoint is wired up per the requirements above
- [ ] The exposed `services.leadconnectorhq.com` webhook URL that was
      hardcoded in `commercial-load-review.js` and `commercial-solar-
      battery-quote.js` until 23 Sep 2026 should be rotated on the
      HighLevel side — removing it from this repo's source does not
      invalidate it

Nothing above is claimed as working in this build — every integration point
is a specification, not a tested connection.
