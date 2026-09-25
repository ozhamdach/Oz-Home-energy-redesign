# Home — Round 4 audit (cumulative: Rounds 2–4)

Rounds 2–4 were small, owner-content-driven updates rather than full
build/fix/audit cycles each — logged together here since each round was
a few lines of new real content, not a new implementation pass. Re-scored
against the same scorecard used in Round 1.

## Score: 69 / 100 (up from 64 in Round 1)

| Category | Points | Score | Change since Round 1 |
|---|---|---|---|
| Conversion | 25 | 18 | Unchanged — `/assessment/`'s single-step HighLevel embed is still the one open Conversion gap. |
| Trust and proof | 20 | 9 (was 5) | **+4.** Named panel brands (Jinko Solar, JA Solar, Trina Solar) and battery brands (FoxESS, Sungrow, Sigenergy, GoodWe) added Round 2 — inverter brands still not confirmed. Founder's story added Round 3 (About `#founder` + homepage excerpt) — no photo yet, so only partial credit. Google rating strip deliberately not added (Round 4, owner decision: 6 reviews reads thin standalone; the real review widget already does this job) — still a technical miss on this specific sub-criterion, but now a closed decision rather than an open blocker. Photo captions still lack suburb/system labels. |
| Performance | 15 | 15 | Unchanged — re-verified: axe/Playwright still clean after all content additions, no new render-blocking resources added (all new content is text). |
| Local SEO | 15 | 9 | Unchanged — H1 wording was refined (Round 3, owner-requested blend of the two options) but still carries "Sydney" + a service term, so the scored criterion doesn't move either way. |
| Content and clarity | 10 | 5 | Unchanged — founder story is a Trust element, not a buyer-question (cost/payback/rebate) answer, so it doesn't move this category. |
| Design and brand | 10 | 8 | Unchanged. |
| Accessibility | 5 | 5 | Re-verified — axe-core 0 violations at 375px and 1440px on the current build (H1 + founder story included). |

## Hard gates

All 9 still pass — re-verified via the full `scripts/qa-playwright.js` suite and `qa-static-checks.js` (preview + production) after every push in this branch, most recently after the founder's-story commit.

## What moved and why

- **Round 2:** named panel brands (Jinko Solar, JA Solar, Trina Solar) and battery brands (FoxESS, Sungrow, Sigenergy, GoodWe) added to the homepage's "brands we install" line, now grouped by category. Tesla was supplied among the battery brands but deliberately excluded — same Exhibit 3 §10(b) consent restriction already blocking the Tesla badge (naming Tesla in marketing text is still "publication" under that clause). See `docs/owner-inputs-required.md`.
- **Round 3:** H1 refined to `Sydney Solar & Battery Storage — Lower Your Bills.` — owner asked for a version blending the SEO-required wording with the original's benefit-driven punch. Founder's story added verbatim (owner-supplied) as a full section on `/about/#founder`, plus a short excerpt + link on the homepage. No photo supplied yet — both sections stay text-only by design.
- **Round 4:** Google rating strip decision closed. Owner supplied the actual review count (6) after the originally-sent `share.google` link couldn't be reached from this environment; decided not to headline a 6-review count near the hero, keeping the existing review widget as the proof mechanism instead. Documented as a closed decision in `docs/owner-inputs-required.md`, not left as an open blocker.

## Still open (needs-Oz)

1. Suburb + system-size labels for the "Recent installs" photos.
2. A photo of Oz, for the founder-story sections (About `#founder` + homepage excerpt).
3. A decision on `/assessment/`'s single-step HighLevel embed vs. a native ≤3-step form with a progress bar.
4. Real suburb/region names for natural local-SEO mentions (currently "Sydney" only).
5. Inverter brands (panel and battery brands are now named; inverter brands are not).

## Score vs. threshold

69/100, all hard gates pass. Still below 90 — the remaining gap is concentrated in the five items above, all needing further owner input. No further Oz-independent implementation work is available right now beyond what's already been done across Rounds 2–4.
