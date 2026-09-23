# Oz Home Energy — Redesign

A complete redesign of ozhomeenergy.com.au: strategy, information
architecture, copy, design system and a buildable responsive prototype,
plus an implementation-ready specification for connecting it to HighLevel.

**Start here:** [`docs/README.md`](docs/README.md) indexes every strategy
and specification deliverable (audit, positioning, sitemap, design system,
SEO/redirects, HighLevel integration spec, photography brief, QA report,
owner-confirmation checklist).

## Project structure

```
src/pages/<slug>/meta.json     Per-page title, description, canonical, breadcrumbs
src/pages/<slug>/content.html  Per-page body content
src/partials/header.html       Shared site header/nav
src/partials/footer.html       Shared site footer
src/layout.html                Page shell (head, schema, script includes)
scripts/build.js               Assembles src/* into site/**/index.html
scripts/qa-playwright.js       Responsive/a11y/interaction smoke test
site/                          Built, servable static site (CSS/JS/img + built HTML)
docs/                          Strategy & specification deliverables
```

## Build & run locally

```
node scripts/build.js
cd site && python3 -m http.server 8811
# visit http://localhost:8811/
```

Re-run `node scripts/build.js` after editing anything under `src/` — the
files in `site/**/index.html` are generated output, not hand-edited.

`node scripts/build.js` defaults to **preview mode**: every page renders
`noindex, nofollow` in its own `<meta name="robots">` tag, which is the
real indexing control. `robots.txt` stays crawlable (`Allow: /`, no
sitemap) rather than blocking crawlers with `Disallow: /` — a robots.txt
disallow can't reliably keep a page out of Google's index on its own,
since a crawler that respects it never fetches the page far enough to see
the noindex meta tag. This is what's actually deployed to the public
GitHub Pages preview below. Only ever pass `BUILD_TARGET=production` when
building for the real ozhomeenergy.com.au domain, never for a preview
host — and note that `BUILD_TARGET=production` alone doesn't load
analytics either; see `docs/owner-inputs-required.md`'s "Analytics"
section for the separate `ENABLE_ANALYTICS` gate.

For a GitHub Pages-safe build (relative paths, since Pages serves this repo
from a `/<repo>/` subpath rather than domain root), also run
`node scripts/build-pages.js`, which reads `site/` and writes `pages-dist/`.
The live preview auto-deploys via `.github/workflows/deploy-pages.yml` on
every push to `main` only (not on pushes to a review/feature branch — merge
to `main` to update the preview, or trigger the workflow manually via
`workflow_dispatch`).

## What this is (and isn't)

This is a **static front-end prototype**: real, final copy and a complete
responsive design system, with a mixed state of lead capture. Four general
lead forms — Energy Assessment, the homepage quick-quote, Commercial
Project Enquiry and Service Request — are real, live HighLevel-hosted form
embeds. Three commercial-specific funnels — Commercial Load Review,
Commercial Solar & Battery Quote, and Commercial Battery Assessment — are
this repo's own HTML/JS with **no CRM endpoint configured**: each shows an
honest "not connected yet, please call" notice rather than any fake
success state. See `docs/04-highlevel-integration.md` for exactly what's
needed to connect the remaining three, and
`docs/owner-inputs-required.md` (the current, maintained master checklist
— supersedes `docs/07-owner-confirmations.md`) for every claim, asset or
credential that needs sign-off before this goes live, including which
claims have already been removed rather than published unconfirmed.
Nothing fabricated (reviews, project case studies, accreditations,
pricing, statistics) appears anywhere — where real content isn't available
yet, that section is omitted from the public page entirely (never shown as
an empty or placeholder-labelled box); see `docs/owner-inputs-required.md`
for what's needed to bring each one back.

The build also distinguishes **preview** from **production**: the GitHub
Pages preview this repo auto-deploys (`main` branch only, see above) is
always built without `BUILD_TARGET=production`, which keeps every page
`noindex, nofollow` in its own robots meta tag (the real indexing
control — `robots.txt` stays crawlable so crawlers can actually read that
tag, rather than relying on a `Disallow: /` that a crawler could ignore
without ever seeing it) and free of any analytics/ad-platform network
requests (GTM/Meta Pixel require both `BUILD_TARGET=production` and a
separate `ENABLE_ANALYTICS=true` — see `docs/owner-inputs-required.md`'s
"Analytics" section). Switching this preview to production mode is a
deliberate, separate decision, not something that happens by building
normally — see `docs/launch-readiness-2026-09-23.md` for what else must be
true before that switch, and before real production indexing is enabled.
