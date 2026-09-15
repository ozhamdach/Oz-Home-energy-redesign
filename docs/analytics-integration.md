# Analytics Integration Plan

**GTM and Meta Pixel are live.** The owner supplied both container IDs
directly (GTM `GTM-KTGM7X5H`, Meta Pixel `1375668011396700`) — installed in
`src/layout.html` (head snippets + the GTM `<body>` `<noscript>`). GA4 and
Google Ads are not separately confirmed; per the guidance below they should
be configured as tags *inside* this GTM container, not installed a second
time as their own scripts.

## What already exists

`src/layout.html` declares `window.dataLayer = window.dataLayer || [];` in
`<head>`, before the GTM container script — standard, Google-recommended
practice for queueing events that fire before or during container load.

`site/js/main.js` and `site/js/commercial-battery-assessment.js` each
define a small `pushEvent(name, data)` helper that pushes
`{ event: name, ...data }` onto `dataLayer` — guarded by `if
(!window.dataLayer) return;`, so removing the declaration above would make
every call a true no-op. The following events already fire:

| Event | Fires when | Data pushed |
|---|---|---|
| `phone_click` | Any `tel:` link is clicked, anywhere on the site | `link_url` |
| `email_click` | Any `mailto:` link is clicked (none published yet — see `docs/owner-inputs-required.md`) | `link_url` |
| `form_start` | First focus into the assessment, service request or project enquiry form | `form_id` |
| `form_step` | Each assessment step shown (including the initial step 1 on load) | `form_id`, `step` |

## What is still deliberately NOT implemented client-side

**No "successful lead" event fires for the HighLevel-embedded forms**
(`/assessment/`, and the homepage quick-quote widget — see
`docs/04-highlevel-integration.md`). Both now use HighLevel's own iframe
widgets, so this site no longer controls the submit itself: HighLevel's
`form_embed.js` handles the POST inside the iframe, cross-origin, and this
build has no confirmed hook (postMessage event or similar) into a
successful-submission signal from it. Firing a `dataLayer` "lead submitted"
event without that confirmation would be guessing, not measuring — don't
add one until HighLevel's actual event contract for these embeds is
confirmed (check their widget docs or a HighLevel workflow/webhook back to
GTM's server-side container, if one exists).

The BESS3/BESS4 commercial battery funnel (`/commercial-battery-assessment/`)
is different: it's a custom-built form, not a HighLevel embed, and already
fires `bess_lead_submitted`/`bess_lead_partial_submitted` into `dataLayer`
and to the Meta Pixel (`site/js/commercial-battery-assessment.js`) — but
only once `window.OHE_BESS_SUBMIT_ADAPTER` is configured with a real
endpoint, which it currently is not in production (see that file's own
comments).

## Integration points still open

| Platform | What's needed |
|---|---|
| **GA4** | Configure as a tag *inside* the existing GTM container (preferred) rather than a second, separate gtag.js install, to avoid double-loading Google's tracking script. |
| **Google Ads** | Conversion tracking tag, also via GTM. Needs a confirmed conversion action; for a true lead conversion, prefer firing it server-side or only after a confirmed HighLevel submission — client-side `submit` on the assessment/quick-quote forms isn't a reliable signal now that they're cross-origin iframes (see above). |
| **HighLevel-embed submission event** | Check whether HighLevel's widget posts a `message` event (or similar) on successful submission that this site could listen for and turn into a `dataLayer` push — needs the actual embed/API docs from the HighLevel account, not guessed. |
| **Quote-request source & service type** | Already captured today: `selected_service` (set from the project-enquiry interest checkboxes or the service-request type dropdown) and the sitewide UTM/`gclid`/`fbclid`/landing-page/referrer attribution fields (`site/js/main.js`'s `captureAttribution`/`populateAttributionFields`). These populate hidden form fields on the project-enquiry and service-request forms today; once those are also wired to a HighLevel embed or a real endpoint, the same values should also be pushed as `dataLayer` event parameters so they appear in GA4/Ads reporting, not just in the HighLevel contact record. |

## Attribution regression on `/assessment/` and the homepage quick-quote form

Swapping those two forms to HighLevel iframes fixed "does it actually
submit" but broke UTM/`gclid`/`fbclid` passthrough: `site/js/main.js`'s
`populateAttributionFields()` fills hidden `input[name="utm_source"]` etc.
fields *on this page's own DOM* — it has no access to write into a
cross-origin iframe's internal form fields. Whatever attribution HighLevel
captures for a submission through these two widgets today is whatever
HighLevel itself detects (its own referrer/UTM handling, if any), not what
this site captured.

HighLevel widgets commonly support passing values into the iframe via URL
query parameters appended to the `src`, which the hosted form can be
configured to read — but doing that here without confirming the specific
form's field mapping in the HighLevel account would be guessing at embed
behavior, which `docs/owner-inputs-required.md` explicitly rules out. Until
someone with HighLevel account access confirms that mapping, treat
attribution on these two forms as **not proven** — the BESS3/BESS4 funnel's
own custom-built form remains the only one with confirmed, tested
first-touch/latest-touch attribution capture end-to-end (see
`docs/08c-v2-deliverables.md`).
