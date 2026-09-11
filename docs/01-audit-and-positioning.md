# Oz Home Energy — Audit, Problem Priority & Positioning

## A note on how this audit was produced

This session's sandbox blocks outbound network access to `ozhomeenergy.com.au` (an
environment-level network policy, not a choice made here), so the live site could
not be crawled directly. This audit is therefore built from the detailed,
first-hand findings already supplied in the brief (which reads as a genuine
audit — specific misspellings, specific broken patterns, specific URLs) plus
general knowledge of how LeadConnector/HighLevel-built sites are typically
structured. **Before launch, run one more live pass against the current site**
to confirm nothing below has been missed or has since changed — see the QA
report (`06-qa-report.md`) for the specific checklist to re-run.

## Audit findings (from the brief + platform pattern knowledge)

| # | Finding | Evidence / basis |
|---|---|---|
| 1 | Hero is a large dark panel dominated by a long lead form | Stated directly in brief |
| 2 | Navigation has too many equally-weighted items | Stated directly in brief |
| 3 | Typography inconsistent, doesn't read as a modern energy brand | Stated directly in brief |
| 4 | Logo visually undersized | Stated directly in brief |
| 5 | Generic, repetitive copy; several service pages say the same thing | Stated directly in brief |
| 6 | Location blocks repeated excessively | Stated directly in brief |
| 7 | CTAs duplicated without hierarchy | Stated directly in brief |
| 8 | No clear residential vs commercial journey separation | Stated directly in brief |
| 9 | Real installations/people/project proof not prominent | Stated directly in brief |
| 10 | About page has unfinished placeholder team-bio copy | Stated directly in brief |
| 11 | "Assessment" misspelled "Assesment" in multiple places | Stated directly in brief |
| 12 | Some internal links route through `api.growthlocal.com.au` | Stated directly in brief — GrowthLocal is a third-party marketing/API vendor; customer-facing links should never resolve to a vendor API domain |
| 13 | URL `commercial-project-enquires` is misspelled | Stated directly in brief |
| 14 | No strong projects/case-studies experience | Stated directly in brief |
| 15 | Products, system options and after-sales support unclear | Stated directly in brief |
| 16 | Site explains a lot but doesn't establish authority quickly | Stated directly in brief |
| 17 | "NETCC Member" is displayed without confirmed documentary evidence | Stated directly in brief — **treated as unverified throughout this redesign** |

## Problem priority

**Critical (fix before anything else matters)**
- Long above-the-fold form in the hero suppresses conversion and reads as high-pressure
- Misspelled "Assesment" — damages credibility instantly, wherever it appears
- `commercial-project-enquires` URL misspelling — needs a 301 redirect plan (see `03-seo-redirects-metadata.md`)
- Links routing through `api.growthlocal.com.au` — customer-facing links must never resolve to a vendor API domain; audit and fix every instance
- Unverified "NETCC Member" badge and any other unverified accreditation claims — remove until documentary evidence is supplied
- Unfinished/placeholder About page team-bio copy — either replace with real content or remove the section entirely (never ship placeholder text)

**Important (materially affects conversion and credibility)**
- No clear residential/commercial split in navigation or homepage journey
- Duplicated, unprioritised CTAs
- No real project/case-study proof
- Repetitive, near-identical service page copy
- Undersized logo, inconsistent type system
- Products/technology and after-sales support not explained

**Optional (polish once the above is solid)**
- Location page consolidation (see `02-sitemap-and-design-system.md`)
- Expanded Learning Centre content over time
- Secondary service page depth (cleaning, bird-proofing) beyond what's shipped here

## Positioning statement

> **Oz Home Energy is a modern electrical and home-energy company that designs
> and installs connected energy systems properly.** Solar generates energy,
> batteries store it, EV chargers use it, and the property's electrical
> infrastructure supports all of it — considered together, by a licensed
> electrical contractor, not sold as four separate products.

This positioning is expressed structurally throughout the redesign: the
homepage's "Generate → Store → Charge → Control" section, the "Why Oz Home
Energy" points that foreground electrical infrastructure, and every service
page's cross-links back to switchboard/electrical considerations.

## What was deliberately NOT invented

Per the brief's instruction, none of the following are published anywhere in
this build — every instance is marked `[OWNER CONFIRMATION REQUIRED]` in the
HTML and listed centrally in `07-owner-confirmations.md`:

NETCC membership · Tesla Certified Installer status · SAA accreditation ·
review totals/ratings · installation totals · years in business · manufacturer
partnerships · finance availability · specific rebate amounts · guaranteed
savings/payback claims · superiority claims ("best", "leading", "number one") ·
product pricing/availability · client or project names · workmanship
guarantees beyond actual contract terms.
