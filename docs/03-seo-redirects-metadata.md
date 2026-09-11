# SEO Metadata & Redirect Map

## Metadata

Every page has a unique `<title>`, meta description, canonical tag, Open
Graph tags, one `<h1>`, and a `BreadcrumbList` JSON-LD block generated
automatically from `meta.json` (`scripts/build.js`). Sitewide `Electrician`
JSON-LD (name, phone, address, licence number as a `PropertyValue`) is
injected on every page via `src/layout.html`. Titles/descriptions are listed
in each page's `src/pages/<slug>/meta.json` — the canonical source of truth;
sample:

| Page | Title | Meta description |
|---|---|---|
| Home | Solar, Battery, EV Charging & Electrical \| Oz Home Energy Sydney | Installer-led solar, battery storage, EV charging and electrical work for Sydney homes and businesses. Licensed NSW electrical contractor. Start a free energy assessment. |
| Residential Solar | Residential Solar Installation Sydney \| Oz Home Energy | Solar panel systems designed around your roof, your electricity use and your budget. Licensed NSW electrical contractor serving Greater Sydney. |
| Battery Storage | Home Battery Storage & Retrofits Sydney \| Oz Home Energy | New battery installations and retrofits to existing solar. We check inverter and switchboard compatibility before recommending a battery. |
| EV Charging | Home EV Charger Installation Sydney \| Oz Home Energy | Home EV charger installation, from switchboard capacity checks to a safely wired, correctly rated charging circuit. |
| Commercial Solar | Commercial Solar Installation NSW \| Oz Home Energy | Commercial solar design and installation for businesses across Sydney and NSW. |
| Projects | Projects & Case Studies \| Oz Home Energy | Real Oz Home Energy installations shown with genuine project detail and workmanship photography. |
| Assessment | Start Your Free Energy Assessment \| Oz Home Energy | A short, low-pressure assessment to understand your property, electricity use and goals. |

(Full list: every `meta.json` under `src/pages/`.)

No title or description on any page uses "best", "leading", "number one" or
any unverified superlative — consistent with the claims policy.

## Structured data used, and why

- **`Electrician`** (sitewide) — the most specific applicable Schema.org type
  for a licensed electrical contractor; carries name, phone, address,
  licence number.
- **`BreadcrumbList`** (every page) — generated from each page's breadcrumb
  trail.
- **No `FAQPage` schema shipped.** Google's guidance (2023+) restricts
  `FAQPage` rich results to well-known, authoritative government/health
  sites — adding it elsewhere no longer produces a rich result and risks
  looking like manipulation. The FAQ *content* (Learning Centre, FAQs page)
  is real and crawlable either way.
- **No `Review`/`AggregateRating` schema** — none is added until genuine,
  verifiable review data exists. Fabricated or unverifiable review markup is
  a Google Search spam violation; this is a hard line, not a style choice.
- **No `LocalBusiness` with a street address` beyond city/state** — the
  brief is explicit that no fake office locations should be created, and no
  public street address was supplied. `Electrician` with city/region-level
  address is the accurate representation of "based in Sydney, servicing
  Greater Sydney and NSW."

## Redirect map

301 redirects to implement at the platform/DNS level (exact mechanism
depends on final hosting decision — see `04-highlevel-integration.md`):

| Old URL (as reported in brief) | New URL | Reason |
|---|---|---|
| `/commercial-project-enquires` (or `/commercial-project-enquiries` if that's the live spelling) | `/commercial-project-enquiry/` | Corrects misspelling; preserves link equity from any existing backlinks/ads |
| Any `/…assesment…` URL variant | matching corrected URL (e.g. `/assessment/`) | Corrects misspelling |
| Any location subpage not represented above | `/locations/` | Consolidates repeated/duplicate location content into one authoritative page |
| Any legacy service URL not listed in the sitemap above | closest matching new URL (map 1:1 by service, not by category) | Preserve ranking equity; avoid soft-404s |

**Action required before launch:** export the full current URL list from
Search Console / the existing HighLevel site (Site Map export or crawl) and
map every indexed URL to its new destination — this document can only
redirect what the brief specifically identified, since the live site itself
could not be crawled from this sandbox (see `01-audit-and-positioning.md`).
Do not delete pages without a corresponding redirect; every 404 is lost
equity and, at volume, a crawl-budget and trust signal.

## Internal linking

Every service page cross-links to at least one related service (e.g. EV
Charging ↔ Switchboard Upgrades ↔ Residential Electrical; Battery Storage ↔
Solar & Battery Upgrades) and back to `/assessment/` with a goal-specific
query parameter (`?goal=ev-charging`, etc.) so the assessment form can
pre-select the relevant first answer — this both improves UX and distributes
link equity across the service cluster rather than funnelling everything
through the homepage alone.

## `api.growthlocal.com.au` link audit

None of the pages built in this redesign link to any GrowthLocal or other
vendor API domain — every link is either a relative internal path, `tel:`,
or (where explicitly marked) a placeholder `#` pending real profile URLs
(social links in the footer). **Before launch**, run a full link crawl of
whatever CMS/platform hosts the final site and confirm zero customer-facing
links resolve to `api.growthlocal.com.au` or any other internal vendor
tooling domain — this was flagged as a live-site defect in the brief and
could not be independently re-verified from this sandbox.
