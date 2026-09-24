# Home — blockers after Round 1, and why this goes to Oz now rather than Round 2

Score: 64/100. All 9 hard gates pass — nothing here is broken, the gap is
missing content.

## P0 (breaks a gate / loses leads)
None. All 9 hard gates pass.

## P1 (3+ points, or a clear conversion/trust hit)

1. **[needs-Oz]** No live Google rating + review count strip. Needs a Google
   Business Profile link (or Places API key) — not supplied (content pack).
2. **[needs-Oz]** "Recent installs" photos (added this round) have no suburb
   or system-size caption (e.g. "Castle Hill, 13 kW + 13.5 kWh battery").
   ~25 real photos exist in the repo but without those labels — inventing
   them is exactly what this project's standing rule forbids.
3. **[needs-Oz]** No named panel/inverter brands anywhere on Home. Battery
   and EV brands are shown (FoxESS, Sungrow, Sigenergy, Ohme, Evnex); panel
   and inverter brands are not confirmed.
4. **[needs-Oz]** No director photo or founder story on Home (or anywhere —
   About page doesn't have one either per the content pack).
5. **[needs-Oz]** `/assessment/` is a single embedded HighLevel iframe, not
   a visible ≤3-step form with a progress bar. The multi-step structure
   lives inside HighLevel's own form builder, outside this repo — it needs
   Oz (or whoever has HighLevel access) to either reconfigure that form or
   confirm a different embed/form ID that already has the step structure.
6. **[needs-Oz]** No cost ranges / payback / rebate content on Home. The
   scorecard's shared rebate/STC/price data file (a Page 0 item) doesn't
   exist yet — building it needs either Oz's own current figures or a
   decision to use the public sources already cited in the scorecard
   (Solar Choice, Why Solar) with an as-of date. Note: Home's own
   must-haves don't call for this directly — it's the Home-batteries and
   Solar-panels pages' job per the scorecard's page table — so this may
   turn out to be a smaller loss on Home than the rubric's generic wording
   suggests once those pages exist and are linked.

## P2 (polish, under 3 points)

7. **[needs-Oz]** No suburb/region mentions beyond generic "Sydney" —
   would need a real suburb list, which the content pack notes is missing.
8. **[not a blocker, judgment call]** The homepage routes through a
   6-card "what would you like your energy system to do?" grid rather than
   literally "3 service cards (solar, batteries, EV chargers)." Given the
   page's stated job is "route to the right service," 6 cards (which also
   cover electrical upgrades and commercial) arguably serves that job
   better than 3 would. Not scored as a deduction; flagged for visibility
   in case Oz disagrees.
9. **[needs-Oz, Page 0 item]** The scorecard's competitor benchmark hasn't
   been run yet, so Design/brand's "beats the top Sydney competitors" can't
   be confirmed against real comparators — this is explicitly a
   before-the-loop-starts (Page 0) step, not something a single page round
   can complete on its own.

## Why this isn't a normal Round 2 prompt

Every P1 above is needs-Oz, and together they account for roughly 27 of
the 36 points separating this page from 90. There is no more Oz-independent
implementation work available right now that would move the score — writing
a Round 2 build prompt today would just re-run the same audit against the
same content and land on the same number, which would spend rounds without
making progress. Per the scorecard's own design ("Before the loop starts…
without [the content pack and page 0] most pages stall around 80" — Home is
currently below even that, mainly on Trust, precisely because the content
pack items above aren't supplied yet), the honest next step is to hand this
list to Oz rather than mechanically consume Round 2 now. Once any of items
1–6 are supplied, the loop should resume immediately with a real Round 2
build step targeting whichever items are now unblocked.
