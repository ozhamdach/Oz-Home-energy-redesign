<!-- Round 9 independent audit, Home page. Written by a fresh auditor that
     saw only the evidence pack (rubric, screenshots, DOM facts, Lighthouse
     and axe output for this page and five competitor home pages), never
     the code, the builder's reasoning or earlier scores. Reproduced
     verbatim; the builder does not edit it. The builder's follow-up is in
     round-9-next.md. Evidence: r9-evidence.json, r9-lighthouse-prod.json,
     r9-mobile-375.jpg, r9-desktop-1440.jpg, and
     ../competitors/2026-11-14/. -->

# Independent audit: Oz Home Energy home page (evidence pack `audit9`, 14 Nov 2026)

Conventions: a multi-part criterion scores 100% when every part is shown, 50% when some are, 0% when one or none is. PageSpeed: 90+ = 100%, 70–89 = 50%, under 70 = 0%. Fields in backticks are from `oz/evidence.json` unless a file is named.

### 1. Score for the Oz page

**Conversion (25; 5 × 5)**
- Primary quote CTA above the fold, both widths: 100%. "Get a Free Quote" in `fold.ctasFirstScreen` at 375 and 1440; visible in both first-screen PNGs.
- Sticky call/quote bar on mobile: 100%. `mobile375.fold.stickyBar` = tel link + quote button.
- Quote form ≤3 steps with progress bar: 50%. On-page form is one step, no progress bar, button "Submit" (`frames.quickForm.steps: 0`); the `/assessment/` form is not in evidence.
- Click-to-call: 100%. `telLinks: tel:+61435336336` in header, sticky bar, final CTA.
- Clear next step after submit: 50%. The quick form only says "we'll be in touch" (no who or when); the after-submit state was not tested.

Subtotal: 5 + 5 + 2.5 + 5 + 2.5 = **20.0**

**Trust and proof (20; 5 × 4)**
- Real install photos with suburb names: 50%. Owner states photos are real; `figcaptions` are generic, no suburb; Woolooware appears only on a text card. First photo shows a red-earth rural setting (`section-desktop-1440-installs.png`).
- Google rating + review count pulled live: 50%. Six named Google reviews load live (`section-desktop-1440-reviews.png`), but "5.0★" is static hero text and no review count appears.
- Named brands: 100%. `brandsLine` names panels, batteries/inverters, EV chargers.
- SAA, NSW licence number, warranty terms: 100%. Footer "Licence 382607C · SAA accredited"; warranty card: 10 years, workmanship only, manufacturer warranties separate.
- Director face and story: 50%. Photo shows two unlabelled people, first name only; the story is one quoted sentence, the rest on `/about/` (`founder`).

Subtotal: 2 + 2 + 4 + 4 + 2 = **14.0**

**Performance (15; 4 × 3.75), median of three runs**
- Mobile PageSpeed 90+: 50%. Scores 79, 78, 80; median 79.
- LCP / INP / CLS: 50%. LCP 2.3 s and CLS 0 pass. INP cannot be lab-measured; both stand-ins fail: Total Blocking Time median 820 ms, max potential FID 320 ms (Google Tag Manager ~630 ms, Facebook ~310 ms of blocking).
- AVIF/WebP with sizes set: 100%. `currentSrcExt` avif 4, webp 5, svg 3; `missingSize: 0`; format waste 0 KB.
- No render-blocking third-party scripts: 100%. `renderBlocking` lists only first-party `/css/styles.css`.

Subtotal: 1.875 + 1.875 + 3.75 + 3.75 = **11.25**

**Local SEO (15; 6 × 2.5)**
- Title and meta description: 100%. 52 and 140 characters (site-wide uniqueness not verifiable from evidence).
- One H1 with service + Sydney: 100%. `h1`: "SYDNEY SOLAR AND ENERGY SYSTEMS Your Home. Your Energy."
- Electrician schema with licence and service area: 100%. `schemaHasLicence`, `schemaHasAreaServed` true.
- FAQ schema: 100%. `FAQPage`, four questions.
- Internal links to 3+ related pages: 100%. 21 in `internalLinksInMain`.
- Natural suburb/region mentions: 100%. One sentence naming eight regions, plus Woolooware.

Subtotal: 6 × 2.5 = **15.0**

**Content and clarity (10; 3 × 3.33)**
- Buyer's questions: 50%. Rebate (dated, sourced) and install time ("usually a single visit") covered; no cost range (`dollarClaims: []`), payback only as a link, nothing on install day.
- Plain English, short paragraphs: 50%. Paragraphs short, but "STC factor 6.8 / 5.7" (first-screen strip) and "DNSP approval" (process note, FAQ) are unexplained.
- No filler: 100%. 743 words, mostly specific.

Subtotal: 1.67 + 1.67 + 3.33 = **6.67**

**Design and brand (10; 5 × 2)**
- Consistent tokens: 50%. Embedded form uses a different heading font (`section-desktop-1440-form.png`); review cards sit left of centre (`section-desktop-1440-reviews.png`); credentials grid has uneven gaps and an orphan slot (credentials PNGs).
- Clear hierarchy: 100%. Headline, one filled button, stats row (first-screen PNGs).
- Generous whitespace: 100%. Full-page PNGs.
- Custom icons/illustration: 50%. Small generic line icons, no illustration; only the "10 YEAR" badge is bespoke.
- Premium next to competitors: 50%. Cleaner than AHE, Isolux, RESINC; hero photo is dim and fence-dominated (`desktop-1440-first-screen.png`), install photos are snapshots; 1KOMMA5 and PSC look richer.

Subtotal: 1 + 2 + 2 + 1 + 1 = **7.0**

**Accessibility (5; 5 × 1), measured**
- 4.5:1 contrast: 100%. axe `violations: []` at both widths; Lighthouse accessibility 100 ×3 (third-party frames not covered).
- Keyboard navigable: 100%. 12 logical `tabStops`, skip link first.
- Visible focus: 100%. `focusVisible: true` on all 12, both widths.
- Labelled form fields: 100%. Visible label per field (`frames.quickForm.lines`); programmatic labels inside the frame not verifiable.
- Alt text: 100%. `missingAlt: 0`, `emptyAlt: 0`.

Subtotal: **5.0**

| Category | Max | Score |
|---|---|---|
| Conversion | 25 | 20.0 |
| Trust and proof | 20 | 14.0 |
| Performance | 15 | 11.25 |
| Local SEO | 15 | 15.0 |
| Content and clarity | 10 | 6.67 |
| Design and brand | 10 | 7.0 |
| Accessibility | 5 | 5.0 |
| **Total** | 100 | **78.9** |

### 2. Hard gates

1. Form submits with confirmation: **NOT VERIFIABLE.** Not tested; only the owner's 10 Oct 2026 statement.
2. Performance ≥70, LCP ≤4 s: **PASS.** Median 79, LCP 2.3 s (local run).
3. No break or sideways scroll at 375px: **PASS.** `overflowX: false`; mobile PNGs show none.
4. Licence number in footer: **PASS.** "NSW Electrical Contractor Licence 382607C".
5. Accreditation stated correctly: **PASS.** "SAA accredited"; no CEC claim.
6. Claims dated/sourced: **PASS.** "As of 25 Sep 2026. Source: Clean Energy Regulator"; no dollar or percent claims.
7. Testimonials and photos: **PASS.** Reviews carry names, dates, Google marks. Photo provenance rests on the owner's statement.
8. Broken links, console errors, title/meta: **FAIL on a literal reading.** Links clean (`checked: 40`, `notOk: []`), title and description present, `consoleErrorsOnLoad: []`. But `consoleErrorsAfterScroll` records 7 messages at both widths (three are Content-Security-Policy refusals), all from Cloudflare's bot check inside the third-party form frame. The gate has no third-party exemption. Whether real visitors see them is not verifiable. If only first-party errors count, this is a PASS.
9. CTA contrast: **PASS** for every first-party CTA (axe, Lighthouse). The form's "Submit" button is in no screenshot or axe result (not verifiable).

Seven pass; gate 1 is not verifiable; gate 8 fails as written.

### 3. Page must-haves (Home)

- Hero with outcome headline + quote CTA: **partly.** CTA present; "Your Home. Your Energy." is a slogan, not an outcome.
- Rating strip: **partly.** "5.0★ Google rating" in hero stats, no review count.
- Three service cards: **present.** Six cards include solar, battery, EV.
- How it works in 3–4 steps: **present.** Four steps.
- Recent installs: **partly.** Three photos, generic captions; one suburb-named text card.
- FAQ: **present.** Four questions.
- Final CTA: **present.** Quote button, call button, quick form.

### 4. Competitor benchmark

- **AHE** Conversion: quote button above fold, tel link; no sticky bar, no form on page. Trust: brand grid, footer licence and accreditation numbers; static 4.9 badge, no count, no warranty terms, no director. Performance: Lighthouse 55, LCP 15.1 s, all PNG. SEO: no H1, no FAQ. Content: no costs, filler. Design: dated. Accessibility: axe contrast, image-alt, button-name.
- **RESINC** Conversion: 2-step form with "Step 1 of 2" bar; mobile first screen covered by cookie banner; floating "Book Now", no call bar. Trust: Google 4.9 from 3,229 ratings; brands; "Clean Energy Council-accredited" (outdated), no warranty terms, no director. Performance: 37. SEO: no Sydney, no FAQ. Content: filler. Design: busy. Accessibility: 15 contrast nodes.
- **1KOMMA5** Conversion: "Request Pricing" both widths; "next steps" block says a team member calls after the request; no sticky bar; call button has no tel link (`telLinks: []`). Trust: Google 4.5 (1,785) live; warranties stated, SAA logo, no licence number, no director. Performance: 40, TBT 8,440 ms. SEO: FAQ schema, no LocalBusiness. Content: branded jargon. Design: strongest. Accessibility: contrast, image-alt.
- **PSC** Conversion: sticky call/quote bar; one-step 15-field form, no progress bar, no after-submit copy. Trust: crew photos without suburbs; Enphase, Trina named; no rating, licence, accreditation or warranty text. Performance: 52, LCP 10.8 s. SEO: H1 "As Reliable As The Sun". Content: sparse. Design: premium, no icons. Accessibility: contrast.
- **Isolux** Conversion: desktop quote CTA; none on mobile first screen (`buttonsFirstScreen: []`); no sticky bar or form. Trust: Google widget "108 reviews"; brands; "SAA Accredited" and warranty years, no licence number. Performance: 36. SEO: H1 with service + Sydney. Content: filler. Design: template. Accessibility: contrast.

| Site | Conversion | Trust | Performance | Local SEO | Content | Design | Accessibility | Total |
|---|---|---|---|---|---|---|---|---|
| Oz | 20.0 | 14.0 | 11.25 | 15.0 | 6.67 | 7.0 | 5.0 | 78.9 |
| AHE | 10.0 | 6.0 | 3.75 | 7.5 | 3.33 | 3.0 | 1.5 | 35.1 |
| RESINC | 17.5 | 10.0 | 5.63 | 7.5 | 1.67 | 6.0 | 3.0 | 51.3 |
| 1KOMMA5 | 15.0 | 10.0 | 7.5 | 8.75 | 3.33 | 10.0 | 2.0 | 56.6 |
| PSC | 17.5 | 4.0 | 3.75 | 6.25 | 5.0 | 8.0 | 2.5 | 47.0 |
| Isolux | 10.0 | 12.0 | 5.63 | 10.0 | 1.67 | 4.0 | 2.5 | 45.8 |

Best competitor and gap (Oz minus best): Conversion RESINC/PSC 17.5, **+2.5**; Trust Isolux 12.0, **+2.0**; Performance 1KOMMA5 7.5, **+3.75**; Local SEO Isolux 10.0, **+5.0**; Content PSC 5.0, **+1.67**; Design 1KOMMA5 10.0, **−3.0**; Accessibility RESINC 3.0, **+2.0**.

The Oz page does **not** score below the best competitor in Conversion or in Trust. The Conversion margin is thin: with its cookie banner dismissed, RESINC would reach 20.0, level with Oz.

Unreliable numbers: competitor Lighthouse is one run against live sites with real latency, Oz is three local runs, so the Performance gap is overstated. RESINC's mobile first screen is covered by a cookie banner. Isolux's and 1KOMMA5's heroes were caught mid-animation. Competitor keyboard and focus were not measured (scored 50% by convention). Competitor captures stop at 12,000 px.

### 5. Blockers

Gate rows first, then by points lost.

| # | Blocker | Points lost | Severity | Tag |
|---|---|---|---|---|
| 1 | Third-party form frame logs 7 console errors after scroll (gate 8); load it on tap, or switch off the CRM bot check | gate | P0 | fixable |
| 2 | Form submission and confirmation unverified (gate 1); needs an owner-approved test lead | gate | P0 | needs-owner |
| 3 | Google Tag Manager and Facebook block the main thread: Lighthouse 79, TBT 820 ms | 3.75 | P1 | fixable |
| 4 | Quick form: no progress bar, "Submit" label, 12.5 screens down on mobile | 2.5 | P1 | needs-owner |
| 5 | No stated next step or response time after submit | 2.5 | P1 | needs-owner |
| 6 | Install photos have no suburb names | 2.0 | P1 | needs-owner |
| 7 | No Google review count; rating is static text | 2.0 | P1 | needs-owner |
| 8 | Founder block: two unlabelled people, one-line story | 2.0 | P1 | needs-owner |
| 9 | No cost range, payback answer or install-day description | 1.67 | P2 | needs-owner |
| 10 | Unexplained "STC factor" and "DNSP" | 1.67 | P2 | fixable |
| 11 | Off-brand embeds, off-centre review grid, uneven credentials grid | 1.0 | P2 | fixable |
| 12 | Generic icons, no illustration | 1.0 | P2 | fixable |
| 13 | Dim hero photo, snapshot-quality install photos | 1.0 | P2 | needs-owner |

Points lost total 21.08 (100 − 78.92).

### 6. Steal list

1. **RESINC**: a two-step booking form with a visible "Step 1 of 2" progress bar on the home page, and a rating row giving score and count per review platform (RESINC desktop full-page PNG, column 3).
2. **1KOMMA5**: a "next steps" block whose first step says what happens after the request is sent, and a reviews header showing rating plus count (1KOMMA5 desktop full-page PNG, column 3).
3. **Isolux**: package cards matching system size to quarterly bill band, with warranty years per component (Isolux phone full-page PNG, column 3).

### 7. Verdict

The Oz home page scores **78.9/100**. Seven gates pass, gate 1 (form submission) is not verifiable, and gate 8 fails as written because the third-party form frame logs console errors. It does **not pass**: it is 11.1 short of 90 whatever is decided on gate 8. It is not below the best competitor on Conversion (20.0 vs 17.5) or Trust (14.0 vs 12.0), though both leads are narrow. The three changes worth the most: replace the quick form with a branded form of three steps or fewer, with a progress bar and a stated next step and response time (+5.0, and it can remove the gate 8 errors); stop Google Tag Manager and Facebook blocking the main thread (+3.75); add cost ranges, a payback answer and an install-day description in plain words (+3.33). Suburb captions, a live review count and a fuller founder block add a further +6.0.
