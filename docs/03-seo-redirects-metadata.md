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

**Superseded by `docs/legacy-url-migration.md`** — that document is now the
canonical source for the redirect map, the production-origin decision
(apex `ozhomeenergy.com.au`, not `www`), the distinction between this
repo's GitHub Pages compatibility bridge pages and a real production 301/302,
and host-specific deployment guidance. This section is kept short
deliberately to avoid two documents disagreeing with each other as the
mapping evolves.

The single source of truth for every mapping is `redirects/legacy-routes.json`;
`redirects/_redirects` and `redirects/redirects.json` are generated from it
by `node scripts/build-redirects.js` — don't hand-edit those two.

## Internal linking

Every service page cross-links to at least one related service (e.g. EV
Charging ↔ Switchboard Upgrades ↔ Residential Electrical; Battery Storage ↔
Solar & Battery Upgrades) and back to `/assessment/` — this distributes link
equity across the service cluster rather than funnelling everything through
the homepage alone.

**Removed, 25 Sep 2026 audit pass:** these links to `/assessment/` and the
homepage pathway cards previously appended a `?goal=...` query parameter and
a `data-pathway` attribute, with client-side JS writing the value to
`sessionStorage` as `ohe_pathway`. Nothing on the assessment page ever read
either value — the cross-origin HighLevel form embedded there has no
supported prefill hook for it — so this never actually pre-selected
anything; it was link decoration with no effect. All of it has been removed
so the code doesn't imply a prefill capability that doesn't exist. Every
link above now points at a clean destination URL (e.g. `/assessment/`,
`/residential-solar/`). If genuine prefill is wanted later, it needs to be
built using a method HighLevel's own docs support (e.g. a hidden field the
embed reads, or its official prefill query-param scheme), not a homegrown
parameter the form was never wired to read.

## `api.growthlocal.com.au` link audit

None of the pages built in this redesign link to any GrowthLocal or other
vendor API domain — every link is either a relative internal path, `tel:`,
or (where explicitly marked) a placeholder `#` pending real profile URLs
(social links in the footer). **Before launch**, run a full link crawl of
whatever CMS/platform hosts the final site and confirm zero customer-facing
links resolve to `api.growthlocal.com.au` or any other internal vendor
tooling domain — this was flagged as a live-site defect in the brief and
could not be independently re-verified from this sandbox.
