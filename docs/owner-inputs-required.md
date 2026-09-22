# Owner Inputs Required Before Launch

This is the **single master checklist** of everything a person at Oz Home
Energy (or whoever holds the relevant account/credentials) needs to supply,
confirm or decide before this build can honestly be called production-ready.
It supersedes `docs/07-owner-confirmations.md` from the previous pass (kept
for historical detail, but treat this document as current). Nothing below
is published as fact anywhere in this build — confirm the search below
returns nothing:

```
grep -rn "OWNER CONFIRMATION REQUIRED" site --include=*.html
```

## 🔴 Blocking — resolve before any of the below matters

### Phone number conflict — ✅ resolved
Owner-confirmed official number: **0435 336 336** (`tel:+61435336336`). This
has been replaced sitewide, including every `tel:` link, visible phone
number, footer/header CTA, JSON-LD `telephone` field, and legal-page
contact detail — the two earlier, now-superseded numbers (`0420 113 216`,
used throughout the previous passes, and `0435 366 366`, a previously
flagged alternate) no longer appear anywhere in this build.

Still outstanding: confirm the real HighLevel account, Google Business
Profile, and any live ad campaigns show this same number — this repo only
controls the website's own copy.

### NSW Electrical Contractor Licence 382607C — ✅ resolved
Owner-confirmed current and active. Published sitewide (footer, schema,
hero trust strip, About, FAQs, Privacy Policy, Terms) as exactly
**"NSW Electrical Contractor Licence 382607C"** — no personal/individual
name is displayed alongside it anywhere in this build.

### SAA accreditation S5265652 — ✅ confirmed, recorded separately
Owner-confirmed. Recorded as its own distinct credential (About page's
"Licensing & compliance" section) — deliberately not combined into the
same line/string as the electrical contractor licence above, since they're
two separate accreditations.

### 🟠 Licence/SAA number removed sitewide — owner decision, flagged risk
22 Sep 2026: owner asked to remove the licence number (382607C) and SAA
number (S5265652) from display and supplied the real Solar Accreditation
Australia logo to replace the generic icon on that trust card. First
actioned on the homepage only. Owner then separately asked "am i obliged
to put it" — told that the NSW Home Building Act 1989 generally requires
a licensed contractor's licence number to appear in advertising (a
website counts), and that this isn't legal advice, a solicitor/Fair
Trading should be the final word. Owner responded "take it off" — 23 Sep
2026, removed the number sitewide anyway: every page (footers, About,
FAQs, Assessment, Terms, Privacy Policy) and the `hasCredential` entries
in the sitewide Electrician schema (src/layout.html) no longer show
either number. The credential claims themselves (licensed NSW electrical
contractor, SAA accredited) are unchanged — only the specific numbers are
gone. **This was an informed owner decision made after the compliance
risk was explicitly flagged, not a decision made on the owner's behalf.**
If NSW Fair Trading or a solicitor later confirms the number must appear
in advertising, it needs to go back — the licence number itself
(382607C) and SAA number (S5265652) are recorded above in this doc so
nothing is lost.

## Specific claims to confirm (this pass's brief)

None of these are published as superlatives or guarantees — each is
worded as a restrained, factual statement — but every one still needs an
explicit "yes, that's accurate" before launch, not just consistent phrasing:

- [ ] "Assessed by the people who install your system" (homepage proof strip)
- [ ] "One team from the first phone call through commissioning" (if/where used — search before launch)
- [ ] "Direct support after installation" (homepage proof strip)
- [ ] "We check switchboard capacity and wiring before quoting" (if/where used — search before launch)
- [ ] "All electrical work is carried out by licensed electricians" (if/where used — search before launch)
- [ ] Commercial capability across wider NSW (commercial pages' service-area language)
- [x] **Ohme approved installer** — ✅ resolved: confirmed via the 11 Sep 2026 Ohme onboarding call (Julian Coxon) and the owner-supplied badge asset (`assets/original-photography/trust-badges/ohme-approved-installer.jpg`). Enabled on the homepage trust section, the About page, and the EV charging page, scoped to Ohme EV charger installation only (not a general EV-brand claim).
- [ ] **Tesla Certified Installer (Powerwall & Wall Connector)** — **certification itself is now confirmed** (22 Sep 2026): Tesla's own Contracts system (`CLM_PROD@tesla.com`, automated) sent "Fully Executed Document" for the Certified Installer Agreement (AU), Document ID 694645, covering both Powerwall and Home-Charging Equipment (Wall Connector), Services + Purchase & Resale, Territory: Australia. Corroborated by `mofuller@tesla.com`'s same-day "Tesla Certified Installer Final Step" email. This resolves the doubt from the 18 Sep "Onboarding Tasks have not been completed" email and the unsigned company signature block found in the contract PDF on 21 Sep — both are now superseded by actual execution.
  **Still blocked from publishing, for a different and more specific reason**: the executed agreement's Exhibit 3 §10(b) requires Tesla's **prior written consent** before either party "advertise[s] or publicize[s] that the Parties have entered into this Agreement, or use[s] the other Party's name, mark or logo in any document or communication published." A badge — even text-only, no logo — publicizes the relationship and would breach this clause without that separate consent. **This is not my caution, it's the contract terms Oz Home Energy signed.**
  Real, official Tesla marketing assets have since been supplied (22 Sep 2026) — a "Powerwall / Certified Installer" logo lockup and a Powerwall + Wall Connector lifestyle photo, both sourced from Tesla's own "Marketing Links" resource document. That same document states, in Tesla's own words, directly above the asset links: **"Please ensure you email energyproductsmarketing@tesla.com for marketing approval"** — no exception for pre-built vs. custom marketing. The logo has replaced the placeholder asset at `assets/original-photography/trust-badges/tesla-powerwall-certified-installer.png` (confirmed byte-identical to what was already in the repo — the original asset was correct all along); the lifestyle photo is processed and ready at `assets/original-photography/tesla-marketing/`. A fully built trust-section card is commented out at the end of the homepage grid (`src/pages/home/content.html`), ready to uncomment with no further work. Owner has sent a request for that consent to Morris Fuller; his reply pointed to the same Marketing Guidelines/approval-email process rather than granting consent directly. The moment written consent exists, enable immediately as **"Tesla Certified Installer — Powerwall & Wall Connector"** — nothing else needs building.
- [x] **Smart Energy Council — Small Business Member** — ✅ resolved: confirmed via real, ongoing correspondence, not just the supplied badge PDF. `accounts@smartenergy.org.au` "Welcome to Smart Energy Council" and `marcela@smartenergy.org.au` "Welcome Electrical hub! Let's get started with your Small Business Member benefits" (both 1–4 Aug 2026), a paid Stripe receipt ($990, 1 Aug 2026), and active membership correspondence through 20 Sep 2026 (AGM proxy form with member number 2026CS3965610, September member eMagazine). This is Electrical Hub Pty Ltd's real, current, paid membership at the "Small Business Member" tier specifically — not a higher tier. Badge artwork extracted unaltered from the owner-supplied PDF and enabled on the homepage trust section and the About page.
- [ ] **15-Year Workmanship Warranty** — duration and workmanship-only scope are owner-confirmed; badge is built and enabled in preview (homepage, About page `#warranty`), with a minimal factual summary only (no exclusions, start dates, remedies or claim-expense terms invented). All 17 owner decisions in the "OHE 15-Year Workmanship Warranty — Draft Terms" doc are resolved and **the draft is now approved as-is by the owner**, including the correspondence address (69 Esme Ave, Chester Hill NSW 2162 — a street address rather than a PO box, confirmed as a deliberate choice despite the site's general no-street-address policy elsewhere; postcode not independently verified) and a three-tier delivery structure (website: short summary only; customer contract/warranty document: full legally reviewed terms + mandatory ACL wording; handover pack: customer receives the actual document — no public terms page). The About page's warranty summary has been updated in this branch to match the adopted eligibility-scope decision (removed "eligible projects," now "every installation — new system or retrofit, residential or commercial"); the badge caption ("15-Year" / "Workmanship Warranty") needed no change; no further website change is pending. **Still not usable with a customer**: owner approval is not the same as legal sufficiency — a solicitor still needs to review the draft (particularly Section 10's mandatory ACL wording, drafted from training knowledge and cross-checked against search results, not verified character-for-character against the primary ACCC source) before Sections 1–10 become the actual contract/warranty document, and before Section 12's draft contract clause and handover-pack list are applied to the real Sales and Installation Agreement and handover templates (outside this repo). This is a drafting exercise against current ACL/ACCC guidance, not an ACCC-reviewed or ACCC-approved document — no such status exists, and nothing on the site should claim one.
- [ ] Any further accreditation, certification, award, installation count, savings figure — aside from the electrical contractor licence, the owner-confirmed SAA accreditation S5265652, and the three items above, **none are currently published**; this stays true only as long as nothing else is added without going through this checklist first

Where confirmation is absent for any of the above, the current wording
stays as restrained/factual rather than being strengthened — see
`docs/01-audit-and-positioning.md` for the full list of claims deliberately
never invented (NETCC membership, Tesla Certified Installer status,
review totals, installation totals, years in business,
manufacturer partnerships, finance availability, specific rebate amounts,
guaranteed savings/payback, superiority claims, product pricing, client/
project names, workmanship guarantees beyond actual contract terms).

## Lead capture / HighLevel integration checklist

**Current state: no form on this site submits anywhere.** All three lead
forms (`/assessment/`, `/service-request/`, `/commercial-project-enquiry/`)
have no `action` attribute, are fully intercepted by client-side JS, and —
on "submit" — show a plain, non-success notice ("this form isn't connected
yet, please call") rather than any confirmation-style state. See
`docs/04-highlevel-integration.md` for the full field mapping and routing
spec, and `site/js/main.js`/`site/js/assessment.js` for the actual handler
code (search `lead-pending-notice`).

- [ ] **Homepage Quick Free Quote** (verified live-site form ID
      `ILAJCu9qJyVzX582GAtX`, reference only) — this redesign deliberately
      removed the old above-the-fold homepage form (audit finding: it
      suppressed conversion and read as high-pressure) in favour of CTA
      buttons routing into `/assessment/`. **Decide:** is losing a
      standalone homepage quick-quote path acceptable, or should an
      equivalent compact widget be added back? If the latter, supply the
      real HighLevel embed snippet for that form — do not construct one
      from the ID.
- [ ] **Detailed Contact/Quote form** (verified live-site form ID
      `7CTbeFedTXyoPJoS2CmH`, reference only) — this maps most closely to
      the `/assessment/` multi-step flow. Supply either (a) the exact
      HighLevel embed snippet to replace the custom-built form, or (b) a
      secure server-side endpoint to POST this form's fields to (see
      server-side safety requirements in `docs/04-highlevel-integration.md`).
- [ ] **Service Request form** (verified live-site form ID
      `D54fnMMf1LWTXOCNlh28`, reference only) — same decision as above, for
      `/service-request/`.
- [ ] **Commercial project enquiry — no verified form exists.** Do not reuse
      any of the three IDs above for `/commercial-project-enquiry/`.
      Confirm or create a dedicated HighLevel form for this first.
- [ ] Whichever path is chosen, an embed snippet or endpoint URL must never
      be guessed or constructed from a bare form ID — HighLevel's own
      export/embed feature is the only correct source for that markup.
- [ ] No HighLevel API key, private token or webhook secret goes in
      browser-visible JavaScript under any circumstances — see the
      server-side safety requirements already specified in
      `docs/04-highlevel-integration.md`.
- [ ] Confirm end-to-end: a real test submission on each form actually
      lands in the correct HighLevel pipeline with correct tags, before
      claiming any of this "works" — including that UTM/`gclid`/`fbclid`
      attribution survives the real submission (currently only proven up to
      the point of being captured into the form's hidden fields — see
      `docs/analytics-integration.md`).

### Review widget
The homepage now embeds the verified HighLevel review widget
(`https://link.ozhomeenergy.com.au/reputation/widgets/review_widget/iqh8HIe7GtEKNtnlIaho?widgetId=6a98ba1ddb444e2cfc4f0d6f`)
as a lazy-loaded iframe (`site/js/reviews.js`) that only reveals itself once
it actually loads, and fails silently (stays hidden) otherwise. **Confirm
this widget still resolves to the intended review set** and that its
content requires no further sign-off — no review text is hard-coded
anywhere in this repo.

## Legal & business detail

None of the following are invented anywhere in this build; each is either
omitted or worded to avoid needing them until supplied:

- [ ] Registered legal entity name
- [ ] Trading name (if different from the legal entity)
- [ ] ABN
- [ ] Official business email address (none is published anywhere yet —
      phone-only contact until this is supplied; also needed before any
      `mailto:` email-click analytics event has anything to attach to, see
      `docs/analytics-integration.md`)
- [ ] Official phone number (see the blocking conflict above)
- [ ] Postal/business address, if one is meant to be publicly listed
- [ ] Privacy contact (name/role/email for privacy questions or requests)
- [ ] A plain-language description of how HighLevel and GreenSketch process
      personal information, for the Privacy Policy's data-processing section
      (`/privacy-policy/` already names both by role — confirm the
      description is accurate to how they're actually used)
- [ ] File-upload retention policy (bill photos, service-request photos) —
      how long they're kept and where
- [ ] Marketing-consent wording — the exact checkbox/consent language Oz
      Home Energy wants on the three lead forms, ideally reviewed by a
      qualified advisor alongside the solicitor review below
- [ ] Complaints contact and response-time process (`/complaints/`
      currently avoids stating a specific SLA until this is confirmed)

**All legal documents on this site (`/privacy-policy/`, `/terms/`,
`/complaints/`) are structured drafts and must be reviewed by an Australian
solicitor before launch** — none of them should be treated as legally
sufficient as currently written.

## Photography

See `docs/asset-manifest.md` for the full structured manifest (dimensions,
crop, filename, required alt text) and `docs/05-photography-shotlist.md`
for the shoot brief and priority order. Every image slot currently renders
as an on-brand icon panel, never a placeholder box or stock/AI image.

## Publication gates (Projects / Products)

`src/data/site-status.json` controls whether `/projects/` and `/products/`
are indexed and linked from primary navigation in a production build (see
`docs/legacy-url-migration.md`'s sibling mechanism and
`scripts/build.js`'s `publishGate` handling). Both currently read
`"published": false`:

- [ ] **Projects** — needs at least three owner-approved, genuine
      completed-project case studies (property, system installed, design
      decisions, outcome, photography — see `docs/asset-manifest.md` rows
      11–13). Flip `site-status.json`'s `projects.published` to `true` only
      once these exist.
- [ ] **Products** — needs owner-approved brands/models actually supplied,
      with source-confirmed specifications and warranty wording. Flip
      `products.published` to `true` only once these exist.

## Domain / hosting decision

- [ ] Confirm `https://ozhomeenergy.com.au` (apex, no `www`) is and remains
      the production origin — this build's canonicals, Open Graph tags,
      JSON-LD and sitemap all assume this (see
      `docs/legacy-url-migration.md`, §1). If the domain decision changes,
      update `PRODUCTION_ORIGIN` in `scripts/build.js` and the equivalent
      hardcoded values in `src/layout.html`.
- [ ] Confirm final hosting platform (GitHub Pages long-term vs. a host that
      can serve real server-side redirects) — see
      `docs/legacy-url-migration.md` §7 for why this materially affects how
      legacy URLs are handled.
- [ ] Export the full current-site indexed URL list (Search Console → Pages
      report, plus an independent crawl) for any legacy route not already
      covered in `redirects/legacy-routes.json`.
