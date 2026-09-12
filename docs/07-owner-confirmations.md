# Master List — Everything Requiring Owner Confirmation Before Publishing

**Superseded by `docs/owner-inputs-required.md`.** That document is now the
current, maintained master checklist (it folds in this pass's additional
claims, the HighLevel integration checklist, and the legal/business detail
list). This file is kept for the detailed historical audit context below,
but treat the newer document as authoritative for what's still outstanding.

Nothing on this list is published as fact anywhere in this build. Search the
built site for any stray marker with:
`grep -rn "OWNER CONFIRMATION REQUIRED" site --include=*.html` — this should
return nothing (only HTML comments, invisible to users, may reference this
doc). If it returns visible page text, that's a bug — file it.

## ✅ Phone number conflict — resolved

**Owner-confirmed:** the official Oz Home Energy public phone number is
**0435 336 336** (`tel:+61435336336`). This matches the number printed on
the branded van livery (`fleet-van` / `van-wrap-rear-side.png`, `/about/` —
see `docs/asset-manifest.md`), which turned out to be the correct number,
not a third conflicting variant as originally flagged below.

Every static occurrence of the two earlier, now-superseded numbers —
**0420 113 216** (used sitewide throughout the previous passes) and
**0435 366 366** (the previously-flagged alternate) — has been replaced
sitewide with 0435 336 336, including every `tel:` link, visible phone
number, footer/header CTA, JSON-LD `telephone` field, and legal-page
contact detail. No HighLevel dynamic-number-insertion or call-tracking
script exists in this build to preserve — every phone number here is a
static fallback.

**Still to confirm with the owner:** the real production HighLevel account,
Google Business Profile, and any live ad campaigns should be checked to
show this same number — this repo only controls the website's own copy.
The van livery's "Smart Energy Council" membership badge is still not
asserted anywhere in this site's own copy — do not add that claim to any
page without separate confirmation.

<details>
<summary>Original (resolved) conflict writeup, kept for audit history</summary>

This build used **0420 113 216** everywhere, consistently. But the working
brief for a previous pass stated that public information had also shown
**0435 366 366**, and neither had been confirmed. A third variant,
**0435 336 336**, was then found printed on the supplied van livery photo
and was *not* treated as confirmation at the time — it has since been
confirmed by the owner as the correct number, resolving this conflict.

</details>

## Accreditations & claims (do not publish without evidence)
- [x] NSW Electrical Contractor Licence 382607C — ✅ owner-confirmed current
      and active; see `docs/owner-inputs-required.md`
- [x] SAA accreditation — ✅ owner-confirmed, number **S5265652**; recorded
      as its own distinct credential (About page), not combined with the
      electrical licence — see `docs/owner-inputs-required.md`
- [ ] NETCC membership — shown on the live site; **treated as unverified**
      here until documentary confirmation is supplied
- [ ] Tesla Certified Installer status and Ohme Approved Installer status —
      **hidden from the public site** (homepage trust strip commented out
      in `src/pages/home/content.html`) until current, documented written
      approval is supplied for each; see `docs/asset-manifest.md`
- [ ] Any manufacturer partnership claims
- [ ] Years in business
- [ ] Total installation count
- [ ] Any "best/leading/number one" style claim

## Operational claims to verify (currently published, worded conservatively)
These are live on the site because they're reasonably hedged, not absolute
promises — but every one needs a factual check against how the business
actually operates before this goes further:
- [ ] **"Most residential solar or battery installations are completed
      within a day"** (`/faqs/`) — confirm this is still typical.
- [ ] **DNSP approval timeframes** ("one to a few weeks depending on your
      network area") — confirm current typical timeframes per network area.
- [ ] **Who submits the DNSP/network connection application** — copy across
      several pages states "we lodge the connection application" / "we
      handle this application." Confirm this is accurate (vs. a third party
      or subcontractor doing it) before it stays worded this way.
- [ ] **"Our licensed team" / "our licensed electrical team"** wording
      (`/residential-solar/` and elsewhere) — confirm whether installers are
      direct employees, subcontractors, or a mix, and whether this phrasing
      is acceptable either way.
- [ ] **Areas regularly serviced** (`/locations/`) — the suburb/region lists
      are indicative groupings, not a verified service-area boundary.
- [ ] Product warranty terms, savings/payback figures, and specific rebate
      amounts — **none are published**; confirm before adding any.

## Reviews & projects (sections currently omitted, not fabricated)
- [ ] Genuine Google reviews — name as publicly displayed, review text,
      rating, service, link to original review. Until supplied, no reviews
      section exists anywhere on the site (not even a placeholder).
- [ ] Real completed-project detail for `/projects/` and a homepage featured
      project: customer objective, property situation, system installed,
      design considerations, photographs, result, and — only if the
      customer has authorised it — their review/quote.
- [ ] Customer/company names for any commercial project shown publicly
      (only with written permission).

## Business detail
- [ ] Registered business/entity name and ABN (needed for Privacy Policy,
      Terms — currently omitted rather than guessed)
- [ ] Business email address (currently not published anywhere; phone-only
      contact until confirmed)
- [ ] Active social profile URLs (Facebook/Instagram/LinkedIn) — footer
      social icons were **removed entirely** this pass (they previously
      linked to `#`, which is worse than not showing them). Re-add once
      genuine, active profile URLs are supplied.
- [ ] Finance availability and terms, if any
- [ ] Current rebate/incentive amounts, if Oz Home Energy wants to reference
      general eligibility (still without guaranteeing a figure)
- [ ] Publish/"last updated" dates for `/privacy-policy/` and `/terms/`
      (currently omitted rather than showing a placeholder date)

## Products
- [ ] Specific panel, inverter, battery and EV charger brands actually
      supplied and supported
- [ ] Warranty terms per product category
- [ ] Current product availability

## Photography — see docs/05-photography-shotlist.md for the full shot list

**Update: real, owner-approved photography has now been added** — see
`docs/asset-manifest.md` for exactly which photo went where. The list
below is kept for what's still outstanding:
- [x] Homepage hero (ground-mounted solar array)
- [x] Residential rooftop solar installation
- [x] Battery/inverter installation
- [x] EV charger installation
- [x] Switchboard/electrical work (in-progress installation photography — no before/after pair supplied)
- [x] Commercial project (rooftop array with installation team)
- [x] Team photo (About page)
- [x] Branded vehicle photo (About page)
- [ ] Named, written project case studies for `/projects/` — genuine photos now exist
      there ("Recent work" and "installation in progress" galleries), but no
      customer names, locations, system sizes or results are stated anywhere;
      a full case-study write-up still needs the customer's agreement per
      `docs/01-audit-and-positioning.md`
- [ ] A confirmed "before" switchboard photo to pair with the in-progress one used
- [ ] Reviews — still no genuine review data exists; the reviews section remains omitted

Anywhere a photo still doesn't exist, the spot continues to render as the
on-brand icon panel (`.visual-panel` in `site/css/styles.css`) rather than a
placeholder box.
- [ ] Team and/or vehicle photography for `/about/`

## Legal
- [ ] Final consent/privacy checkbox wording on all three forms (assessment,
      project enquiry, service request) — reviewed by Oz Home Energy and,
      ideally, a qualified advisor
- [ ] Full legal review of `/privacy-policy/` and `/terms/` — both are
      structured drafts (the liability clause on `/terms/` is generic
      boilerplate, not drafted for this specific business's risk position)
- [ ] Complaints process response-time commitments (`/complaints/`) —
      deliberately not stated as a specific SLA until confirmed

## Technical / integration
- [ ] HighLevel sub-account credentials and webhook/API setup — see
      `04-highlevel-integration.md` for the full field mapping, pipeline and
      routing specification. **Nothing currently submits anywhere** — all
      three lead forms show an on-page notice saying so, and are configured
      `method="post"` (never GET) as a safety default.
- [ ] Confirm and remove every `api.growthlocal.com.au` (or equivalent
      vendor) link on the actual live site — not reproducible from this
      sandbox since the live site could not be crawled (see
      `01-audit-and-positioning.md`)
- [ ] Confirm final hosting platform decision (static build vs. rebuilt
      natively inside HighLevel's site builder — see the two options in
      `04-highlevel-integration.md`)
- [ ] Full current-site URL export (Search Console + a full crawl) for the
      redirect map — see `redirects/_redirects` and
      `03-seo-redirects-metadata.md` for what's confirmed vs. still
      ambiguous (`/commercial-project-enquires` specifically needs
      investigation before it's mapped anywhere)
- [ ] Flip `BUILD_TARGET=production` (see `scripts/build.js`) and confirm
      `<meta name="robots">` reads `index, follow` and `site/robots.txt`
      allows crawling — **only** once this is genuinely the production
      domain, never on a preview host
- [ ] A real 1200×630 social-sharing image to replace the favicon currently
      used as `og:image` (flagged inline in `src/layout.html`)
