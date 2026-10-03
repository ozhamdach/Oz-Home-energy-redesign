# Higgsfield Premium Visual Plan — "Engineered Energy Independence"

**Status:** Phase 1 audit complete (read-only). Phase 3 hero drafts are the next gate; nothing below has been implemented.
**Baseline:** `main` @ `4cecebe` (3 Oct 2026). Working branch: `claude/higgsfield-premium-visual-pass`. No merge, no deploy.
**Scope guard:** improvement pass on the existing redesign. Information architecture, conversion pathways, form IDs, CRM embeds, Tesla content and all official badge artwork are untouched.

---

## 1. How this audit was run (and its limits)

- Served the committed `site/` build locally and measured it with Playwright (Chromium 141) at 375 / 768 / 1440 px, axe-core 4 (WCAG 2 A/AA, 2.1 AA, best-practice) and Lighthouse 12 (mobile, 3 runs).
- **Limits:** the audit environment blocks Google Fonts and the HighLevel embed (`link.ozhomeenergy.com.au`). Headings therefore rendered in fallback fonts and the final-CTA iframe was empty. Lighthouse figures are *relative baselines*, not live-site numbers. Typography and the final-section height must be re-checked on the live preview. A PageSpeed Insights call against the Pages preview was rate-limited (HTTP 429) and should be re-run before sign-off.
- Lighthouse and axe are not part of the repo's QA scripts; they were run from outside the repo. Phase 5 QA needs them added or run the same way so before/after is like-for-like.

## 2. Baseline numbers (homepage)

| Measure | 375 | 768 | 1440 |
|---|---|---|---|
| Page height (CSS px) | 12,161 | 9,702 | 8,951 |
| Hero box | 375×715 | 768×640 | 1440×696 |
| Hero source shown | ~39% of image width | ~90% of image width | ~64% of image height |
| LCP element | hero AVIF (1200w) | hero AVIF | hero AVIF (1600w) |
| Transfer (no fonts/embeds) | 290 KB | 398 KB | 324 KB |

- Lighthouse mobile (3 runs, identical): **Performance 95**, Accessibility 100, Best Practices 96, SEO 69 (the only SEO failure is `is-crawlable`, i.e. the intentional preview `noindex`). LCP 2.48 s, FCP 1.53 s, TBT ≈ 0, CLS 0, Speed Index 3.86 s.
- axe: 0 violations. 5 colour-contrast nodes are "incomplete" (text over imagery) and need a manual check once the hero changes.
- Structure: one H1; h2→h3 without level skips on the homepage and the six other pages sampled (battery-storage, tesla-powerwall-3, residential-solar, ev-charging, commercial-solar, projects). Footer column titles are h3 after the final-CTA h2 (acceptable).
- **Headroom is thin: 95 against a 90 floor.** Any hero video must load strictly after first paint and be skipped on mobile/Data Saver/reduced-motion, or it will cost the page more than the margin.

### Build, image and deploy pipeline

- `scripts/build.js` assembles `src/**` into `site/**/index.html`. Default is preview (`noindex, nofollow`); `BUILD_TARGET=production` flips indexing, and analytics needs a second gate (`ENABLE_ANALYTICS`).
- `scripts/build-pages.js` rewrites to relative paths for the GitHub Pages subpath. `deploy-pages.yml` deploys **only on push to `main`**, so a feature-branch push cannot deploy.
- `qa.yml` (PR + `main`) runs both builds, `qa-static-checks.js` and `qa-playwright.js` (widths 360/390/768/1024/1440).
- Images: `scripts/process-photos.py` (Pillow + pillow-avif-plugin) → AVIF + WebP + JPEG at 2–3 widths, EXIF/GPS stripped, widths recorded in `site/img/photos/manifest.json`. **There is no video pipeline today**; `ffmpeg` is available for WebM/MP4 encoding.

## 3. The three visual weaknesses costing the most perceived quality

**1. The hero neutralises its own photograph.**
A 35 %→78 % dark gradient sits over a sunny photo, and a centred, four-line H1 ("Here." is orphaned at 1440) sits directly on the roof and panels, which are the subject. The 4:3 source is cropped to ~2.07:1 on desktop and to a ~39 %-wide slice on a 375 px phone. The result reads as a murky navy background with text rather than a premium photograph. On the mobile fold there are also five competing call controls (header phone, hero CTA, hero call, sticky-bar call, sticky-bar quote).
*Consequence for Higgsfield:* a loop placed under this treatment would be nearly invisible. The cinematic moment only pays off if the hero layout changes (Section 6).

**2. No signature idea; the page runs on one repeated template.**
Eleven full-width sections, eight with identical 128 px / 128 px padding, alternating white / pale-blue / off-white bands, each opening with a centred eyebrow + H2 + lede over a grid of bordered or shadowed boxes. About 24 elements carry a "card" class, plus process and FAQ items. 17 small outline icons (sun, bolt, battery, plug) are the generic solar-template vocabulary. The "Generate → Store → Charge → Control" block is four disconnected white cards with a document icon standing in for "Control", so the concept the brand is built on ("controlled energy flow") is described but never drawn.

**3. Photography is handled inconsistently.**
- "Recent installs" declares a 4:3 frame but renders ~1.1:1 (307×281), force-fitting one landscape and two portrait sources. The EV charger loses its top.
- Image ratios on one page vary widely: `/battery-storage/` carries ten images across five ratios (0.56, 1.10, 1.45, 2.46, 2.50); `/ev-charging/` five (0.75–2.33).
- The `/battery-storage/` banner photo is so heavily darkened by its overlay that the equipment is barely distinguishable.
- On photo banners the CTAs are centred (`.hero-ctas { justify-content:center }`) under left-aligned copy (copy starts at x=120, buttons at x=459 at 1440).
- The first "Recent installs" image (`regional-rooftop-overview-01`) reads as a non-suburban site, which dilutes "Sydney home". The caption makes no location claim, so it is factually safe; it is a positioning question for the owner.
- The Tesla badge renders visibly smaller and paler than the Evnex / Ohme / SEC marks on mobile. The artwork is locked, so only cell sizing can be equalised.

## 4. Repeated sections, unnecessary cards, weak transitions

**Repeated or redundant**
- Credential statements appear three times above the fold area: the hero trust line, the proof strip ("Licensed NSW Electrical Contractor / Sydney service area / Residential & commercial capability"), then the full credentials section. The proof strip adds no legal or accreditation content that is not already present (the licence number lives in the footer) and is the cleanest removal.
- The founder excerpt is reused verbatim on `home`, `battery-storage`, `residential-solar` and `about`.
- The final CTA stacks two buttons, a 701 px HighLevel quick-quote iframe (duplicating `/assessment/`) and, on mobile, the sticky bar. The section is 1,283 px tall at 1440.
- Flow (4 cards), process (4 items), pathways (6 cards), split (2 panels), gallery (3 cards) are five grids of short blurbs in three card dialects.

**Weak transitions**
- Hard 1 px borders between flat colour bands; hero → proof strip → off-white trust section is two light bands in a row.
- Pale-blue bands (`--blue-100`) are a full-width blue wash, against the brief's "blue as accent, not a wash".
- The charcoal final CTA runs straight into the charcoal footer, so the two read as one block.

## 5. Where motion helps and where it would hurt

**Helps comprehension**
- One hero loop (sky and foliage only).
- A single thin connector line that draws once, in view, across Generate → Store → Charge → Control.
- Gentle reveal (opacity + ≤ 8 px translate, once) on section headings and process steps.
- Existing hover response on pathway cards (2 px lift) and FAQ chevron: keep as is.

**Would only distract (do not add)**
- Anything on the trust badges or the warranty strip (official artwork, approved Tesla content, and the credibility message needs to be still).
- Parallax, scroll hijack, cursor effects, animated counters, looping decorative icons, second background video, motion on the founder statement.

The stylesheet already has a global `prefers-reduced-motion` rule and `main.js` has no motion code, so any reveal/video behaviour is new, small, and must default to off.

## 6. Visual concept — "Engineered Energy Independence"

Intent: a Sydney installer that looks like it draws its work to tolerance.

**One signature device — "the line".** A fine 1 px charcoal/blue rule system with small registration ticks and numerals (01–04), used for the flow diagram, process steps and section openers. It replaces the icon-in-a-box cards and is the only place blue appears at scale.

**Rules**
- Photography first, full colour, unwashed. Text sits on a localised scrim behind the copy only.
- Blue `#0560C1` is an accent: CTAs, eyebrow numerals, the flow line, focus ring. No full-width blue bands.
- Section rhythm alternates white / off-white with one charcoal moment (final CTA), separated by spacing and a hairline rather than colour blocks.
- One surface language: hairline border, 12 px radius, one shadow level. Boxes only where they carry an action (pathways, CTAs).
- One image ratio per gallery, with an explicit equipment-safe `object-position` per image.

**Hero layout proposal (for Phase 5, after media approval)**
- Copy left-aligned in the lower-left, max ~600 px, `text-wrap: balance`, scrim only behind the text column (≤ 0.55 at the text edge, clear toward the right).
- Mobile: static photo, copy bottom-anchored, sticky call bar held back until the hero has scrolled out.
- H1, eyebrow, supporting line and both CTAs keep their exact wording and stay HTML.

**Typography/brand notes to confirm**
- CSS brand blue is `#0560c1`, matching the brief; the owner's asset-pack README says `#0540C1`. The brief is treated as authoritative.
- Headings use Montserrat 600/700; body uses Inter. The brief says "Font: Montserrat". Kept as is unless the owner wants Montserrat for body.

## 7. Higgsfield: what is actually available

Checked live on 3 Oct 2026; nothing assumed from earlier documentation.

- Workspace plan **Plus, 110 credits**. `auto_create_project` is off, so generations are not filed into a project.
- "Cinema Studio 4.0" is not named in the catalogue. The current equivalent is **`cinematic_studio_video_v2` ("Cinema Studio Video")**: image roles `image` / `start_image` / `end_image`; 16:9 supported; 3–12 s; `mode` std|pro; `sound` on|off; `genre`; `speedramp`; `multi_shots`; `cfg_scale` 0–1.
- **There are no discrete dolly / arc / focal-length parameters.** Camera control is by prompt text only. "Explicit camera controls" in the brief is therefore met through explicit camera language plus `speedramp: linear` and a fixed `cfg_scale`, not through dedicated controls.
- Other video models exist (Kling 3.0 Turbo, MiniMax H3, Veo 3, Grok, Gemini Omni, FLUX 3 Video). They are not used for this prototype; Cinema Studio is the brief's stated preference.
- Edit/Canvas-type tools are present as separate utilities (outpaint, reframe, upscale, background removal). **No generative editing of real photographs is recommended in this pass** (Section 9, A6).

## 8. Phase 3 hero prototype specification

### 8.1 Reference eligibility check (the brief's three conditions)

| Condition | Finding |
|---|---|
| Owned / permitted | `assets/original-photography/web-pack-solar/solar-residential-complex.webp`. The repo did not record who took it; **the owner confirmed on 3 Oct 2026 that it is theirs to use** (the check is recorded here; no contract or third-party claim was in play). |
| No identifiable customer information | Pass on inspection: no house number, street sign, letterbox or text visible. |
| No address / number plate / person | Pass: no vehicles, no people, no plate. A street-level view of a residential building; not geolocated (no EXIF; stripped on all derivatives). |

### 8.2 Source frame
- Pixels unchanged; cropped to 16:9 (1600×900) from the 1600×1200 original, window chosen to keep sky above the roofline (room for cloud motion), the full roof with its ~15 panels, brick wall, fence and kerb. Saved as `assets/higgsfield/source-references/hero-reference-16x9.jpg`. No generative step touches it.

### 8.3 Model and common settings
`cinematic_studio_video_v2`, 16:9, 5 s, `mode: std` (low-cost drafts), `sound: off`, `genre: auto`, `speedramp: linear`, `cfg_scale: 0.7` (higher adherence to "do not change" instructions), `multi_shots: false`.

### 8.4 Four drafts (varied on camera and loop strategy only)

| # | Camera | Lens | Loop strategy |
|---|---|---|---|
| D1 | Very slow dolly-in (~2–3 % scale over the clip) | 35 mm | start frame only |
| D2 | Very slow dolly-in | 50 mm | start frame only |
| D3 | Restrained lateral arc (~3°) left to right | 35 mm | start frame only |
| D4 | Near-imperceptible dolly-in (≤ 1 %) | 35 mm | start = end = reference (closed loop) |

Prompt spine (identical across drafts, camera sentence differs): *Single continuous locked-horizon shot of the supplied suburban home. Natural early-morning Sydney light. Only the thin cloud and the eucalyptus foliage move, very slightly. The house, roof tiles, every solar panel and its row layout, fence, kerb and bollards stay exactly as in the reference. No people, no vehicles, no text, no logos, no reflections added, no new equipment, no lens flare. Realistic colour, moderate depth of field.* The model has no negative-prompt field, so exclusions are written into the prompt.

### 8.5 Selection rubric (1–5, each)
Realism · Brand fit · Architectural stability · Equipment accuracy · Premium quality · Lack of AI artefacts · Text legibility behind overlay · Loop quality · Mobile cropping potential.
**Hard reject** any draft below 4 on realism, stability or equipment accuracy, or showing any panel-row, roofline, fence or bollard drift.

### 8.6 How "drift" will be judged
Extract first / middle / last frames; compare the roofline, panel grid, fence posts and bollards against the reference after allowing for the intended dolly scale; flag any panel appearing, vanishing or changing count; check the sky region separately. Findings are reported per draft with frame references, and scores are only given for what could actually be inspected.

### 8.7 If the real photograph cannot be animated cleanly
Fall back to the abstract, product-neutral macro sequence (sunlight across a solar-cell texture → restrained blue pulse → clean charging-light transition → blue-and-charcoal end frame). Internal label: *"Conceptual brand visual — not an Oz Home Energy installation."* It would depict no property, installation or branded product, and not be placed adjacent to "Recent installs".

**Gate:** drafts, settings, scorecard, recommendation and observed distortion are presented to the owner. No high-resolution final is generated before approval.

## 9. Proposed asset list

| ID | Asset | Purpose | Tool | Source | Public? | Notes |
|---|---|---|---|---|---|---|
| A1 | `hero-reference-16x9.jpg` | Reference frame for drafts | none (pixel crop) | genuine original | No (provenance only) | committed to `source-references/` |
| A2 | `hero-loop.webm` (VP9, 720p, 5–7 s) | Desktop background loop | Cinema Studio Video | A1 | Yes, decorative | target ≤ ~1.2 MB; created only after approval |
| A3 | `hero-loop.mp4` (H.264) | Fallback for A2 | ffmpeg from A2 | A2 | Yes, decorative | target ≤ ~1.5 MB |
| A4 | Hero still / poster | Poster + LCP | none | **existing** hero image, unchanged | Yes | stays the initial poster per brief |
| A5 | Abstract macro sequence | Fallback only | Cinema Studio Video | text prompt | Only if A2 abandoned | internally labelled conceptual |
| A6 | Edited real photos | none proposed | — | — | — | crops + `object-position` solve the findings; no generative edits to evidence |
| A7 | Campaign package | Optional, separate | Ads Studio | brand kit | Not part of the website pass | **no Tesla variants** without Tesla's written approval for those ads |
| — | Founder portrait | not generated | — | — | — | needs a real photograph from Oz |

## 10. Generated-media risks (could be mistaken for factual evidence)

| Risk | Mitigation |
|---|---|
| R1. Animated hero of a real property read as footage of a real job | motion limited to sky/foliage; geometry locked; video is decorative (`aria-hidden`); poster stays the real still; manifest records "AI-animated from a genuine still"; no placement beside "Recent installs" |
| R2. Fallback macro read as a product shot | no visible branding, no module/battery that resembles a manufacturer product |
| R3. AI "founder" or team imagery | not produced |
| R4. Generatively relit or outpainted gallery photos | not used; gallery stays genuine, crop-only |
| R5. Ads depicting installations | real photos or abstract only; no fake installation imagery |
| R6. Partner artwork reaching a third-party tool | Tesla, Ohme, Evnex, SAA, SEC, NSW and warranty artwork never uploaded to Higgsfield |

## 11. Phase 5 plan (after media approval)

Order stays: Hero → Credentials → Founder statement → Pathways → Generate/Store/Charge/Control → Residential & Commercial → Recent work → Process → FAQ → Final CTA.

1. Hero: new layout (Section 6), scrim, orphan-free H1 wrap, video enhancement (below).
2. Remove the proof strip; keep the hero trust line and the credentials section unchanged (badges, Tesla card, warranty strip, licence/SAA wording all untouched).
3. Flow section becomes one connected "line" diagram, not four boxes; "Control" gets an appropriate mark.
4. Replace `--blue-100` bands with white/off-white; one charcoal moment.
5. Gallery: one ratio, explicit crops; ban 4:3-with-portrait-source mismatch site-wide via a shared class.
6. Fix photo-banner CTA alignment; lift the battery banner so the photo is visible.
7. Reveal motion (once, ≤ 8 px) and the flow line draw-in, both off under `prefers-reduced-motion`.
8. Optional: sticky mobile call bar deferred until after the hero.

**Hero video implementation (when approved):** poster = existing `<img>` (unchanged, `fetchpriority=high`, remains LCP). Video injected after `load` + idle; only when width ≥ 900 px, `prefers-reduced-motion: no-preference`, `saveData` off, tab visible; `muted loop playsinline preload="none" aria-hidden="true" tabindex="-1" disablepictureinpicture`, WebM then MP4 sources, no audio track, paused when off-screen. Failure of any source leaves the poster. No layout change (the media box already exists), so CLS stays 0.
**Retire the video if** mobile Lighthouse < 90, LCP materially worse, a visible loop jump, deformed detail, unreliable text contrast, or the still looks more premium.

## 12. Constraint checklist (for the final report)

- Tesla badge, battery-page Tesla section, `/tesla-powerwall-3/`, "Tesla Energy Certified Installer": not touched, not uploaded.
- Ohme, Evnex, SAA, SEC, NSW contractor artwork, Oz warranty badge: not touched, not uploaded.
- 10-year workmanship warranty wording, manufacturer-warranty separation: unchanged.
- No invented reviews, ratings, prices, savings, payback, rebates, suburbs, install counts, outcomes, compatibility, qualifications, insurance, response times, case studies, awards, certifications.
- Phone `0435 336 336` retained; licence/accreditation info retained (licence number in footer).
- No generated image presented as an installation, customer property, case study, workmanship evidence, a real person or a manufacturer's product.
- Titles, meta descriptions, canonicals, preview `noindex`, JSON-LD, form IDs, CRM embeds, genuine photo alt text preserved.

## 13. Unverified items and owner decisions

**Unverified**
1. ~~Ownership/permission for the hero photograph~~ confirmed by the owner, 3 Oct 2026 (Section 8.1).
2. Provenance of the 19 images under `site/img/recent-work/` (e.g. `goodwe-home-ev-charger.webp`): not in the original-photography pack and not documented in `docs/asset-manifest.md`. Not used as Higgsfield inputs.
3. `/projects/` (currently unpublished) has an H1 containing "Real Reviews". The owner decided on 24 Sep not to headline the 6 reviews; worth reconciling before that page is published. Out of scope for this pass.
4. Live-site Lighthouse/typography (blocked in the audit environment).
5. Brand-blue hex discrepancy between the brief/CSS (`#0560C1`) and the asset-pack README (`#0540C1`).

**Decisions needed**
1. Confirm you own the hero photo, then approve a draft (or choose the fallback).
2. Approve the hero layout change (left-aligned copy, localised scrim).
3. Remove the proof strip?
4. Keep the founder excerpt on `home`, `battery-storage` and `residential-solar`, or limit it to `home` and `about`?
5. Swap the regional rooftop image in "Recent installs" for a suburban Sydney one if you have it?
6. Supply a real founder photo (nothing will be generated).
7. Montserrat for body text, or keep Inter?
8. Comfort with the hero being disclosed as AI-animated in the asset manifest only, rather than on the page.

## 14. Phase 3 draft record (owner-approval gate)

Status: **four low-cost drafts generated; nothing downloaded into the repo, nothing implemented, nothing deployed.** Drafts live in the Higgsfield workspace only. Discarded generations are not committed.

### 14.1 What was run

| Item | Value |
|---|---|
| Tool / model | Higgsfield MCP → `cinematic_studio_video_v2` (Cinema Studio video) |
| Reference | `hero-reference-16x9.jpg` (pixel crop of the genuine homepage hero; no generative edit), imported to Higgsfield by URL as media `26e94b40-5c57-47c8-beb9-ab384e55f75b` |
| Settings (all four) | 16:9 · 5 s · `mode: std` · `sound: off` · `genre: auto` · `speedramp: linear` · `cfg_scale: 0.7` · `multi_shots: false` |
| Output (all four) | 1280×720, 5.04 s, H.264 MP4 |
| Cost | 5 credits each, 20 total. Balance after: 90 credits |
| Presets | A suggested "IN THE DARK" preset was declined; drafts were generated literally from the prompt |
| Not uploaded | No Tesla, Ohme, Evnex, SAA, SEC, NSW or warranty artwork, no contracts or emails. The reference contains none |

| Draft | Camera sentence | Frames used | Higgsfield job | Size |
|---|---|---|---|---|
| D1 | 35 mm, very slow dolly-in | start image only | `a2c407b4-9418-4613-86c8-c4859551f80a` | 5.68 MB |
| D2 | 50 mm, very slow dolly-in | start image only | `cedd2d92-3211-4d96-b80c-f6c733dfd0f3` | 5.46 MB |
| D3 | 35 mm, ~3° lateral arc | start image only | `ee25a6da-5471-48b2-85c3-5176a73ed57b` | 6.12 MB |
| D4 | 35 mm, <1 % dolly, closed loop | start = end = reference | `67280234-0523-48ac-acef-235eec6f6dda` | 1.76 MB |

One batch item (D1) was rejected at submission with an "out of credits" error although the balance was sufficient; no job was created and nothing was charged. It was resubmitted on its own and succeeded.

### 14.2 How the drafts were inspected, and the limits of that

The sandbox cannot download the drafts (egress policy), so they were inspected in the built-in browser pane with an in-page canvas analysis at 320×180 greyscale: for each draft, the reference was aligned to the first, middle and last frames by brute-force scale + translation search, and the residual (mean absolute grey-level difference) was measured for the roof/panel band, the panel strip, the sky, and a Sobel edge map. A static clip's own frame-to-frame noise (≈ 6.1 band / 4.5 strip / 18.5 edge) is the floor: a residual near that floor after a rigid zoom means the geometry was only scaled, not reshaped.

What this method **cannot** show: panel-by-panel comparison at full resolution (the pane gives ~800×450), subtle texture artefacts, foliage and cloud motion quality, text legibility behind the final overlay (layout not built yet), and whether an audio track is absent (`sound: off` was set; not independently verified). Scores below are provisional on that basis; "n/a" means not inspected.

### 14.3 Measurements

| Draft | Total push (scale at last frame vs reference) | Residual after alignment (band / strip / edge) | Reading |
|---|---|---|---|
| D1 | 1.154 (≈ 15 %) | near floor | Rigid dolly, geometry preserved. Push is ~5× what was asked (2–3 %). |
| D2 | 1.086 (≈ 8.6 %) | near floor | Rigid dolly, geometry preserved. Push ~3× what was asked. |
| D3 | not a pure scale | band 20 → 36 · strip 13.6 → 31 · edge 51 → 99 | Viewpoint change is **invented**: perspective on the building and fence is re-drawn. Not faithful to the real property. |
| D4 | 1.000 | at floor | Effectively **static**: sky MAD start → end ≈ 0.85 grey levels. A perfect loop, but no visible motion. |

Observed distortion, stated plainly: D1 and D2 exceed the requested restraint but do not change the building, roof, panel layout, fence or bollards in the checks that were possible. D3 fabricates a new viewpoint (reject). D4 does not move enough to justify a video over the still. Neither D1 nor D2 loops on its own: each ends ~9–15 % closer than it starts.

### 14.4 Rubric scorecard (1–5, provisional)

| Criterion | D1 | D2 | D3 | D4 |
|---|---|---|---|---|
| Realism | 4 | 4 | 2 | 4 |
| Brand fit | 4 | 4 | 3 | 4 |
| Architectural stability | 4 | 4 | 1 | 5 |
| Equipment accuracy (panel rows and count) | 4 | 4 | 2 | 5 |
| Premium quality | 4 | 4 | 2 | 2 (reads as a still) |
| Lack of AI artefacts | 4 | 4 | 2 | 5 |
| Text legibility behind overlay | n/a | n/a | n/a | n/a |
| Loop quality | 2 | 3 | 1 | 5 (but no motion) |
| Mobile cropping | n/a | n/a | n/a | n/a |

Mobile cropping is not applicable by design: the video would load only at ≥ 900 px wide; phones keep the real still.

Hard-reject rule (below 4 on realism, stability or equipment accuracy): **D3 is rejected.** D4 passes the rule but fails the purpose (no visible motion). D1 and D2 pass provisionally.

### 14.5 Recommendation

**D2 as the base**, because it has the smaller push and the stable geometry. Two ways to make it usable, owner's choice:

- **A. Use D2 with loop handling in post** (ping-pong or a cross-dissolve at the seam, ffmpeg). No further Higgsfield spend. The visible push stays at ~9 %.
- **B. One gentler regeneration** of D2 (≈ 5 credits at `std`) with the camera sentence tightened toward a 2–3 % move, then loop handling. Preferred if you want the more restrained look the plan called for.

Either way, a final would be checked again frame-by-frame and against the kill criteria in Section 11 before anything reaches the site. If you would rather not use any animated version, the real still stays as the hero and Section 11 step 1 still applies for the layout and scrim.

Pending owner confirmation: **permission to use the hero photograph** (Section 8.1). Nothing further is generated or built until that and a draft choice are confirmed.

## 15. Owner decisions, 3 Oct 2026, and the Phase 5 review build

### 15.1 Decisions received
1. The hero photograph is the owner's: confirmed.
2. **D2, handled as Option A** (loop blended in post; no further Higgsfield credits, balance stays 90).
3. Layout decisions (hero layout, proof strip, founder excerpt pages, gallery image swap, founder photo, body font, manifest disclosure): *the owner wants to see them first.* A review build was made for that; those decisions remain open.

### 15.2 What the review build contains (branch only; not merged, not deployed)
| Change | Scope | Notes |
|---|---|---|
| Hero layout | homepage only (`.hero--home`) | Whole photo shown unwashed. From 1200 px the copy sits in the sky and a thin credentials rail runs along the bottom of the photo; below 1200 px a 16:9 band of the photo sits above the copy (no text on the photo). Scrim only behind the copy (masked away before the roofline). Wording, links, poster image unchanged. `Storage&nbsp;—` stops the em dash starting a line. |
| Proof strip | removed | It repeated the hero trust line and the credentials section; the licence number stays in the footer. The CSS it alone used is removed. |
| "Recent installs" | homepage only (`.photo-gallery--mixed`) | Frames follow each photo's shape; explicit `object-position`; the 40 px default `figure` margin that narrowed every card is reset here. Photos unedited. |
| Flow block | `.flow-diagram` (homepage only) | Four boxes become one hairline with four nodes (horizontal from 821 px, vertical below). Draws once on scroll; fully drawn without JS or with reduced motion. Decorative icon chips removed; text unchanged. |
| Section rhythm | homepage | Pale-blue bands replaced by white / off-white; one charcoal block. |
| Hero video | `site/js/hero-video.js`, `site/media/hero-loop.{webm,mp4}`, `<template>` in the hero | Wired in (see §15.6). Loads after `load` and idle, at 900 px and wider, with no reduced-motion, Data Saver or 2G; the still stays as the poster and the fallback. |
| Loop pipeline | `scripts/process-hero-loop.py` | Pendulum time-remap of the approved draft (see below). |

**Not touched:** Tesla, Ohme, Evnex, SAA, SEC, NSW contractor artwork and copy; the Oz warranty badge and the 10-year workmanship wording; the credentials section; titles, meta, canonicals, JSON-LD, form IDs, CRM embeds; the other pages' banners and galleries; the sticky mobile call bar.

### 15.3 Loop handling (Option A)
The approved draft is one slow dolly-in. A cross-dissolve at the seam would double every panel edge, so the pipeline plays it forward and back along a cosine time curve (12 s period, 24 fps): the camera eases to a stop at both ends, the first and last frames are the same frame, and only Higgsfield's own frames are used (fractional positions are a blend of two neighbouring frames, which differ by under a pixel). Output: silent 1280×720 WebM (VP9) and MP4 (H.264). The push is the draft's own ~8.6 %, so it reads as slow breathing, not a stronger move.

### 15.4 QA of the review build (local, Chromium; Google Fonts and the CRM embed are blocked in the audit environment, so fonts were supplied locally for screenshots)
| Check | Before (`main`) | After |
|---|---|---|
| Repo static QA | pass | pass |
| Repo Playwright suite (360/390/768/1024/1440, console errors, overflow, interactions) | pass | pass |
| axe (WCAG 2 A/AA, 2.1 AA, best-practice) at 1440 | 0 violations | 0 violations |
| axe "needs manual review" (contrast over imagery) | 5 nodes | 13 nodes: hero text over the photo (measured by hand, below) and header nav |
| Hero text contrast, measured from pixels behind the text, poster still, 1200–1920 px | not measured | eyebrow ≥ 8.2:1, H1 ≥ 6.2:1, supporting line ≥ 7.1:1, Call button label ≥ 11.7:1, credentials line ≥ 5.0:1 (worst pixel) |
| Lighthouse mobile ×3 (local, simulated) | 95 / 95 / 95 perf, 100 a11y, 96 best practices | 95 / 96 / 97 perf, 100 a11y, 96 best practices; SEO 69 = the intentional preview `noindex` |
| LCP / CLS (Lighthouse) | 2.5 s / 0 | 2.5–2.6 s / 0 |
| Page height 375 / 768 / 1440 px | 12,161 / 9,702 / 8,951 | 12,320 / 10,181 / 9,088 |
| Hero box 375 / 768 / 1440 px | 715 / 640 / 696 | 738 / 804 / 810 |
| Horizontal overflow | none | none |

**Trade-offs to know about:** the hero is taller at 768 and 1440 (the whole photo is shown); on a phone the primary CTA sits 46–54 px lower than today (top at ~527 px on a 375×667 screen against 481 px now), still fully above the sticky bar from 375×667 up, but the in-hero Call button falls behind the sticky bar's own Call button on 667 px-tall screens. The 360×640 case is the same as today (CTA wraps and clips under the bar).

**Not verified:** real-device Safari/Firefox (the suite is Chromium only; H.264 playback in the Playwright Chromium build was not exercised, only WebM); live-site PageSpeed (rate-limited earlier); the final-CTA section height with the CRM iframe loaded. Hero-video results are in §15.6.

### 15.5 Still open
Founder excerpt on `home`, `battery-storage`, `residential-solar` or fewer; whether to swap the regional rooftop image in "Recent installs" (the page stays factually safe either way; a real suburban Sydney photo from the owner is needed); real founder photo; Montserrat vs Inter for body text; disclosure of the AI-animated hero in the manifest only; whether to carry the banner/gallery/reveal changes to other pages.

### 15.6 Hero video: build, QA and kill-criteria result (3 Oct 2026)

**Build.** `scripts/process-hero-loop.py` on the approved D2 clip (121 frames) → 288-frame, 12 s, 24 fps loop. WebM (VP9, CRF 35) **642 KB**; MP4 (H.264, CRF 27) **826 KB**; both 1280×720, one video stream, no audio. Targets were ≤ 1.2 MB / ≤ 1.5 MB. Both files carry an AI-disclosure `comment` tag (see `docs/asset-manifest.md`).

**Wiring.** `<template id="hero-video-template">` inside `.hero-frame` (WebM first, MP4 second); `/js/hero-video.js` added through `meta.json` `extraScripts`; `build-pages.js` copies `media/`. The `<img>` poster is unchanged and remains the LCP element.

**What the footage is.** D2 is the model's re-render of the still, so frame 0 differs slightly from the photograph (mean colour within 1.7 of 255 per channel; luma difference ≈ 2–3.5 of 255, fine texture; measured rendering offset ≤ 0.4 px). Across the loop the camera moves in 8.6 % and back. Roof panels, window frames, fence and trees match the photograph at the start, at the far end and in between; no panel appears, disappears or bends (checked by eye on full-resolution frames and strips; an automated panel count was too noisy to use and is **not** relied on).

**Seam.** Ideal first/last frame difference is 0.006 (luma, of 255). After encoding it is ≈ 2 luma on fine texture only (a difference map shows edges and foliage, no structure), the same size as the encoder noise between any two frames; first and last frames are visually indistinguishable at 2× zoom. Raising quality (x264 CRF 22, one keyframe) only lowered it to ≈ 1.6 at 2× the file size, so the defaults were kept. Keyframes elsewhere fall in fast-moving stretches where they are masked.

**Behaviour (Playwright, Chromium, Range-capable server, 24/24 checks on both the root build and the relative-path `pages-dist` build).** Plays and advances at 900 / 1280 / 1440 / 1920 px; box equals the frame box; video fetched with HTTP 206; no console errors. No video element and no media request at 375 px, 899 px, reduced motion, Data Saver, 2G. If the media request fails the video is removed and the still is intact. Paused when the hero is off-screen and resumed on return; removed if the window is narrowed below 900 px. A `play()` interrupted by a `pause()` (AbortError) is no longer treated as a failure.

**Text contrast over the video** (pixels behind the text, text hidden, sampled at 0, 1.5, 3, 4.5, 6, 7.5, 9 and 10.5 s plus the poster; worst pixel over 1200–2560 px): eyebrow ≥ 8.0:1, H1 ≥ 6.0:1, supporting line ≥ 7.0:1, Call button label ≥ 11.4:1, credentials line ≥ 4.7:1 (the credentials line's worst case, at 1200 px, is the still itself, not a video frame). No element is more than 0.9 below its value on the still.

**Performance (Lighthouse 12, local, simulated).** Mobile ×3 sequential: perf 97 / 94 / 94, a11y 100, best practices 96, LCP 2.5–2.6 s, CLS 0, TBT 14–58 ms, 303 KB transferred (no video on phones). Before the video: 95 / 96 / 97, LCP 2.5–2.6 s, so no regression. Desktop ×2: perf 100, LCP 0.65 s, CLS 0, TBT 0 ms (979 KB transferred including the first part of the WebM). Three runs launched in parallel gave one 85 (TBT 411 ms) from CPU contention; the sequential runs are the valid ones. Repo static QA and Playwright suite pass; axe at 1440 and 375: 0 violations.

**Kill criteria (§11):** none triggered. Mobile Lighthouse ≥ 90 ✔; LCP unchanged ✔; no visible loop jump ✔ (to be judged by the owner on a real screen); no deformed detail ✔; contrast reliable ✔; "still looks more premium" is the owner's call.

**Bug found and fixed on the way (my own, in the review build).** Above ~1460 px viewport width the hero box stopped at 1458 px (aspect-ratio plus `max-height` shrinks the box) and left a white strip on the right. The hero is now `width: 100%`, its height cap follows the viewport (`clamp(820px, 100vh − 76px, 1000px)`), and the 16:9 frame is anchored to the top so only ground is cropped on very wide screens. Checked at 1366, 1440, 1600, 1920 and 2560 px. Beyond ~2560 px (ultra-wide) the lower part of the house is cropped.

**Still not verified:** Safari, Firefox and real phones/tablets; H.264 (MP4) playback in a browser (Chromium here picked WebM); how the loop looks on a real display at full brightness; the live Pages preview.
