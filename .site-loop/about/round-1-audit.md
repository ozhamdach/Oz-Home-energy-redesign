# About (/about/) — Round 1 audit

Audited 24 Sep 2026. Branch `site-loop/about` from `main`, carrying the
same sitewide fixes as PRs #30-#34, plus the founder's-story section
already built on the (still-open) Home PR #29 branch — pulled in rather
than rewritten, since it's the same real content either way.

## Score: 72 / 100

This page now meets 3 of its 4 must-haves outright — the strongest
starting position of any page audited so far.

| Category | Points | Score | Evidence |
|---|---|---|---|
| Conversion | 25 | 18 | CTA + sticky bar present. Same structural form gap as elsewhere. |
| Trust and proof | 20 | 10 | Licensing section now states the actual licence (382607C) and SAA (S5265652) numbers instead of the bare claim. Founder's story present (text, no photo yet — pulled from the Home branch's `#founder` section). Genuine team photo already existed (`team-installers-571.jpg`). **Miss:** no insurance detail; no live rating; the team photo is installers, not specifically a director photo. |
| Performance | 15 | 15 | Lighthouse mobile: 97, LCP 1.8s, TBT 0ms, CLS 0. |
| Local SEO | 15 | 10 | H1 → `About Oz Home Energy — Sydney's Electrician-Led Energy Company`. No suburb mentions beyond the (now correct) Greater Sydney service-area statement. |
| Content and clarity | 10 | 6 | Clear about approach, licensing and warranty; doesn't cover buyer cost questions, which isn't this page's job per the scorecard. |
| Design and brand | 10 | 8 | Same as other pages. |
| Accessibility | 5 | 5 | axe-core: 0 violations at 375px and 1440px. |

## Hard gates — all 9 pass

Licence 382607C + SAA S5265652 now stated on-page (not just footer); Lighthouse 97/LCP 1.8s; 0px overflow at 375px; no rebate/price claim on this page; genuine team photo (no stock-as-real); 0 console errors/broken links; title+meta present; CTA contrast via axe.

## Still open (needs-Oz)

1. Insurance detail (type/amount, or simply confirmation it can be stated) — not mentioned anywhere currently, and not invented.
2. A photo of Oz specifically, for the founder-story section (the existing team photo is genuine but shows installers, not the founder).
3. Same `/assessment/`-adjacent form-structure question as other pages.

## Score vs. threshold

72/100, all 9 hard gates pass. This page is closer to done than most — the remaining gap is small and specific (insurance detail, a founder photo) rather than a large structural hole.
