# QA Report

## Automated checks (this session)

**Link integrity** — every internal `href` in every built page was extracted
and cross-checked against the actual set of built pages
(`scripts/build.js` output). Result: **zero broken internal links.** The
five "unresolved" hits from the raw check were `/assessment/?goal=...`
query-string variants of a page that does exist — not actual breaks.

**Template integrity** — every built HTML file was grepped for unreplaced
`{{...}}` template placeholders. Result: **none found** — the build script
(`scripts/build.js`) fully resolves every page.

**Browser QA (Playwright/Chromium, headless)** — ran against a local static
server (`python3 -m http.server`) serving `site/`, covering:
- Five representative pages (`/`, `/assessment/`, `/residential-solar/`,
  `/commercial-project-enquiry/`, `/about/`) at four breakpoints each (375,
  768, 1024, 1440px)
- Horizontal-overflow check (`document.documentElement.scrollWidth` vs.
  `clientWidth`) at every breakpoint
- Console/page error capture at every breakpoint
- Interaction tests: mobile nav toggle open/close; assessment flow
  goal-preselect via `?goal=` query param, step validation (blocks advancing
  without a required answer), step advance/back; prototype form submit
  produces the on-page confirmation state

Script: `scripts/qa-playwright.js` (kept in the repo so this can be re-run
after any future change). **Final result: PASSED** — zero console errors,
zero horizontal overflow at any breakpoint, all interaction tests pass —
after the two real defects below were found and fixed.

## Manual review against the brief's technical/accessibility checklist

| Requirement | Status | Notes |
|---|---|---|
| Mobile-first responsive, no horizontal overflow | ✅ confirmed by automated pass | Fluid type scale, single-column layouts below 620–780px breakpoints throughout `styles.css`; a real 47px overflow at 375px was caught and fixed — see issue #1 below |
| Semantic HTML | ✅ | `<header>`, `<nav>`, `<main>`, `<footer>`, `<section>`, `<details>/<summary>` for FAQs (works without JS) |
| One `<h1>` per page | ✅ | Every page banner/hero has exactly one `<h1>`; verify via `grep -c "<h1" site/**/index.html` |
| Heading order | ✅ | h1 → h2 (section eyebrow+heading) → h3 (card/item titles); no skipped levels observed |
| Keyboard-accessible navigation | ✅ | Dropdowns open on `:focus-within` as well as hover/click; mobile menu uses native `<details>`/button semantics; skip-link included |
| Visible focus states | ✅ | Sitewide `:focus-visible` rule with 3px outline, not just a colour change |
| Descriptive alt text | ⚠️ Partial — see note | Real `<img>` tags aren't in this build yet (all image slots are placeholders with visible descriptive text instead of `<img>`); **when real photography is added, every `<img>` must get descriptive `alt` text** — the placeholder text itself shows what each alt should describe |
| Accessible form labels & errors | ✅ | Every input has an associated `<label for>`; assessment form uses `reportValidity()` plus a visible outline on invalid radio groups; no reliance on placeholder-as-label |
| WCAG AA colour contrast | ✅ (calculated, all pass AA; most pass AAA) | Brand blue `#0540C1` on white 8.37:1 · charcoal `#1A1A1A` on white 17.40:1 · white on charcoal 17.40:1 · white button text on brand blue 8.37:1 · muted body text `#5c5b54` on white 6.82:1 and on off-white 6.26:1 · brand blue on pale-blue surface 7.32:1 · footer body text on charcoal 10.86:1 · footer legal-links text on charcoal 5.46:1 · owner-flag badge text on its amber background 6.80:1. Every pair in the system clears the 4.5:1 AA text minimum. Verify final contrast once real photography sits behind the hero text overlay — the dark gradient overlay (`linear-gradient` to 78% black) is included specifically to protect this regardless of the photo underneath |
| Minimum tap targets | ✅ | `.btn`, nav links and form controls set `min-height: 48px` |
| Reduced-motion support | ✅ | Sitewide `prefers-reduced-motion` media query disables animation/scroll-behaviour |
| No intrusive pop-ups on entry | ✅ | None implemented; announcement bar exists but is HTML-commented-out by default (no verified current offer to show) |
| No layout shift from late-loading forms/images | ✅ | No client-side content injection before paint; assessment step visibility is CSS-driven (`.is-active`), not injected after load; placeholder media blocks reserve space via `min-height` |
| No lorem ipsum | ✅ | Confirmed — every sentence in the build is real, brief-informed copy or an explicit `[OWNER CONFIRMATION REQUIRED]` marker, never filler text |
| No incomplete sections | ✅ | Every section that lacks real data (reviews, projects, products, team bios) is an intentional, clearly labelled placeholder, not a half-built section |

## Issues found and fixed during this QA pass

1. **Real bug — 47px horizontal overflow at 375px width, on every page.**
   The automated pass caught this exactly as intended (the brief requires
   zero horizontal overflow at 375px). Root cause: the header logo's
   decorative subtitle line ("Solar · Battery · EV · Electrical" under the
   wordmark) forced the logo to ~274px wide; combined with the mobile call
   button and menu toggle on the right, the header's contents exceeded the
   available width inside a 375px viewport (335px after side padding), and
   since flex children weren't allowed to shrink, the row pushed 47px past
   the right edge instead of wrapping. **Fix**: the subtitle now only shows
   from 480px up (`site/css/styles.css`, `.brand-logo .wordmark span`), and
   the main wordmark drops slightly to 1.15rem below that width — the logo
   stays legible and the header no longer overflows at any tested
   breakpoint. Re-verified: 0px overflow at 375/768/1024/1440 across the
   five pages in the automated interaction suite, then separately
   re-checked at 375px across **all 26 built pages** — all clean.
2. **Real bug — assessment form would incorrectly block progress if you
   picked anything other than the first option in a required radio group**
   (e.g. selecting "Commercial" instead of "Residential" on step 2, or any
   goal other than the first on step 1). Root cause: for a native HTML
   radio group, only one input needs the `required` attribute for browser
   validation to work correctly — but the custom step-validator in
   `assessment.js` was using that same `[required]` query to decide which
   inputs to check for "is anything selected," so it only ever looked at
   the one flagged input's `checked` state instead of the whole named
   group. Selecting the *first* option in a group happened to work by
   coincidence; every other option in every required radio group would
   have silently blocked the user from proceeding — a serious, easy-to-miss
   conversion killer that pure code review didn't catch and interaction
   testing did. **Fix**: the validator now reads the required group's
   `name` from the flagged input, then re-queries *all* inputs sharing
   that name to check whether any is selected. Re-tested by deliberately
   selecting the second option in both step 1 and step 2 — both now
   advance correctly, and Back/Continue navigation was re-verified end to
   end.
3. **Meta descriptions over ~160 characters** on 11 pages (home, about,
   assessment, battery storage, commercial electrical, commercial project
   enquiry, locations, projects, residential electrical, solar & battery
   upgrades, switchboard upgrades) — would have been truncated mid-sentence
   in search results. Trimmed all to fit, rebuilt, re-verified at 0 remaining
   violations.
4. **Breadcrumb structured data didn't match the visible breadcrumb** on the
   four support pages (Service Request, Solar Servicing, Panel Cleaning,
   Bird-Proofing) — the JSON-LD included a "Support" crumb linking to
   `/faqs/` that wasn't shown on the page itself (no dedicated `/support/`
   hub page exists). Google's structured-data guidelines require these to
   match; removed the phantom crumb from the JSON-LD source so both agree.
5. **Two test-methodology bugs in the QA script itself**, worth recording so
   they aren't reintroduced: (a) `context.newPage({ viewport })` silently
   ignores the `viewport` option — Playwright only reads `viewport` on
   `browser.newContext()`, so every "mobile" test was actually running at
   the 1280×720 default until switched to `page.setViewportSize()`; (b) an
   initial `.click()` on a custom radio-card input failed because the real
   `<input>` is intentionally `opacity:0` (replaced visually by its styled
   `<label>` — a standard accessible custom-control pattern), and
   Playwright's `.click()` treats `opacity:0` as non-actionable; switched to
   `.check()`, Playwright's correct method for this exact pattern. **Neither
   was a site defect** — the radio-card pattern is fully mouse-, touch- and
   keyboard-operable for real users.

## Claims audit

Grepped the entire built site for every term on the brief's "claims requiring
confirmation" list (NETCC, Tesla, SAA, "years in business", "installations
completed", "best/leading/number one", specific rebate amounts, guaranteed
savings). Result: **none appear as asserted facts anywhere in the build** —
every instance is either absent entirely or shown as an explicit
`[OWNER CONFIRMATION REQUIRED]` placeholder. Spot-check command:

```
grep -rniE "netcc|tesla certified|saa accredit|years in business|guaranteed saving" site --include=*.html
```

## Known gaps / follow-ups this build cannot close on its own

1. **Live site was not independently crawled** (sandbox network policy
   blocked `ozhomeenergy.com.au`) — re-run a real crawl before relying on
   this audit as exhaustive; see `01-audit-and-positioning.md`.
2. **Forms don't submit anywhere yet** — by design, until HighLevel is
   connected per `04-highlevel-integration.md`.
3. **No real images exist yet** — every visual is a labelled placeholder;
   Core Web Vitals / image-performance claims can only be properly measured
   once real, optimised photography replaces them.
4. **Cross-browser testing was limited to Chromium** in this session — run
   a pass in Safari/WebKit and Firefox before launch, particularly for the
   `<details>`-based accordions and `backdrop-filter` header blur (has a
   graceful non-blur fallback in unsupported browsers since it's additive).
