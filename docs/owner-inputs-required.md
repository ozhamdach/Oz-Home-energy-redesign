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

**Correction, 23 Sep 2026 (critical audit repair pass):** the claim above
was not actually true until this pass. `src/layout.html`'s Electrician
schema still listed `"telephone": ["+61435336336", "+61420113216"]` (a
two-element array, not the single confirmed number), and
`src/partials/footer.html` still showed "Alternate phone 0420 113 216" in
the footer-bottom legal line — both were live in every page this build
produced, not just historical leftovers. Both are now fixed to show only
`+61435336336` / `0435 336 336`. Flagging this here rather than quietly
correcting it, since a prior "✅ resolved" note in this same document was
wrong and shouldn't be trusted without re-verifying against the actual
source next time either.

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

**Superseded, 24 Sep 2026 (site-loop skorecard run):** the site-loop skill's
Top 1% Solar Website Scorecard lists a missing footer licence number as
an automatic hard-gate fail. Since this directly conflicted with the
23 Sep removal above, the owner was asked directly rather than either
side being assumed — **owner confirmed: publish it now.** Both numbers
are restored sitewide: `src/partials/footer.html` (footer-brand line and
footer-bottom line), `src/layout.html`'s `hasCredential` schema entries
(now carry an `identifier` field), and the homepage trust-grid cards'
meta lines. The credential claims were never in question — only the
number display changed. This is a current, active owner decision;
nothing further is open on this specific item.

### 🟡 Tesla Powerwall 3 page + battery-storage feature block — built, held back
**24 Sep 2026 (homepage premium badge-grid request):** a task requested
adding a sixth "Tesla Certified Installer" credential card to the
homepage trust grid, framed as a direct owner instruction and explicitly
telling the build not to invent approval metadata (email, number, date).
**This was not implemented.** The instruction not to invent false
approval evidence doesn't supply the actual missing thing: Tesla's own
written consent under Exhibit 3 §10(b) of the executed installer
agreement. A business's own instruction to publish a partner's mark is
not that partner's consent to use it — it isn't this business's mark to
authorise, however the request is scoped or caveated. Nothing was
activated; the grid ships with five credentials (NSW, SAA, SEC, Ohme,
Evnex) instead of six, and the commented-out Tesla card (unchanged) is
still the only implementation, ready to uncomment once genuine written
approval exists. The Tesla Powerwall 3 page, lifestyle photography and
all product/spec/pricing marketing remain withheld exactly as before —
nothing in this pass changed their status.

23 Sep 2026: owner supplied "OHE_Claude_Web_Pack_Under_30MB.zip" — a real,
official-looking asset pack (project photos, brand logo, and two Tesla
Certified Installer SVG badges + two Tesla Powerwall 3 marketing images)
with its own implementation instructions. Its own instructions explicitly
say Tesla marketing approval is still required before publishing new
Tesla marketing treatment — consistent with everything already
established about the Tesla gate (see the homepage trust-section
comment). Non-Tesla parts of the pack (real project photos on
residential-solar, battery-storage, ev-charging, solar-battery-upgrades)
were implemented and are live on staging. The Tesla parts were built in
full but deliberately kept unpublished, the same way the homepage's
Tesla trust card has been handled all along:

- A Tesla Powerwall 3 feature block for `/battery-storage/` is written
  and sitting **commented out** in `src/pages/battery-storage/content.html`
  — ships in the repo, never renders.
- A complete `/tesla-powerwall-3/` page is fully drafted at
  `docs/tesla-powerwall-3-DRAFT/` (content.html + meta.json +
  schema-service.html) — deliberately kept **outside** `src/pages/`, so
  `scripts/build.js` cannot see it and it's structurally impossible for
  it to get built or deployed by accident.
- A trust-card for the homepage's badge grid is also written and
  commented out in `src/pages/home/content.html`, and the EV Wall
  Connector photo that previously rendered live on `/ev-charging/` has
  been removed.
- 23 Sep 2026 (launch-readiness repair pass): the Tesla asset files (two
  certified-installer SVG badges, one Powerwall 3 lifestyle photo, one
  Powerwall 3 product photo) were **moved out of `site/`** entirely, to
  `assets/original-photography/trust-badges/` and
  `assets/original-photography/tesla-marketing/` — a directory
  `scripts/process-photos.py` never reads and `scripts/build.js` never
  publishes. Previously they sat at `site/img/brand/tesla/`, which meant
  they were unreferenced-but-deployed; they are now not deployed at all.
  **This does not make them unrecoverable**: the repository's git history
  (including every earlier commit on this branch) still contains them at
  their old path, and anyone with a clone made while the repository was
  public — or, once private, anyone with repository access — can retrieve
  them regardless of where they currently sit in the working tree. The
  owner has since made this repository private, which stops new public
  clones but does nothing for clones that already exist. Full removal
  from history (a rewrite) was not done in this pass and would need
  explicit sign-off, since it rewrites shared commit history other clones
  may depend on. Separately: stripping HTML comments from the *deployed
  site's* rendered output (see "Public-source safety" below) only stops a
  visitor from reading internal notes via view-source — it does nothing
  for the repository itself. Neither measure alone is a substitute for
  the other; both matter, and neither is complete on its own.
- No numerical Tesla Powerwall 3 specs (capacity, output, price,
  warranty) were written anywhere — none exist in this repo from a
  current, approved Tesla source, so the draft page explicitly omits
  them rather than guessing.

**To activate, once real Tesla written marketing approval exists:**
1. Uncomment the feature block in `src/pages/battery-storage/content.html`
   and the trust-card in `src/pages/home/content.html`.
2. `mv docs/tesla-powerwall-3-DRAFT src/pages/tesla-powerwall-3`.
3. Restore the three Tesla `JOBS` entries in `scripts/process-photos.py`
   (commented explanations mark exactly where) pointing at the archived
   files under `assets/original-photography/`, then run
   `python3 scripts/process-photos.py` to regenerate the derivatives into
   `site/img/photos/`.
4. Run `node scripts/build.js`, confirm QA passes, then commit and push.
5. Add real Powerwall 3 specs to the draft page only once a current,
   approved Tesla source exists — cite that source.

### Public-source safety (what comment-stripping does and doesn't do)
23 Sep 2026 (critical audit repair pass): `scripts/build.js` strips every
HTML comment from a page immediately before writing it to `site/` (see
the "zero HTML comments" check in `scripts/qa-static-checks.js`, which
fails the build if one survives). This stops a visitor from reading
internal notes, evidence trails or disabled draft blocks via
"View Page Source" on the deployed site — that's all it does. It does
**not** protect the repository itself: anyone with repository access
(or, from before it was made private, an existing clone) can still read
every comment in `src/`, every past commit, and every file under
`assets/`. The owner has made this repository private, which stops new
public clones going forward but does nothing to a clone that already
exists. Treat these as two separate, both-necessary measures — comment
stripping for the deployed site, repository access control for the
source — neither is a substitute for the other, and neither is a
complete guarantee by itself.

### ✅ Evnex Certified Installer status — published 24 Sep 2026 on direct owner instruction
**Superseded, 24 Sep 2026:** the owner directly instructed publication of
the Evnex Certified Installer badge and status, supplying a fresh pack
("OHE_Evnex_Claude_Pack_Under_3MB.zip") containing the official badge PNG
(`evnex-certified-installer-white.png`) and its own usage guidelines
(60px minimum height, dark background required, no redraw/recolour, no
invented certification number/expiry/milestone). This is an **owner-
supplied business claim, not independently verified** — no separate
certification number, issue date or expiry was supplied, and none is
shown. The badge is now live: on the homepage trust grid (linking to
`/ev-charging/#evnex`) and on the EV charging page's Evnex section. See
`src/pages/home/content.html` and `src/pages/ev-charging/content.html`
for the exact source comments recording this instruction.

**Superseded again, 24 Sep 2026 (homepage premium badge-grid pass):** the
homepage now uses the official **dark-artwork** variant
(`evnex-installer-dark.png`, from the fuller "OHE_Evnex_Web_Pack_Under_30MB"
pack's `02-Supplied-Badges-and-Logos/` folder, genuinely transparent as
supplied) shown directly against the trust section's light background —
the boxed dark "stage" the white variant needed has been removed
entirely, since it's no longer necessary. Copied unaltered to
`site/img/brand/evnex/evnex-certified-installer-dark.png`; the earlier
white variant is no longer referenced or shipped. Same caveats as above
still apply: owner-supplied claim, no certification number/issue/expiry
shown.

The rest of this section is retained below for history — it recorded why
the badge was withheld before 24 Sep 2026.

23 Sep 2026: owner supplied "OHE_Evnex_Web_Pack_Under_30MB.zip" — Evnex
company/product factsheets (Company, E2 Core AU Trade, E2 Plus AU Trade,
E2 Flex, X22), the Australian residential brochure, the Certified
Installer Badge Guidelines PDF, four supplied installer badge variants,
and web-ready brand/product/app images. A restrained Evnex section was
added to `/ev-charging/` (three images used: a lifestyle photo, an E2
Core/Plus product photo, and an app screenshot showing solar-aware
charging), covering only scheduled charging, home-overload protection,
solar-aware charging and in-app charging-session information — each
attributed to the E2 Core/Plus AU trade factsheets (see the HTML comment
above that section in `src/pages/ev-charging/content.html` for the exact
per-claim sourcing).

**Possession of the supplied pack does not establish that Oz Home Energy
currently holds Evnex Certified Installer status** — the pack's own
README-FIRST.txt says so explicitly, and no separate confirmation of
current certification appeared anywhere in the task or this session. So
none of the following were published:
- The Evnex Certified Installer badge (four variants supplied at
  `02-Supplied-Badges-and-Logos/` in the source pack — not committed to
  this repo, since they're not currently usable).
- The phrase "Certified Evnex Installer" or any equivalent certification
  claim.

Also not claimed anywhere, consistent with the source pack's own
caveats: current model stock/availability, current pricing (the E2 Flex
factsheet's $349 solar-upgrade fee, in particular, is not repeated
anywhere public), and vehicle compatibility.

**Done, 24 Sep 2026** — the steps below (written before activation) are
kept for reference; the white badge variant is what was actually supplied
and used.

To activate the badge, once real Evnex Certified Installer status is
confirmed: copy the appropriate badge variant (Pine/Lichen/Dark/White —
picked for contrast against its background, per the guidelines PDF) into
`site/img/brand/evnex/`, unaltered; display it at a minimum 60px screen
height with the specified clear space (2× the Evnex wordmark height
inside the badge); keep the Oz Home Energy logo dominant if co-branding
(badge at 40–60% of the OHE logo's height, at least 2× the badge's width
between the two marks, OHE logo first in a horizontal layout); never
redraw, recolour or combine the two marks into a new lockup. Full detail
in `01-Australian-Source-Documents/Evnex-Certified-Installer-Badge-
Guidelines.pdf` in the original source pack (not committed to this repo
— ask the owner for the pack again if it's needed at that point, or
request an updated badge file from `marketing@evnex.com` per the
guidelines PDF).

The source pack's PDFs and unused images were not committed to this
public repository, per its own "do not upload the full source pack"
instruction — only the three web-ready images actually used on
`/ev-charging/` were copied in.

## Specific claims to confirm (this pass's brief)

None of these are published as superlatives or guarantees — each is
worded as a restrained, factual statement — but every one still needs an
explicit "yes, that's accurate" before launch, not just consistent phrasing:

- [x] **"Assessed by the people who install your system"** — 23 Sep 2026:
      removed from the homepage proof strip rather than confirmed. It was
      never substantiated, so it no longer appears anywhere in the build.
- [x] **"One team from the first phone call through commissioning"** —
      23 Sep 2026: removed. The About page's "Support from enquiry through
      commissioning and beyond" card now reads "We stay involved through
      design, installation, commissioning and any servicing or support
      requests afterwards" — dropped the "one team" framing rather than
      confirming it, since whether the same people/team handle every stage
      wasn't confirmed.
- [x] **"Direct support after installation"** — 23 Sep 2026: removed from
      the homepage proof strip, same reasoning as above.
- [ ] "We check switchboard capacity and wiring before quoting" (if/where used — search before launch)
- [x] **"All electrical work is carried out by licensed electricians ... with
      compliance documentation provided"** — 23 Sep 2026: removed from the
      About page's licensing section. The confirmed NSW Electrical
      Contractor Licence statement is unchanged and still published; only
      this broader, unconfirmed sentence about every job's electricians and
      paperwork was taken out.
- [x] **Commercial/residential capability across "wider NSW"** — 23 Sep
      2026: removed rather than confirmed. Public service-area copy
      (footer, About, Locations, FAQs, and the commercial-solar/
      commercial-batteries/commercial-electrical/commercial-ev-charging
      page titles and descriptions) was first limited to Sydney/Greater
      Sydney. **Superseded, same day, corrective pass:** owner has since
      confirmed Sydney, NSW specifically, without a Greater Sydney
      boundary — every occurrence of "Greater Sydney" was removed from
      visible copy, metadata and schema (`areaServed` is now `{"@type":
      "City", "name": "Sydney"}` only, sitewide). See "Legal & business
      detail" below for the current confirmed/unresolved split. Locations'
      wider-area content was removed and left as an explanatory HTML
      comment rather than deleted outright, so it's easy to restore once a
      real service-boundary policy is supplied — no such policy exists
      yet.
- [x] **Ohme approved installer** — ✅ resolved: confirmed via the 11 Sep 2026 Ohme onboarding call (Julian Coxon) and the owner-supplied badge asset (`assets/original-photography/trust-badges/ohme-approved-installer.jpg`). Enabled on the homepage trust section, the About page, and the EV charging page, scoped to Ohme EV charger installation only (not a general EV-brand claim).
- [ ] **Tesla Certified Installer (Powerwall & Wall Connector)** — **certification itself is now confirmed** (22 Sep 2026): Tesla's own Contracts system (`CLM_PROD@tesla.com`, automated) sent "Fully Executed Document" for the Certified Installer Agreement (AU), Document ID 694645, covering both Powerwall and Home-Charging Equipment (Wall Connector), Services + Purchase & Resale, Territory: Australia. Corroborated by `mofuller@tesla.com`'s same-day "Tesla Certified Installer Final Step" email. This resolves the doubt from the 18 Sep "Onboarding Tasks have not been completed" email and the unsigned company signature block found in the contract PDF on 21 Sep — both are now superseded by actual execution.
  **Still blocked from publishing, for a different and more specific reason**: the executed agreement's Exhibit 3 §10(b) requires Tesla's **prior written consent** before either party "advertise[s] or publicize[s] that the Parties have entered into this Agreement, or use[s] the other Party's name, mark or logo in any document or communication published." A badge — even text-only, no logo — publicizes the relationship and would breach this clause without that separate consent. **This is not my caution, it's the contract terms Oz Home Energy signed.**
  Real, official Tesla marketing assets have since been supplied (22 Sep 2026) — a "Powerwall / Certified Installer" logo lockup and a Powerwall + Wall Connector lifestyle photo, both sourced from Tesla's own "Marketing Links" resource document. That same document states, in Tesla's own words, directly above the asset links: **"Please ensure you email energyproductsmarketing@tesla.com for marketing approval"** — no exception for pre-built vs. custom marketing. The logo has replaced the placeholder asset at `assets/original-photography/trust-badges/tesla-powerwall-certified-installer.png` (confirmed byte-identical to what was already in the repo — the original asset was correct all along); the lifestyle photo is processed and ready at `assets/original-photography/tesla-marketing/`. A fully built trust-section card is commented out at the end of the homepage grid (`src/pages/home/content.html`), ready to uncomment with no further work. Owner has sent a request for that consent to Morris Fuller; his reply pointed to the same Marketing Guidelines/approval-email process rather than granting consent directly. The moment written consent exists, enable immediately as **"Tesla Certified Installer — Powerwall & Wall Connector"** — nothing else needs building.
  **24 Sep 2026 (site-loop, Home round 2):** owner supplied a list of
  battery brands installed that included Tesla, for the homepage's
  "brands we install" sentence — plain text, no badge or logo. Left out
  for the same reason as the badge above: naming Tesla in that sentence is
  still "publicizing" the relationship under Exhibit 3 §10(b), which needs
  the same written consent this section already establishes doesn't exist
  yet. The other four battery brands supplied (FoxESS, Sungrow, Sigenergy,
  GoodWe) were added; nothing Tesla-specific changed.
- [ ] **Founder photo + story** — **partially resolved, 24 Sep 2026 (site-loop, Home round 3):** owner supplied the founder's story directly in chat, verbatim, no rewriting beyond paragraph breaks. Added as a new `#founder` section on the About page (`src/pages/about/content.html`) and a short excerpt + link on the homepage (`src/pages/home/content.html`). **Still open: no photo has been supplied.** Both sections are text-only by design — no stock or placeholder photo was used — pending a real photo of Oz. Add it to `src/pages/about/content.html`'s `#founder` section (and optionally the homepage excerpt) once supplied.
- [x] **Live Google rating + review count strip** — **resolved by owner decision, 24 Sep 2026 (site-loop, Home round 4):** owner supplied a Google Business Profile link and, once told this environment couldn't reach it, confirmed the actual count directly: **6 reviews**. Owner's call: a standalone "★ rating (6 reviews)" strip near the hero would read as thin next to competitors showing hundreds, so it's deliberately **not** being added right now. The existing genuine HighLevel review widget further down the homepage (`#reviewsSection`) already shows real review content and stays as the page's proof mechanism. This is a closed decision, not an open gap — revisit once the review count is one the owner wants to headline.
- [x] **Smart Energy Council — Small Business Member** — ✅ resolved: confirmed via real, ongoing correspondence, not just the supplied badge PDF. `accounts@smartenergy.org.au` "Welcome to Smart Energy Council" and `marcela@smartenergy.org.au` "Welcome Electrical hub! Let's get started with your Small Business Member benefits" (both 1–4 Aug 2026), a paid Stripe receipt ($990, 1 Aug 2026), and active membership correspondence through 20 Sep 2026 (AGM proxy form with member number 2026CS3965610, September member eMagazine). This is Electrical Hub Pty Ltd's real, current, paid membership at the "Small Business Member" tier specifically — not a higher tier. Badge artwork extracted unaltered from the owner-supplied PDF and enabled on the homepage trust section and the About page.
- [x] **15-Year Workmanship Warranty** — **Superseded, 24 Sep 2026: restored
      to the public build on direct owner instruction.** The homepage
      hero-trust line, the homepage trust-card, the About page's
      `#warranty` section and the FAQ answer all state the claim again —
      see `src/pages/home/content.html`, `src/pages/about/content.html`
      and `src/pages/faqs/content.html`. This is an **owner-supplied
      business claim, not independently verified, solicitor-reviewed,
      ACCC-approved or government-endorsed.** Duration and workmanship-only
      scope were already owner-confirmed, and all 17 owner decisions in the
      "OHE 15-Year Workmanship Warranty — Draft Terms" doc were resolved
      with the draft approved as-is by the owner (including the
      correspondence address 69 Esme Ave, Chester Hill NSW 2162, and the
      three-tier delivery structure: website summary / full contract terms
      / handover pack document) — but owner sign-off on the wording is
      **still not the same as solicitor review having happened**, and
      nothing currently obligates Oz Home Energy to honour this warranty in
      a real customer contract until that review is done and the terms are
      in the actual Sales and Installation Agreement.
      **Remains blocking as a production-launch item, restoration
      notwithstanding**: a solicitor still needs to review the draft
      (particularly Section 10's mandatory ACL wording, drafted from
      training knowledge and cross-checked against search results, not
      verified character-for-character against the primary ACCC source)
      before Sections 1–10 become the actual contract/warranty document,
      and before Section 12's draft contract clause and handover-pack list
      are applied to the real Sales and Installation Agreement and handover
      templates (outside this repo). This is a drafting exercise against
      current ACL/ACCC guidance, not an ACCC-reviewed or ACCC-approved
      document — no such status exists, and nothing on the site claims one.
      The public copy on every page carrying this claim states only that
      it covers Oz Home Energy's own installation workmanship, that
      manufacturer product warranties are separate, and that nothing in it
      limits Australian Consumer Law rights — it does not describe the
      warranty as verified, reviewed or endorsed by anyone. **The site must
      not be described as launch-ready on the strength of this visual work
      alone** — the solicitor review and real-contract alignment above are
      still open.
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

**Current state (updated 23 Sep 2026, launch-readiness repair pass) — four
forms are live HighLevel embeds, three funnels are not connected to
anything.**

### Live — real HighLevel iframe embeds (`form_embed.js`)

These four forms are HighLevel's own hosted widgets embedded via iframe,
not this repo's custom-built markup — submissions go directly to
HighLevel, this repo never sees the data:

- [ ] **Homepage Quick Free Quote** — form ID `ILAJCu9qJyVzX582GAtX`.
- [ ] **Energy Assessment / Detailed Contact-Quote form** —
      `/assessment/`, form ID `7CTbeFedTXyoPJoS2CmH`.
- [ ] **Commercial Project Enquiry** — `/commercial-project-enquiry/`,
      form ID `UyzHXWGEaLtIQqI9z2kc`.
- [ ] **Service Request** — `/service-request/`, form ID
      `D54fnMMf1LWTXOCNlh28`.

For all four: confirm a real test submission actually lands in the
correct HighLevel pipeline with correct tags before relying on any of
this — this repo can confirm the widget loads and renders, not that
HighLevel's own pipeline/workflow routing behind it is configured
correctly. Note also (see `docs/analytics-integration.md`, "Attribution
regression") that this site's own UTM/`gclid`/`fbclid` capture does not
reach these four forms, since HighLevel's hosted widget is a same-origin
iframe this repo's JS cannot read into or populate.

### Not connected — custom-built funnels with no CRM endpoint configured

These three funnels are this repo's own HTML/JS, not HighLevel embeds.
None of them currently submit anywhere:

- [ ] **Commercial Load Review** (`/commercial-load-review/`) and
      **Commercial Solar & Battery Quote** (`/commercial-solar-battery-quote/`)
      — as of 23 Sep 2026 these no longer point at any webhook at all
      (see "Webhook rotation" below for why). `site/js/commercial-load-
      review.js` and `site/js/commercial-solar-battery-quote.js` both set
      `LEAD_ENDPOINT = ''`; on submit, the form is hidden and an honest
      "not connected yet — call 0435 336 336" panel (`#clrNotConnected` /
      `#csbqNotConnected`) is shown instead, with no fake success state.
      The bill-upload control was also removed from Commercial Load
      Review's confirmation step pending the server-side file-handling
      requirements below. Both pages carry `noindex` (they're mid-funnel
      qualification tools, not indexable content) until this is resolved.
      **To reconnect**: build the secure server-side endpoint described in
      `docs/04-highlevel-integration.md`'s "Server-side safety
      requirements", set `LEAD_ENDPOINT` to it in both files, and restore
      the bill-upload control only once that endpoint enforces MIME
      validation, file-size limits, malware handling, rate limiting,
      anti-bot protection and a defined retention/deletion policy for
      uploaded files — none of that exists yet.
- [ ] **Commercial Battery Assessment** (`/commercial-battery-assessment/`)
      — a separate funnel (BESS3/BESS4 PDRS pre-screening), also with no
      CRM adapter configured (`site/js/commercial-battery-assessment.js`
      ships with no HighLevel endpoint/credentials — see the comment above
      its submit handler). Gated via `src/data/site-status.json`'s
      `commercialBatteryAssessment` entry (`published: false`), which
      keeps the page `noindex, follow` and out of the sitemap in a
      production build even though it's directly reachable. **To publish**:
      connect a secure CRM submission endpoint, run a complete end-to-end
      lead test, then flip `commercialBatteryAssessment.published` to
      `true` in `site-status.json`.

### Webhook rotation — action needed regardless of the above

Until 23 Sep 2026, `commercial-load-review.js` and
`commercial-solar-battery-quote.js` both contained a hardcoded, working
`https://services.leadconnectorhq.com/...` webhook URL, visible to anyone
who opened browser dev tools or viewed source on either page. It has been
removed from both files (replaced with the empty `LEAD_ENDPOINT` above),
but **the URL itself was live and public for however long it was
deployed** — it should be treated as compromised. **Ask whoever manages
the HighLevel account to rotate/regenerate that inbound webhook**, since
removing it from this repo's source does not invalidate the URL on
HighLevel's side.

### General

- [ ] Whichever path is chosen for the three unconnected funnels, an embed
      snippet or endpoint URL must never be guessed or constructed from a
      bare form ID — HighLevel's own export/embed feature (for an iframe
      embed) or a real, generated inbound-webhook URL (for a server-side
      endpoint) are the only correct sources.
- [ ] No HighLevel API key, private token or webhook secret goes in
      browser-visible JavaScript under any circumstances — see the
      server-side safety requirements already specified in
      `docs/04-highlevel-integration.md`. (This is exactly the mistake the
      webhook rotation above is fixing — don't reintroduce it.)

### Review widget
The homepage now embeds the verified HighLevel review widget
(`https://link.ozhomeenergy.com.au/reputation/widgets/review_widget/iqh8HIe7GtEKNtnlIaho?widgetId=6a98ba1ddb444e2cfc4f0d6f`)
as a lazy-loaded iframe (`site/js/reviews.js`) that only reveals itself once
it actually loads, and fails silently (stays hidden) otherwise. **Confirm
this widget still resolves to the intended review set** and that its
content requires no further sign-off — no review text is hard-coded
anywhere in this repo.

## Legal & business detail

**Update, 23 Sep 2026 (corrective pass on the critical audit repair):**
the owner has now explicitly confirmed the core business identity
details below — this supersedes the previous "published but not
confirmed" framing for these specific items.

### ✅ Confirmed by the owner
- **Registered legal entity / trading name**: Electrical Hub Pty Ltd,
  trading as Oz Home Energy. Published in the footer on every page, the
  sitewide Electrician JSON-LD schema (`legalName`), Privacy Policy and
  Terms.
- **ABN**: **72 665 477 556** — independently verified by the owner
  against the Australian Business Register as active for Electrical Hub
  Pty Ltd. Published in the footer, JSON-LD `taxID`, Privacy Policy and
  Terms.
- **Website phone number**: **0435 336 336** / `+61435336336` — the only
  number published anywhere on the site (see the phone/NAP conflict
  history above).
- **Geographic wording**: Sydney, NSW. Public copy, metadata and schema
  are now limited to this — no "Greater Sydney" boundary or suburb list
  is published pending a separate owner-approved boundary.
- **Business type**: strictly a service-area business, with no
  customer-facing street address or shopfront implied anywhere. No
  `address` object exists in the sitewide schema.

### 🔴 Still unresolved
- **Contact email addresses**: neither `admin@ozhomeenergy.com.au` nor
  `support@ozhomeenergy.com.au` has been owner-confirmed as a real,
  monitored inbox. **Removed from all rendered output** (footer, JSON-LD
  `email`, Privacy Policy, Terms, Complaints, About) as of this corrective
  pass — `scripts/qa-static-checks.js` now fails the build if either
  address reappears in generated HTML. Phone and
  `/service-request/` are the only confirmed contact paths until this is
  resolved. Listed here only as unconfirmed candidates, not published:
  `admin@ozhomeenergy.com.au`, `support@ozhomeenergy.com.au`. Also
  affects the `mailto:` email-click analytics event, which currently has
  nothing to attach to (see `docs/analytics-integration.md`).
- **Exact service boundary beyond Sydney** — no approved Greater Sydney
  (or other) boundary exists; do not reintroduce one without owner
  sign-off.
- **Suburb list** — none supplied; do not create suburb pages or a
  suburb chip grid without one.
- **Google Business Profile URL and NAP alignment** — not supplied; the
  site's own NAP (name/address/phone) is now internally consistent, but
  hasn't been checked against GBP, HighLevel, or any live ad campaign.
- **Tesla marketing approval** — see the Tesla section above.
- **Evnex Certified Installer status — independent confirmation** — the
  badge and status are now published (24 Sep 2026, direct owner
  instruction) but this is an owner-supplied claim, not independently
  verified; no certification number, issue date or expiry exists in this
  repo. See the Evnex section above.
- **15-year workmanship warranty — solicitor review and real-contract
  alignment** — the claim is now published (24 Sep 2026, direct owner
  instruction) but solicitor review has not happened and the terms are
  not yet in the actual Sales and Installation Agreement; see the
  warranty entry above. Restoring the public claim does not resolve this
  item — it remains a production-launch blocker.
- **Privacy Policy / Terms / Complaints legal review** — all three remain
  structured drafts, not reviewed legal documents. **All must be reviewed
  by an Australian solicitor before launch.**
- **GTM/Meta Pixel privacy approval** — `ENABLE_ANALYTICS` must stay
  unset until the privacy disclosure covering this data collection is
  reviewed and approved; see the Analytics section below.
- **All form-to-CRM delivery tests** — none of the 4 live HighLevel
  embeds nor the 3 unconnected commercial funnels has a confirmed,
  traced, real end-to-end test submission; see the Lead Capture section
  above.
- **The licence-number advertising issue** — the NSW Home Building Act
  1989 generally requires a licensed contractor's licence number to
  appear in advertising; the owner has explicitly instructed that the
  number (382607C) and the SAA number (S5265652) **not** be rendered on
  the site in this pass. This is a **known, deliberately accepted
  compliance risk**, not an oversight — it stays open until NSW Fair
  Trading or a solicitor gives a final answer. See the licence/SAA entry
  above for the full history of this decision.
- Postal/business address (a street address is explicitly out of scope —
  see "Business type" above; this item is only about whether a PO box or
  similar is ever wanted, which hasn't been asked for)
- Privacy contact (name/role for privacy questions or requests, separate
  from the general contact-email question above)
- A plain-language description of how HighLevel and GreenSketch process
  personal information, for the Privacy Policy's data-processing section
- File-upload retention policy (bill photos, service-request photos)
- Marketing-consent wording for the lead forms
- Complaints contact and response-time process (`/complaints/` avoids
  stating a specific SLA until this is confirmed)

**Do not describe this site as launch-ready** — confirming the identity
details above closes some real gaps, but every item in the unresolved
list still blocks it. See `docs/launch-readiness-2026-09-23.md`.

## Photography

See `docs/asset-manifest.md` for the full structured manifest (dimensions,
crop, filename, required alt text) and `docs/05-photography-shotlist.md`
for the shoot brief and priority order. Every image slot currently renders
as an on-brand icon panel, never a placeholder box or stock/AI image.

## Publication gates (Projects / Products / Commercial Battery Assessment)

`src/data/site-status.json` controls whether a page is indexed and linked
from primary navigation in a production build (see
`docs/legacy-url-migration.md`'s sibling mechanism and
`scripts/build.js`'s `publishGate` handling). All three currently read
`"published": false`:

- [ ] **Projects** — needs at least three owner-approved, genuine
      completed-project case studies (property, system installed, design
      decisions, outcome, photography — see `docs/asset-manifest.md` rows
      11–13). Flip `site-status.json`'s `projects.published` to `true` only
      once these exist.
- [ ] **Products** — needs owner-approved brands/models actually supplied,
      with source-confirmed specifications and warranty wording. Flip
      `products.published` to `true` only once these exist.
- [ ] **Commercial Battery Assessment** (added 23 Sep 2026) — needs a
      secure CRM submission endpoint connected and a complete end-to-end
      lead test passed (see the lead-capture checklist above). Flip
      `commercialBatteryAssessment.published` to `true` only once that's
      done. Until then the page stays `noindex, follow` and out of the
      sitemap in production, even though it's directly reachable by URL.

## Analytics — staging vs. production

23 Sep 2026 (launch-readiness repair pass): Google Tag Manager and the
Meta Pixel loader were moved out of the unconditional `src/layout.html`
(where every build, preview included, was loading them) into two new
partials, `src/partials/analytics-head.html` and
`src/partials/analytics-body.html`, which `scripts/build.js` only injects
when `BUILD_TARGET=production`. The GitHub Pages preview this branch
deploys to is always built without `BUILD_TARGET=production`, so it now
requests nothing from `googletagmanager.com` or `connect.facebook.net` —
previously the preview (and anyone testing it) was silently feeding real
analytics/ad platforms unfiltered preview traffic.

**Update, 23 Sep 2026 (critical audit repair pass): a production build
alone is no longer sufficient to load analytics.** `scripts/build.js` now
requires a second, separate environment variable —
**`ENABLE_ANALYTICS=true`** — alongside `BUILD_TARGET=production` before
GTM/Pixel are injected (`ANALYTICS_ENABLED = IS_PRODUCTION &&
process.env.ENABLE_ANALYTICS === 'true'`). Build-mode and privacy consent
are deliberately two separate decisions: a `BUILD_TARGET=production` build
run for any other reason (a QA check, a preview of production behaviour,
a deploy pipeline test) must not silently start loading real tracking
scripts. **`ENABLE_ANALYTICS` must stay unset (or anything other than the
literal string `true`) until the GTM/Meta Pixel data collection has been
covered by a reviewed and approved privacy disclosure** — no privacy-
policy wording for this has been drafted or invented in this repo; that
review has to happen first, by whoever is qualified to do it, not by
flipping this flag. `scripts/qa-static-checks.js` was updated to match:
it only expects analytics when run with `ENABLE_ANALYTICS=true` itself
(the same variable must be passed to both the build and the QA check for
the assertion to mean anything); otherwise — preview, or a production
build without the flag — it asserts zero analytics network calls, exactly
as before. See `docs/analytics-integration.md` for the underlying
GTM/Pixel IDs and setup.

- [ ] Confirm the GTM container and Meta Pixel IDs currently in
      `src/partials/analytics-head.html` are the correct, current ones —
      they were carried over unchanged from the previous pass's setup.
- [ ] No analytics/ad-platform request should ever appear on the GitHub
      Pages preview going forward — if this regresses, check that whatever
      changed `src/layout.html` still gates `{{ANALYTICS_HEAD}}` /
      `{{ANALYTICS_BODY}}` on `ANALYTICS_ENABLED` rather than injecting
      whenever `BUILD_TARGET=production` alone is set.
- [ ] Get the privacy disclosure covering GTM/Meta Pixel data collection
      reviewed and approved before ever setting `ENABLE_ANALYTICS=true`
      on a real production deploy — this is a blocking item in
      `docs/launch-readiness-2026-09-23.md`, not a flag to flip casually.

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
