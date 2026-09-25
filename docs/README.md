# Oz Home Energy Redesign — Deliverables Index

This `docs/` folder contains the strategy and specification deliverables.
The buildable prototype itself lives in `site/` (built output) and
`src/` (source templates/content) — see the root `README.md` for how to
build and run it locally.

| File | Covers |
|---|---|
| `01-audit-and-positioning.md` | Audit of the current site, problem priority (critical/important/optional), the new positioning statement, and what was deliberately not invented |
| `02-sitemap-and-design-system.md` | Full sitemap as implemented, navigation structure, design tokens and component rules |
| `03-seo-redirects-metadata.md` | Metadata approach, structured data used (and deliberately not used), the 301 redirect map, and internal linking strategy |
| `04-highlevel-integration.md` | Exactly what's needed to connect the three forms to HighLevel — field mapping, pipelines, tags, workflows, and what has/hasn't been tested |
| `05-photography-shotlist.md` | Every placeholder image in priority order, with shot standards |
| `06-qa-report.md` | Automated + manual QA results against the brief's technical/accessibility/claims checklist, including the 23 Sep 2026 launch-readiness repair pass |
| `07-owner-confirmations.md` | Superseded — kept for historical detail only. Use `owner-inputs-required.md` below instead |
| `owner-inputs-required.md` | **Current master checklist** of every fact, claim, asset, credential or endpoint that must be confirmed/supplied before this goes live |
| `analytics-integration.md` | GTM/Meta Pixel IDs, setup, and the preview-vs-production gating added in the launch-readiness repair pass |
| `legacy-url-migration.md` | Canonical domain decision, the 301/302 legacy-route redirect map, and how it's tested |
| `launch-readiness-2026-09-23.md` | Final go/no-go checklist for switching the preview to a real production deploy |

## Quick start (building the prototype)

```
node scripts/build.js              # builds src/pages/* into site/**/index.html
cd site && python3 -m http.server 8811   # serve locally
# then visit http://localhost:8811/
```

To re-run the automated QA pass (requires Playwright + Chromium):

```
node scripts/build.js
(cd site && python3 -m http.server 8811 &)
node scripts/qa-playwright.js
```
