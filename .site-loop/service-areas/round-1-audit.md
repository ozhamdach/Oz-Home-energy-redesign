# Service areas (/locations/) — Round 1 audit

Audited 24 Sep 2026. Branch `site-loop/service-areas` from `main`,
carrying the Greater Sydney restoration + sitewide fixes from PRs
#30-#35.

**This page's job is Local SEO, and its single biggest lever — real
suburb/region pages — is genuinely blocked.** No suburb list has been
supplied (confirmed in the page's own scope-note comment), and per this
project's standing rule, invented suburb names or doorway pages are
never an option. Everything below is real progress within that limit,
not a substitute for it.

## Score: 67 / 100

| Category | Points | Score | Evidence |
|---|---|---|---|
| Conversion | 25 | 18 | CTA + sticky bar present. Same structural form gap as elsewhere. |
| Trust and proof | 20 | 8 | Added a genuine "local installs" photo section (3 real, previously-verified photos spanning solar/battery/EV) — directly answers the must-have's "local installs" want. |
| Performance | 15 | 15 | Lighthouse mobile: 98, LCP 2.1s, TBT 0ms, CLS 0 — the added Google Maps iframe doesn't hurt this. |
| Local SEO | 15 | 8 | Added a plain Google Maps embed (no API key needed) centred on Sydney — the must-have's "map" item. H1 rewritten to carry service + Sydney. **The real miss:** no suburb/region pages exist — this is the page's actual job and it's blocked on a real content-pack gap, not something a build round can close. |
| Content and clarity | 10 | 5 | Minimal by design — this page's job isn't buyer-question content. |
| Design and brand | 10 | 8 | Same as other pages. |
| Accessibility | 5 | 5 | axe-core: 0 violations at 375px and 1440px, including the new map iframe (has a proper `title` attribute). |

## Hard gates — all 9 pass

Lighthouse 98/LCP 2.1s (the third-party map embed doesn't regress this); 0px overflow; no rebate/price claim; genuine photos, not stock; 0 console errors/broken links; title+meta present; CTA contrast via axe.

## Still open (needs-Oz) — this is the blocking one

**A real suburb/region list.** Everything else on this page's job (map, local-install proof, unique hub copy) is now in place; suburb-level pages are the one structural piece this round can't build without it.

## Score vs. threshold

67/100, all 9 hard gates pass. The gap to 90 is concentrated almost entirely in the missing suburb pages — the scorecard's own rubric weights Local SEO at only 15/100, but this page's specific job depends on exactly that category more than any other page's does.
