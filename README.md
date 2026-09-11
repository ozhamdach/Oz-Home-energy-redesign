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

## What this is (and isn't)

This is a **static front-end prototype**: real, final copy; a complete
responsive design system; a working multi-step assessment flow and two
other lead-capture forms with client-side validation — but **no form
submits anywhere yet**. See `docs/04-highlevel-integration.md` for exactly
what's needed to connect them to HighLevel, and
`docs/07-owner-confirmations.md` for every claim, asset or credential that
needs sign-off before this goes live. Nothing fabricated (reviews, project
case studies, accreditations, pricing, statistics) appears anywhere —
those sections are explicit, labelled placeholders by design.
