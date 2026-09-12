# Photography & Asset Requirements

No stock photography, AI-generated imagery, or images of installations not
actually completed by Oz Home Energy appear anywhere in this build. Every
image slot instead renders as a deliberate, on-brand icon treatment
(`.visual-panel` in `site/css/styles.css` — a soft blue-gradient panel with
a brand-coloured line icon), never a dashed "placeholder" box or bracketed
"replace this" instruction — nothing here could be mistaken for a real
installation, and nothing looks unfinished either. This document is the
shoot brief and priority order; see `docs/asset-manifest.md` for the exact
dimensions, crop, filename and required alt text once real photos exist,
and for the EXIF-stripping/responsive-image pipeline every photo goes
through before publishing.

## Priority 1 — needed to launch the homepage credibly

1. **Hero image/video** — one exceptional real installation, homeowner-energy
   or team shot. Wide, high-resolution, works with a dark overlay for white
   text on top (avoid a busy sky or blown-out highlights in the top-left/
   headline area). Landscape orientation, min. 1920×1080.
2. **Five "Core Solutions" module photos** — one each for: finished
   residential solar install (roof, panels + racking visible), neat
   battery/inverter wall installation, home EV charger mounted and in
   context, a switchboard upgrade (before/after or a clean finished board),
   commercial rooftop array or commercial switchboard/plant room.
3. **Featured project photo set** — 3–5 images of one real, completed job:
   wide establishing shot, a close-up of equipment/workmanship, and ideally
   an installer at work. This becomes the homepage "Featured Project" and
   the first entry on `/projects/`.

## Priority 2 — needed for full-site credibility

4. **Team/vehicle photo(s)** for the About page — real people, real branded
   vehicles if available. No stock "generic electrician" imagery.
5. **Switchboard close-ups** — both a "before" (old fuse board, exposed
   wiring) and "after" (new, labelled, neat board) for the Switchboard
   Upgrades and Residential Electrical pages.
6. **EV charger detail shot** — close-up of the unit and cable management,
   for the EV Charging page.
7. **Bird-proofing mesh detail shot** — close-up of mesh fitted around a
   panel edge.
8. **2–3 additional project photo sets** for `/projects/` so the page
   doesn't launch with only one case study.

## Priority 3 — nice to have, can follow at launch+30 days

9. Drone/wide shots of commercial installations (only where site permission
   for photography exists).
10. Additional team photos as new projects are documented.
11. Seasonal/update shots for social and future campaign use.

## Shot standards (apply to all of the above)

- **Real work only.** Every image must be an actual Oz Home Energy
  installation or team member — this is a brief requirement, not just a
  style preference: "Never present stock or AI imagery as real Oz Home
  Energy work."
- **Landscape orientation** for hero/module shots (matches the design
  system's media containers); a few portrait/square shots are useful for
  the About/team grid.
- **Natural light where possible**, workmanship visible and in focus —
  cable runs, labelling, tidy finishing are the actual proof points this
  redesign is trying to make ("workmanship is safe, neat and dependable").
- **Consent** — commercial site photography only where the client has given
  permission; residential customer photos (if a person is visible) need the
  customer's consent, tracked the same way the case-study review consent is
  tracked.
- **File format** — deliver as high-resolution JPG/originals; the site
  build will convert to modern formats (WebP/AVIF) and responsive sizes at
  implementation time — see the QA report's performance section.

## Where each image slot lives in the code

Every spot a photo will eventually go is a `<span class="visual-panel">…svg
icon…</span>` block in the relevant `src/pages/<slug>/content.html` — grep
for it to find every slot with page context:

```
grep -rln "visual-panel" src/pages
```

See `docs/asset-manifest.md` for exactly which real file replaces which
slot, and the `<picture>`/`srcset` markup pattern to replace it with.
