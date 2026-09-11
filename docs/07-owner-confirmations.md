# Master List — Everything Requiring Owner Confirmation Before Publishing

Every item below is also flagged inline in the HTML (search the built site
for `owner-flag` or `OWNER CONFIRMATION REQUIRED`:
`grep -rn "OWNER CONFIRMATION REQUIRED" site --include=*.html`). This is the
consolidated checklist — nothing on it is published as fact anywhere in this
build.

## Accreditations & claims (do not publish without evidence)
- [ ] NETCC membership — currently shown on the live site; **treated as
      unverified** and not carried into this redesign until documentary
      confirmation is supplied
- [ ] Tesla Certified Installer status
- [ ] SAA accreditation
- [ ] Any manufacturer partnership claims
- [ ] Years in business
- [ ] Total installation count
- [ ] Any "best/leading/number one" style claim

## Reviews & projects (currently empty placeholders, not fabricated)
- [ ] Genuine Google reviews — name as publicly displayed, review text,
      rating, service, link to original review
- [ ] Real completed-project detail for `/projects/` and the homepage
      featured project: customer objective, property situation, system
      installed, design considerations, photographs, result, and — only if
      the customer has authorised it — their review/quote
- [ ] Customer/company names for any commercial project shown publicly
      (only with written permission)

## Business detail
- [ ] Registered business/entity name and ABN (needed for Privacy Policy,
      Terms)
- [ ] Business email address (currently a placeholder wherever shown)
- [ ] Active social profile URLs (Facebook/Instagram/LinkedIn) — footer
      icons currently link to `#` pending confirmation
- [ ] Finance availability and terms, if any
- [ ] Current rebate/incentive amounts, if Oz Home Energy wants to reference
      general eligibility (still without guaranteeing a figure)

## Products
- [ ] Specific panel, inverter, battery and EV charger brands actually
      supplied and supported
- [ ] Warranty terms per product category
- [ ] Current product availability

## Photography
- [ ] All real installation, team and vehicle photography — see
      `05-photography-shotlist.md` for the full shot list and priority order

## Legal
- [ ] Final consent/privacy checkbox wording on all three forms (assessment,
      project enquiry, service request) — reviewed by Oz Home Energy and,
      ideally, a qualified advisor
- [ ] Full legal review of `/privacy-policy/` and `/terms/` — both are
      structured drafts, not final legal documents
- [ ] Complaints process response-time commitments (`/complaints/`)

## Technical / integration
- [ ] HighLevel sub-account credentials and webhook/API setup (see
      `04-highlevel-integration.md`) — nothing currently submits live
- [ ] Confirm and remove every `api.growthlocal.com.au` (or equivalent
      vendor) link on the actual live site
- [ ] Confirm final hosting platform decision (static build vs. rebuilt
      natively inside HighLevel's site builder — see the two options in
      `04-highlevel-integration.md`)
- [ ] Full current-site URL export for the redirect map in
      `03-seo-redirects-metadata.md` — this sandbox could not crawl the live
      site to build that list independently
