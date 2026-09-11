# Sitemap & Design System

## Sitemap (as implemented)

Primary pages (match the brief's sitemap exactly, using the corrected
`commercial-project-enquiry` spelling):

```
/                              Home
/residential-solar/            Residential Solar
/battery-storage/              Battery Storage
/solar-battery-upgrades/       Solar & Battery Upgrades
/ev-charging/                  EV Charging
/residential-electrical/       Residential Electrical
/switchboard-upgrades/         Switchboard Upgrades
/commercial-solar/             Commercial Solar
/commercial-batteries/         Commercial Batteries
/commercial-ev-charging/       Commercial EV Charging
/commercial-electrical/        Commercial Electrical
/commercial-project-enquiry/   Project Enquiry (corrected spelling; see redirect map)
/projects/                     Projects / Case Studies
/products/                     Products / Brands
/about/                        About (also serves "Why Oz Home Energy")
/learning-centre/              Learning Centre
/locations/                    Locations
/service-request/              Service Request
/assessment/                   Contact / Energy Assessment (multi-step form)
/faqs/                         FAQs
/complaints/                   Complaints
/privacy-policy/               Privacy Policy
/terms/                        Terms and Conditions
```

Secondary/support pages (per the brief: "cleaning and bird-proofing should be
secondary service pages rather than primary brand-defining services" — they
exist, are linked from the Support nav and footer, but are not primary
sitemap-weighted pages):

```
/solar-servicing/
/panel-cleaning/
/bird-proofing/
```

**Locations decision:** rather than generating thin, duplicated per-suburb
pages (a known SEO anti-pattern and one of the audit findings — "location
blocks repeated excessively"), this build ships **one** consolidated
`/locations/` page grouping genuine Greater Sydney regions, with wider-NSW
commercial coverage explained separately. If Oz Home Energy later wants
dedicated suburb pages, each one needs genuinely unique local content (not
a template swap) to avoid duplicate-content and thin-content penalties —
build those only where there's real local proof (completed jobs, local
knowledge) to write about.

**Learning Centre decision:** implemented as a single hub page with grouped,
substantive accordion answers (Solar / Battery / EV / Electrical /
Commercial) rather than ten thin individual article URLs. This satisfies
the "concise learning section that demonstrates expertise" brief without
fragmenting authority across many low-word-count pages. Split into individual
article URLs later if/when each can carry 600+ words of genuinely unique,
useful content worth its own search listing.

## Navigation (implemented in `src/partials/header.html`)

- **Solutions** — Solar · Battery Storage · Solar & Battery Upgrades · EV
  Charging · Electrical & Switchboards
- **For Business** — Commercial Solar · Commercial Batteries · Commercial EV
  Charging · Commercial Electrical · Project Enquiry
- **Projects** (direct link)
- **Why Oz Home Energy** (direct link → `/about/`)
- **Learn** (direct link → `/learning-centre/`)
- **Support** — Service Request · Solar Servicing · Panel Cleaning ·
  Bird-Proofing · FAQs · Contact (→ `/assessment/`)
- **Start Your Assessment** — primary button, always visible ≥860px; phone
  number visible ≥720px; both collapse into the mobile menu below that.

## Design system

### Tokens (`site/css/styles.css :root`)
- `--blue-800: #0540C1` — primary action colour (verified brand blue)
- `--charcoal: #1A1A1A` — verified brand charcoal
- `--offwhite: #F7F5F1` — warm off-white background
- `--blue-100 / --blue-50` — pale blue supporting surfaces
- Headings: **Montserrat**, weight 600/700 (as specified)
- Body: **Inter** — highly legible modern sans-serif
- Type scale is fluid (`clamp()`), so headline size adjusts smoothly from
  375px to 1440px+ rather than jumping at breakpoints
- `--radius-sm/md/lg`: 6/12/20px — moderate, not pill-shaped
- Shadows are restrained (`--shadow-sm/md`) — no glow, no neon
- Full dark-mode token set included (`prefers-color-scheme` + `[data-theme]`)
  even though the primary brand experience is light, for system-level
  consistency and accessibility

### Components
Buttons (`.btn-primary/.btn-secondary/.btn-ghost`), header with dropdown +
mobile accordion nav, hero, proof strip, pathway cards, energy-flow diagram,
solution cards (alternating media/copy), why-us grid, process steps,
review cards, audience split, FAQ accordions (native `<details>` — works
without JS, keyboard accessible by default), multi-step assessment form,
footer. All components are defined once in `styles.css` and reused across
every page — this is what keeps 25+ pages visually and structurally
consistent without a component framework.

### What was deliberately avoided
Per the brief's "avoid" list: no green eco clichés, no gradients/glow, no
pill-button overuse, no stock rooftop photography (explicit placeholders
instead), no countdown timers or fake urgency, no serif display type, no
dense icon grids. Confirmed by reading `site/css/styles.css` end to end
against that list.
