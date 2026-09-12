# Master List — Everything Requiring Owner Confirmation Before Publishing

Nothing on this list is published as fact anywhere in this build. Search the
built site for any stray marker with:
`grep -rn "OWNER CONFIRMATION REQUIRED" site --include=*.html` — this should
return nothing (only HTML comments, invisible to users, may reference this
doc). If it returns visible page text, that's a bug — file it.

## ⚠️ Phone number conflict — resolve before anything else

This build uses **0420 113 216** everywhere, consistently. But the working
brief for this pass states that previous public information has also shown
**0435 366 366**. **This has not been resolved — nobody has told this build
which number is actually correct**, and guessing is explicitly out of scope.

**Action required:** confirm the one correct number, then:
1. Search this repo for `0420113216` and `0420 113 216` (every `tel:` link
   and every visible phone number) and replace sitewide if the other number
   is correct.
2. Check whatever the real production HighLevel account, Google Business
   Profile, and any live ad campaigns currently show — these need to match
   too, not just the website.
3. Until this is resolved, do not treat this preview's phone number as
   confirmed-correct just because it's consistent — consistency here only
   means the same unverified number was used everywhere.

**Update — a third number found in supplied vehicle photography:** the
branded van photo (`fleet-van` / `van-wrap-rear-side.png`, added to
`/about/` — see `docs/asset-manifest.md`) prints **0435 336 336**, distinct
from both numbers above. This was not edited out (it's part of an
authentic, owner-approved photo) and is not treated as confirmation of
anything — it just makes this conflict more urgent to resolve, not less.
The same van design also shows a "Smart Energy Council" membership badge,
which is not asserted anywhere in this site's own copy — do not add that
claim to any page copy without separate confirmation.

## Accreditations & claims (do not publish without evidence)
- [ ] NETCC membership — shown on the live site; **treated as unverified**
      here until documentary confirmation is supplied
- [ ] Tesla Certified Installer status
- [ ] SAA accreditation
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
