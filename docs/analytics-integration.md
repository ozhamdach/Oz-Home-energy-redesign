# Analytics Integration Plan (not yet active)

**Nothing in this document is live.** No GTM container, GA4 property,
Google Ads conversion tag or Meta Pixel is installed anywhere in this build.
Do not activate any of them until the owner or Growth Local (whichever
manages the account) confirms the production tracking plan — installing a
tag that duplicates one already live elsewhere is a real, common failure
mode (double-counted conversions, inflated ad-platform reporting), not a
theoretical risk.

## What already exists, safely inert

`src/layout.html` declares `window.dataLayer = window.dataLayer || [];` in
`<head>` — this is standard, Google-recommended practice for queueing
events *before* a Google Tag Manager container script loads, and by itself
it does nothing observable: with no container script installed, nothing
ever reads the array, and nothing is transmitted anywhere. It's the widely
accepted no-cost way to prepare for GTM without installing it yet.

`site/js/main.js` and `site/js/assessment.js` each define a small
`pushEvent(name, data)` helper that pushes
`{ event: name, ...data }` onto `dataLayer` — guarded by `if
(!window.dataLayer) return;`, so removing the declaration above would make
every call a true no-op. The following events already fire:

| Event | Fires when | Data pushed |
|---|---|---|
| `phone_click` | Any `tel:` link is clicked, anywhere on the site | `link_url` |
| `email_click` | Any `mailto:` link is clicked (none published yet — see `docs/owner-inputs-required.md`) | `link_url` |
| `form_start` | First focus into the assessment, service request or project enquiry form | `form_id` |
| `form_step` | Each assessment step shown (including the initial step 1 on load) | `form_id`, `step` |

## What is deliberately NOT implemented client-side

**No "successful lead" event fires anywhere in this codebase.** None of the
three lead forms are connected to HighLevel yet (see
`docs/04-highlevel-integration.md` and `docs/owner-inputs-required.md`) —
firing a "lead submitted" or "conversion" event on a form that has nowhere
to send its data would be actively false telemetry. Once a form is wired to
a real HighLevel endpoint:

- The **correct** place to fire a lead-confirmed event is server-side (the
  secure endpoint fronting HighLevel, or a HighLevel workflow webhook back
  to GTM's server-side container if one exists) — triggered by HighLevel
  actually accepting the submission, not by the browser submitting a form
  that might fail, be spam-filtered, or never arrive.
- If a client-side conversion event is still wanted (e.g. for a Google Ads
  or Meta Pixel conversion tag that can only fire client-side), only add it
  immediately after a confirmed-successful response from the real endpoint
  — never on `submit`, and never in the current preview build, where
  `preventDefault()` always blocks the submission from going anywhere.

## Integration points to configure once the tracking plan is confirmed

| Platform | What's needed before enabling |
|---|---|
| **Google Tag Manager** | A confirmed container ID (`GTM-XXXXXXX`). Insert the real head + body `<noscript>` snippet from Google, replacing the comment in `src/layout.html` — no other code changes needed; the events above already push into `dataLayer`. |
| **GA4** | Configured as a tag *inside* GTM (preferred) rather than a second, separate gtag.js install — confirm this is how it should be wired before adding anything, to avoid double-loading Google's tracking script. |
| **Google Ads** | Conversion tracking tag, also via GTM. Needs a confirmed conversion action and, for a true lead conversion, must fire server-side or only after a confirmed HighLevel submission (see above) — not on client-side form `submit`. |
| **Meta Pixel** | Also installable via GTM (a Meta Pixel tag template) rather than Meta's own base code snippet, to keep one single tag-management surface instead of two. |
| **Quote-request source & service type** | Already captured today: `selected_service` (set from the assessment goal, the project-enquiry interest checkboxes, or the service-request type dropdown) and the sitewide UTM/`gclid`/`fbclid`/landing-page/referrer attribution fields (`site/js/main.js`'s `captureAttribution`/`populateAttributionFields`). These populate hidden form fields today; once GTM/GA4 is installed, the same values should also be pushed as `dataLayer` event parameters so they appear in GA4/Ads reporting, not just in the HighLevel contact record. |

## Before claiming attribution "works"

Per the working brief: **do not claim UTM/`gclid`/`fbclid` attribution
works end-to-end** until a real form submission has been tested and
confirmed to arrive in HighLevel with those values intact. Today this
build only proves the values are *captured and populated into the form
fields* correctly (see `scripts/qa-playwright.js`) — it cannot prove they
survive a real HighLevel submission, because no real submission exists yet.
