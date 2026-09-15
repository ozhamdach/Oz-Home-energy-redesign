# HighLevel Integration Specification

**Update — `/assessment/` and the homepage quick-quote are now live.** The
owner supplied real HighLevel-hosted form embeds (widget iframes + HighLevel's
`form_embed.js`) for both, replacing this repo's custom-built prototype forms
on those two pages entirely — this is a third path beyond the two originally
outlined below: keep the page shell/copy, but let HighLevel's own hosted
widget be the form itself, rather than building a custom UI that POSTs to a
webhook/API. See `docs/analytics-integration.md`'s "Attribution regression"
section for the real trade-off this introduced (this site's UTM/`gclid`
capture no longer reaches these two forms). **Everything below this point
still applies unchanged to the two forms that remain unwired prototypes:
Commercial Project Enquiry and Service Request.**

---

This build is a static front-end prototype (`site/`) for its remaining
unwired forms. Commercial Project Enquiry and Service Request still use
`data-prototype-form` (see `site/js/main.js`), which shows an on-page
confirmation instead of posting data. **Neither has been tested against a
live HighLevel account** — this document specifies exactly what needs to be
built, and by whom, to make them live, following the same approach (options
below) or the iframe-embed approach now used for the other two forms.

## System of record

**HighLevel is the customer, communications and pipeline system of
record** for every lead this site generates. **GreenSketch only enters the
picture after a lead is qualified** and ready for technical system design,
product selection, pricing or a formal quotation — it is not a lead-capture
tool and should never receive a raw, unqualified form submission directly.

## Forms requiring HighLevel connection

All three forms now capture the same attribution field set consistently
(this was inconsistent before this pass — assessment had it, the other two
didn't; fixed by generalising the capture/populate logic in `site/js/main.js`
so it works by field `name` on any form, not just the assessment page).

| Form | Page | Fields captured |
|---|---|---|
| Energy Assessment ("Request a Quote") | `/assessment/` | **Now a real HighLevel embed (form ID `7CTbeFedTXyoPJoS2CmH`)** — field set is whatever's configured on that form inside HighLevel, not this table; the columns below describe the retired custom-built version for reference only. |
| Commercial Project Enquiry | `/commercial-project-enquiry/` | companyName, contactName, role, email, phone, siteAddress, interest[] (checkboxes), details, selected_service, submitted_at, + attribution fields |
| Service Request | `/service-request/` | srName, srPhone, srAddress, srType, srDetails, srPhoto (file), selected_service, submitted_at, + attribution fields |

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
- [ ] Test submission end-to-end for all three forms, confirmed to land in
      the correct HighLevel pipeline with correct tags
- [ ] File upload tested with a real PDF/image bill
- [ ] Auto-reply and internal-notification workflows tested, not just built
- [ ] Consent/privacy checkbox wording finalised by Oz Home Energy /legal
      before the form is used to collect real personal information (see
      `07-owner-confirmations.md`)
- [ ] GrowthLocal or any other legacy vendor script fully removed from
      customer-facing pages once HighLevel is the sole lead-capture system
- [x] `/assessment/` and the homepage quick-quote widget are real HighLevel
      embeds now, not prototypes — the "design preview" notice was removed
      from `/assessment/` for that reason
- [ ] Commercial Project Enquiry and Service Request are still prototypes:
      the GitHub Pages preview must keep showing their "this is a design
      preview" notice and must not be treated as capable of collecting
      genuine customer information until they're wired up the same way

Nothing above is claimed as working in this build — every integration point
is a specification, not a tested connection.
