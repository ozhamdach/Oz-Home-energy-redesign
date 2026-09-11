# HighLevel Integration Specification

This build is a static front-end prototype (`site/`). No form on it currently
submits anywhere — every form uses `data-prototype-form` (see
`site/js/main.js`) or, for the multi-step assessment, dedicated logic in
`site/js/assessment.js`, both of which show an on-page confirmation instead
of posting data. **Nothing here has been tested against a live HighLevel
account**, because no HighLevel credentials or sub-account access were
available in this session — this document specifies exactly what needs to be
built, and by whom, to make it live.

## Forms requiring HighLevel connection

| Form | Page | Fields captured |
|---|---|---|
| Energy Assessment (multi-step) | `/assessment/` | goal, propertyOwner, suburb, propertyType, hasSolar, hasBattery, hasEv, billAmount, billUpload (file), fullName, phoneNum, emailAddr, contactMethod, contactTime, consent, + attribution fields |
| Commercial Project Enquiry | `/commercial-project-enquiry/` | companyName, contactName, role, email, phone, siteAddress, interest[] (checkboxes), details, + attribution fields |
| Service Request | `/service-request/` | srName, srPhone, srAddress, srType, srDetails, srPhoto (file) |

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
`bill_range`, `goal`, `preferred_contact_method`, `preferred_contact_time`).
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

## What must be verified before claiming this "works"

- [ ] Webhook/API credentials configured as environment secrets, never
      hardcoded in front-end JS (no API key belongs in a static HTML/JS file
      that ships to every visitor's browser)
- [ ] Test submission end-to-end for all three forms, confirmed to land in
      the correct HighLevel pipeline with correct tags
- [ ] File upload tested with a real PDF/image bill
- [ ] Auto-reply and internal-notification workflows tested, not just built
- [ ] Consent/privacy checkbox wording finalised by Oz Home Energy /legal
      before the form is used to collect real personal information (see
      the `[OWNER CONFIRMATION REQUIRED]` notes on each form)
- [ ] GrowthLocal or any other legacy vendor script fully removed from
      customer-facing pages once HighLevel is the sole lead-capture system

Nothing above is claimed as working in this build — every integration point
is a specification, not a tested connection.
