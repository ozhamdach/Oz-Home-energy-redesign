# Real Photography & Brand Asset Manifest

This documents the genuine Oz Home Energy photography and brand assets
integrated into the site (supplied as `Oz-Home-Energy-Website-Assets.zip`,
owner-confirmed as authorised for publication — see
`assets/original-photography/README-ASSET-MANIFEST.md`).

## Where things live

- **`assets/original-photography/`** — every original file supplied, preserved
  unmodified (including the master logo PDF, the two exact-duplicate rooftop
  photos, and the vehicle-wrap design mockup sheet — see "Not used publicly"
  below). Not served by the website; kept for provenance and reprocessing.
- **`site/img/photos/`** — the responsive derivatives actually served, generated
  by `scripts/process-photos.py` (AVIF + WebP + JPEG at 2-3 widths each, plus
  `manifest.json` recording each photo's intrinsic width/height/available
  widths). Re-run that script after adding or replacing source photography.
- **`site/img/brand/`** — `oz-home-energy-logo.svg` (full logo, used in the
  header) and `oz-home-energy-icon.svg` (the house+bolt mark only, cropped
  from the same source file — used for the favicon).
- **`scripts/photo-tag.js`** — a dev helper that prints a correct `<picture>`
  block for a given photo slug, reading widths from `manifest.json`, so
  wiring a photo into a page doesn't mean hand-typing (and risking
  transcription errors in) a `srcset`.

## What was fixed before anything was published

- **Exact duplicates removed**: `rooftop-solar/regional-rooftop-overview-03.jpg`
  and `-04.jpg` were byte-identical (verified by MD5) to `-01.jpg` and
  `-02.jpg` respectively — not processed or used.
- **Black letterbox borders cropped** from five source photos that had them
  (verified by pixel-row-brightness analysis, not guessed): `residential-rooftop-solar.jpg`,
  `fox-battery-context.jpg`, `tesla-wall-connector.jpg`,
  `switchboard-work-in-progress-02.jpg`, and `van-wrap-rear-side.png`. Exact
  crop boxes are recorded in `scripts/process-photos.py`.
- **EXIF/GPS stripped** from every derivative — verified empty after
  processing (`Image.getexif()` returns `{}`).
- **Auto-orientation applied** before cropping/resizing (`ImageOps.exif_transpose`).
- **Not used publicly**: `vehicle-branding/van-wrap-side.jpg` (a flattened
  4-panel design-mockup sheet, redundant with the real logo already used
  sitewide and the real in-traffic van photo) — kept in
  `assets/original-photography/` only.

## Where each photo was placed

| Photo | Page(s) | Notes |
|---|---|---|
| `ground-mount-wide` | Homepage hero background | Manifest's suggested hero candidate |
| `trust-ohme-badge`, `trust-tesla-badge` | ⚠️ Currently **hidden** — see below | Section markup/CSS/assets all still in place, ready to re-enable |
| `residential-solar-rooftop-1` (regional-rooftop-overview-01) | `/residential-solar/` | |
| `battery-fox-installed` (fox-battery-context, cropped) | `/battery-storage/` | |
| `ev-tesla-wall-connector` (cropped) | `/ev-charging/` | |
| `commercial-array-team` | `/commercial-solar/` | Manifest's "strongest commercial image" |
| `battery-sungrow-installed` | `/commercial-batteries/` | |
| `process-switchboard-open-1` | `/switchboard-upgrades/` | Captioned/alt-texted as mid-installation, not a finished board |
| `team-installers` | `/about/` (Licensing & compliance section) | |
| `fleet-van` (van-wrap-rear-side, cropped) | `/about/` (new "On the road" section) | Not used as the site's main hero |
| `ground-mount-close`, `commercial-panel-detail`, `residential-solar-rooftop-2`, `commercial-lift-team-1/2`, `battery-fox-detail`, `battery-white-unit` | `/projects/` "Recent work" gallery | Genuine photos, no case-study narrative attached — no location, system size, savings or customer identity is stated anywhere |
| `process-switchboard-open-2`, `process-commercial-array-lift`, `process-commercial-commissioning-1/2` | `/projects/` "Installation and commissioning in progress" gallery | Explicitly captioned as in-progress/commissioning — open switchboards and exposed wiring are never presented as completed work |

Photos supplied but not placed on any page (kept only in
`assets/original-photography/`): the two exact-duplicate rooftop photos and
the van-wrap mockup sheet, as above.

## ✅ Phone number discrepancy found in the vehicle photography — resolved

The van livery shown in `fleet-van` (and in the unused mockup sheet) prints
**0435 336 336**, which the owner has since confirmed is in fact the
official Oz Home Energy number — not a third conflicting variant. It has
replaced the two earlier, now-superseded numbers (`0420 113 216` and
`0435 366 366`) sitewide; see `docs/07-owner-confirmations.md` /
`docs/owner-inputs-required.md` for the full resolution note. The van photo
also displays a "Smart Energy Council" membership badge as part of its
design — this is still not asserted anywhere in this site's own copy or
schema, and should not be treated as a confirmed claim.

## Installer badges — current status (updated 24 Sep 2026, premium badge-grid pass)

The homepage trust grid was redesigned this pass: five transparent
credential cells (no white card tiles, no boxed shadows), each badge
substantially larger than before, laid out 3×2 on desktop / 2×3 on
tablet / 1-column on mobile. The 15-Year Workmanship Warranty moved out
of the credential grid into its own full-width strip below it.

- **NSW Electrical Contractor** — inline SVG icon, unchanged content,
  enlarged to 56px.
- **Solar Accreditation Australia** — ✅ live, badge re-processed with a
  **genuine transparent background**. The previously deployed derivative
  was flattened onto white; the source (`assets/original-photography/
  trust-badges/solar-accreditation-australia.png`) had no alpha channel
  either. Re-created via whiteness-keyed alpha extraction (every pixel's
  distance from pure white becomes its transparency, then the true
  foreground colour is unpremultiplied out to avoid a white halo at the
  edges) — checked over both light and dark checkerboard backgrounds at
  200% zoom before use: clean edges, no white cast, letter counters
  (the holes in "o", "a", "e") properly transparent rather than solid
  white circles. Saved to `site/img/brand/trust/solar-accreditation-
  australia.png`. No redraw/recolour — same artwork, only the background
  removed.
- **Smart Energy Council Member** — ✅ live, badge re-rendered directly
  from the owner-supplied source PDF (`SEC-Member-Badges-SMB.pdf`) at
  3× resolution with the PDF's own vector transparency preserved (not a
  flood-fill approximation) — the cleanest possible source, genuinely
  transparent with no artefacts. Saved to `site/img/brand/trust/smart-
  energy-council.png`.
- **Ohme Approved Installer** — ✅ live, confirmed via the 11 Sep 2026
  Ohme onboarding call and the owner-supplied badge asset, shown larger
  (108px desktop). **Not made transparent**: the only official Ohme
  asset available (`assets/original-photography/trust-badges/ohme-
  approved-installer.jpg`) is a full-bleed two-tone card — the light
  lower half (carrying the "Approved installer" text) touches every
  edge of the canvas directly, because it *is* the real card design, not
  a removable white margin. Flood-filling it would delete the actual
  "Approved installer" text panel. Shown as supplied (converted to PNG,
  no other change) at `site/img/brand/trust/ohme-approved-installer.png`.
  No alternate transparent Ohme asset exists anywhere in this repo or the
  supplied packs.
- **Evnex Certified Installer** — ✅ live, published 24 Sep 2026 on
  **direct owner instruction**; this pass switched from the white
  variant (shown on a boxed dark "stage") to the official **dark-artwork
  variant**, shown directly against the trust section's light background
  with no stage — `evnex-installer-dark.png` from the fuller
  "OHE_Evnex_Web_Pack_Under_30MB" pack's `02-Supplied-Badges-and-Logos/`
  folder, genuinely transparent as supplied, copied unaltered to
  `site/img/brand/evnex/evnex-certified-installer-dark.png`. This is
  still an owner-supplied business claim, not independently verified —
  no certification number, issue date or expiry was supplied or shown.
- **Tesla Certified Installer** — **still hidden from the public site.**
  This pass's request asked for a sixth Tesla credential card, framed as
  a direct owner instruction with explicit caveats against inventing
  approval metadata. It was **not implemented**: final written
  marketing/publication approval from Tesla
  (`energyproductsmarketing@tesla.com`) still has not been received, and
  a business's own instruction to publish a partner's mark is not that
  partner's consent to use it — the missing requirement is Tesla's
  consent specifically, which no instruction from this business can
  supply. See the Tesla section of `docs/owner-inputs-required.md`.
  Nothing was deleted or altered: the existing commented-out card in
  `src/pages/home/content.html` is unchanged, still the only Tesla
  implementation, still ready to uncomment once genuine written approval
  exists. No Tesla asset, page, spec, pricing or lifestyle imagery was
  added anywhere in this pass.

## Alt text policy applied

Every `<img>` added describes only what is visibly in the photo (equipment
brand where legible — Fox, Sungrow, Tesla — generic description of people
as "installers", setting details actually visible). No alt text states a
location, system capacity, customer name, or result — none of that is
knowable from the photo alone, per the brief's instruction not to invent
specifications or outcomes.

## Regenerating derivatives

```
pip install pillow pillow-avif-plugin
python3 scripts/process-photos.py
```

This is a content-authoring tool, not a site runtime dependency — the
built website has no Python dependency; only whoever next updates the
photography needs it installed locally.

## Still needed (not covered by the supplied asset pack)

The pack above covered most of the original shot list in
`docs/05-photography-shotlist.md`, but not all of it. Specs for what's
still missing, in the same format used when the rest of this manifest was
originally drafted:

| Shot | Used on | Recommended source dimensions | Crop / aspect | Required alt text (adapt to the actual photo) |
|---|---|---|---|---|
| Panel cleaning | `/panel-cleaning/` | ≥ 2000×1500 | 4:3, cleaning in progress or clear before/after | "Solar panels being professionally cleaned by Oz Home Energy" |
| Bird-proofing | `/bird-proofing/` | ≥ 2000×1500 | 4:3, close-up of mesh fitted at panel edge | "Bird-proofing mesh fitted around the edge of a solar panel array" |
| Switchboard "before" | `/switchboard-upgrades/`, `/residential-electrical/` | ≥ 1600×2000 | 3:4 | "Old switchboard before replacement" — to pair with the in-progress photo already in place |
| Additional case-study sets (2 more, 3–5 photos each) | `/projects/` | ≥ 2000×1500 per photo | 4:3 or 16:9, consistent within a set | Specific per photo — never generic |

Until these exist, `/panel-cleaning/` and `/bird-proofing/` keep their
`.visual-panel` icon treatment, and `/projects/` stays as the "Recent work"
/ "in progress" photo galleries above rather than named, written case
studies (see `docs/07-owner-confirmations.md`).

Processing requirements for any of these follow the same pipeline
documented above (EXIF/GPS strip, auto-orient, AVIF/WebP/JPEG responsive
derivatives, explicit width/height, factual alt text).
