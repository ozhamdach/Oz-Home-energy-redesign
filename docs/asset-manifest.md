# Photography Asset Manifest

Structured, implementation-ready spec for every real photograph this build
needs. No stock, AI-generated, competitor or manufacturer-catalogue imagery
is used anywhere — see `docs/05-photography-shotlist.md` for the fuller shot
brief and priority ordering; this document is the exact dimensions/crop/
filename/alt-text spec once real photos exist, plus the processing pipeline
they go through before publishing.

Until a row below is fulfilled, its spot in the design renders as the
on-brand `.visual-panel` icon treatment (see `site/css/styles.css`) — never
an empty box, a dashed placeholder, or "coming soon" text. Swapping in the
real photo means replacing the `<span class="visual-panel">…</span>` block
at that spot with a `<picture>`/`<img>` using the `srcset`/sizes/filenames
below.

## Manifest

| # | Shot | Used on | Recommended source dimensions | Crop / aspect | Filename (`site/img/photos/…`) | Required alt text (adapt bracketed detail to the actual photo) |
|---|---|---|---|---|---|---|
| 1 | Homepage hero | `/` hero | ≥ 2400×1350 landscape | 16:9, safe area keeps subject out of the left third (headline sits there) | `home-hero.jpg` | "Oz Home Energy [installer/team] installing [solar panels / a battery / an EV charger] at a Sydney property" |
| 2 | Crew / team | `/about/` | ≥ 2000×1500 | 4:3, group clearly visible, outdoors or on-site preferred over studio | `team-about.jpg` | "The Oz Home Energy installation team on site in Sydney" |
| 3 | Branded van | `/about/`, footer/contact context | ≥ 2000×1500 | 4:3 or 3:2, van signage legible, on-location not showroom | `branded-van.jpg` | "Oz Home Energy branded service vehicle" |
| 4 | Solar roof installation | `/residential-solar/` solution module, homepage "Generate" | ≥ 2000×1500 | 4:3, roofline and panel layout both visible, avoid blown-out sky | `residential-solar-install.jpg` | "Solar panel array installed on a Sydney home's roof by Oz Home Energy" |
| 5 | Battery installation | `/battery-storage/` solution module, homepage "Store" | ≥ 1600×2000 or 1600×1600 | 3:4 or 1:1, wall-mounted unit(s) plus visible cabling/labelling | `battery-install.jpg` | "Home battery storage unit installed and wired by Oz Home Energy" |
| 6 | EV charger installation | `/ev-charging/` solution module, homepage "Charge" | ≥ 1600×2000 or 1600×1600 | 3:4 or 1:1, charger + cable management, ideally with a vehicle in frame | `ev-charger-install.jpg` | "Home EV charger installed on a garage wall by Oz Home Energy" |
| 7 | Switchboard / electrical work | `/residential-electrical/`, `/switchboard-upgrades/`, homepage "Control" | ≥ 1600×2000 | 3:4, before/after pair preferred (see #7a/#7b) | `switchboard-after.jpg` (+ `switchboard-before.jpg` if supplied) | "Upgraded, labelled switchboard installed by Oz Home Energy" / "Old switchboard before replacement" |
| 8 | Commercial project | `/commercial-solar/` and related commercial pages | ≥ 2400×1350 | 16:9, rooftop array or plant room, wide establishing shot | `commercial-project.jpg` | "Commercial solar installation on a Sydney business rooftop" |
| 9 | Panel cleaning | `/panel-cleaning/` | ≥ 2000×1500 | 4:3, cleaning in progress or clear before/after | `panel-cleaning.jpg` | "Solar panels being professionally cleaned by Oz Home Energy" |
| 10 | Bird-proofing | `/bird-proofing/` | ≥ 2000×1500 | 4:3, close-up of mesh fitted at panel edge | `bird-proofing-mesh.jpg` | "Bird-proofing mesh fitted around the edge of a solar panel array" |
| 11–13 | Three case studies (3–5 photos each: wide establishing shot, workmanship close-up, installer at work) | `/projects/` (see `src/data/site-status.json` — this page stays unpublished/noindexed in production until these exist) | ≥ 2000×1500 per photo | 4:3 or 16:9 per shot, consistent within a set | `project-1-01.jpg`, `project-1-02.jpg`, … (one numbered folder/prefix per case study) | Specific per photo, describing the actual property/system/stage shown — never generic |

## Processing pipeline (applies to every row above once supplied)

1. **Strip EXIF/geolocation data** from every original before it enters the
   repository or any build pipeline — residential job-site photos routinely
   carry GPS coordinates in EXIF, which must never be published (a privacy
   and, for some customers, a safety issue). `exiftool -all= <file>` (or
   equivalent) as a mandatory pre-commit step for this specific folder.
2. **Generate responsive WebP/AVIF derivatives** at minimum 3 widths (e.g.
   480/960/1920px) per source image, with the original JPG kept as the
   `<img>` fallback inside a `<picture>` element:
   ```html
   <picture>
     <source type="image/avif" srcset="…-480.avif 480w, …-960.avif 960w, …-1920.avif 1920w" sizes="…">
     <source type="image/webp" srcset="…-480.webp 480w, …-960.webp 960w, …-1920.webp 1920w" sizes="…">
     <img src="…-960.jpg" width="…" height="…" loading="lazy" alt="…">
   </picture>
   ```
   `loading="lazy"` on every image below the fold; the hero image should NOT
   be lazy-loaded (it's above the fold on page load).
3. **Always set explicit `width`/`height`** (or `aspect-ratio` in CSS) to
   prevent layout shift when the real image replaces the `.visual-panel`
   block.
4. **Alt text is required, not optional**, and must describe the specific
   photo (subject, system type, context) — the table above gives a
   template, not filler text to publish verbatim across every photo of that
   type.

## Consent and photography rights

Per `docs/05-photography-shotlist.md`: commercial site photography only
where the client has given permission; any residential customer or their
property shown needs the customer's consent, tracked the same way project
case-study consent is tracked in `docs/owner-inputs-required.md`.
