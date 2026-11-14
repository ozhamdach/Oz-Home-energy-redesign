# Home — after the round 9 audit (builder's follow-up and next prompt)

Independent score: **78.9/100** (`round-9-audit.md`). Pass mark is 90 plus
every hard gate. The page is ahead of all five competitor home pages
captured the same day (best competitor total 56.6) and is not below the
best competitor on Conversion (20.0 vs 17.5) or Trust (14.0 vs 12.0).

Why it is lower than the 81.5 the builder gave in round 8 with more fixed:
round 8 was builder-scored; this one is a fresh auditor applying 0 / 50 /
100 per criterion literally. The two are not comparable; use 78.9.

## Fixed after the audit (same branch, not re-scored)

| Audit blocker | What was done |
|---|---|
| 10. Unexplained "STC factor" and "DNSP" | Rebate strip now says "a base rate of 6.8 certificates (STCs) per kWh of usable capacity" (the rebate guide's own words). "DNSP approval" on Home now reads "approval from your electricity network (the DNSP)"; the FAQ says "the export limit your electricity network approves". |
| 11. Review grid off-centre | The third-party widget used four columns in a wide frame, leaving the right quarter empty with six reviews. Capped at 1000px (two even columns) and centred. |
| 11. Uneven credentials grid | An incomplete last row is now centred at every width (no empty slot, no lone card on the left). |
| 5. No stated response time by the form (part) | "We aim to respond within one business day" added beside the quick form. Same commitment already published on /assessment/, /request-a-quote/ and /battery-storage/ since 11 Oct 2026. Owner re-confirmation requested (docs/owner-inputs-required.md). |

Checked: static QA in both modes, the browser suite the CI way, and
screenshots at 375, 768 and 1440px. Expected gain if re-scored: about
+1.7 (plain words) and up to +1 (design consistency); the response-time
line may lift "clear next step" from 50%.

## Hard gates: two the auditor did not pass

- **Gate 1 (form submits with confirmation): not verifiable.** Not tested
  because a submission creates a real lead. Owner confirmed it on 10 Oct
  2026. Needs one owner-approved test enquiry after the HighLevel changes.
- **Gate 8 (console errors): fails on a literal reading.** The page's own
  code logs nothing (0 on load). Seven messages appear once the embedded
  HighLevel form loads; all come from Cloudflare's bot check inside that
  third-party frame. Visitors never see them. Two ways to close it:
  1. Leave it and record the gate as "first-party errors only" (builder's
     recommendation: the messages are not this site's and change nothing
     for a visitor).
  2. Load the quick form only when the visitor taps "Open the quick form".
     Removes the messages for everyone who does not tap, at the cost of
     one extra tap for those who do.
  This is a gate disagreement, so it goes to the owner.

## Open blockers (all need the owner)

| # | Blocker | Points | What is needed |
|---|---|---|---|
| 3 | Tracking scripts hold the phone's main thread (79, TBT 820 ms) | 3.75 | Decision: may GTM and the Meta Pixel wait for the visitor's first tap or scroll? Lifts the score to about 95; visitors who leave without touching the page stop being counted. |
| 4 | Quick form: one step, no progress bar, button "Submit" | 2.5 | HighLevel: button text "Get my free quote"; or approve replacing the quick form with a short stepped form built on this site that posts to HighLevel. |
| 5 | Next step and response time after submit | 2.5 | HighLevel redirect to /quote-received/; confirm the one-business-day promise. |
| 6 | Install photos have no suburb | 2.0 | Suburb and system size for each of the three photos (and the first photo is a rural shed; a Sydney roof would serve better). |
| 7 | No review count; rating is static text | 2.0 | Google Business Profile link, so the count can be shown and kept current. |
| 8 | Founder block: two unlabelled people, one-line story | 2.0 | Which person is Oz (for a caption), and 2-3 more sentences of his story for Home, or approval to reuse the About page's. |
| 9 | No cost range, payback or install-day description | 1.67 | Price ranges; what happens on install day, in Oz's words. |
| 13 | Dim hero photo, snapshot-quality install photos | 1.0 | Better photos when available. |
| 12 | Generic icons, no illustration | 1.0 | Fixable without the owner; P2, left for a design pass. |

With every owner item supplied the page reaches roughly 95.

## Steal list (from the audit)

1. RESINC: a two-step form with a visible "Step 1 of 2" bar, and a rating
   row with score and count per platform.
2. 1KOMMA5°: a "next steps" block whose first step says what happens after
   the request is sent.
3. Isolux: package cards matching system size to quarterly bill band.

## Round 10 build prompt (run when the owner has answered)

1. Apply the tracking decision in `src/partials/analytics-head.html`.
2. Replace the quick form per the owner's choice (HighLevel label and
   redirect, or a stepped on-site form with a progress bar and a stated
   next step). Then one owner-approved test enquiry for gate 1.
3. Captions: suburb + system on each "Recent installs" photo
   (`src/pages/home/content.html`); swap the first photo if a Sydney roof
   is supplied.
4. Rating strip: live count beside "5.0" once the profile link is on file.
5. Founder block: caption naming Oz; longer story.
6. Price ranges and payback in the shared data file with as-of date and
   source; an "install day" block in the owner's words.
7. Re-audit with a fresh auditor on the same evidence format
   (`../competitors/2026-11-14/EVIDENCE-NOTES.md` describes the pack).
