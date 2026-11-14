# Home — Round 8 audit (builder-scored, to find blockers)

Date: 2026-11-14. Branch `site-loop/home`, at `main` 9bb2041 (the same code
that is live). Scored against the **production build with analytics on**
(`BUILD_TARGET=production ENABLE_ANALYTICS=true`), served locally with
`serve`. That is the configuration customers get.

This round is scored by the builder to produce the blocker list. It is not
the independent audit the scorecard requires; that is run on the last round
of this run (see `round-9-audit.md`).

## What changed since round 7 (11 Oct, 87/100)

- Live Google reviews widget on Home (5 Nov).
- New hero: "Your Home. Your Energy.", three proof numbers, trust facts band.
- Chooser moved to the top; two sections that repeated it merged into it.
- "Recent installs" photos restored (missing from production since 29 Sep).

## Score: 81.5/100

| Category | Max | Score | Evidence and deductions |
|---|---|---|---|
| Conversion | 25 | 22 | Primary CTA "Get a Free Quote" on the first screen at 375px and 1440px; sticky call/quote bar on phones; click-to-call; "what happens next" copy beside the form. **-3:** the quick form's button says "Submit", it is one step with no progress cue, and the redirect to the confirmation page could not be verified (HighLevel settings). |
| Trust and proof | 20 | 18 | Live Google reviews widget (6 reviews, all 5 stars); named brands; SAA; licence 382607C in the footer; 10-year workmanship terms; founder photo and quote; real install photos. **-2:** install photo captions carry no suburb or system size ("Residential solar installation"). |
| Performance | 15 | 7.5 | Lighthouse mobile, production with analytics, 3 runs: **70 / 71 / 73**, LCP 3.1-3.3 s, TBT 770-1,090 ms, CLS 0-0.02. Rubric asks for 90+, LCP under 2.5 s, no render-blocking third-party scripts. **-7.5:** two Google Fonts stylesheets block render (est. 880 ms); GTM blocks the main thread 576 ms and Meta Pixel 317 ms; LCP render delay 2.8 s although the hero image arrives in 54 ms. |
| Local SEO | 15 | 12.5 | Unique title and description; one h1 with service + Sydney; Electrician schema with licence and areaServed; FAQPage schema; 12 internal links in the body. **-2.5:** the body names no Sydney region or suburb at all ("Sydney" appears once). |
| Content and clarity | 10 | 7 | Plain English; rebate strip with as-of date and source; process in four steps; links to the payback and rebate guides. **-3:** no cost range or payback (needs Oz's prices); nothing on how long an install takes or what happens on install day, although the site answers both on other pages. |
| Design and brand | 10 | 9.5 | Consistent tokens, strong hero, clear hierarchy. **-0.5:** credential badges are small and uneven on phones (Tesla mark, lone Ohme card). |
| Accessibility | 5 | 5 | axe: 0 violations at 375px and 1440px; Lighthouse accessibility 100; every image has alt text; focus visible on all 12 first tab stops. |

Round 7 gave Performance 15/15 from the **preview** build, which has no
tracking scripts (this round: 97 / 98 / 98, LCP 2.0-2.4 s). The drop to 7.5
is a fairer measurement, not a regression.

## Hard gates

1. Form submits with confirmation: owner-verified 10 Oct; not re-tested (would create a lead). Pass, not re-verified.
2. Mobile Lighthouse under 70 or LCP over 4 s: 70 / 71 / 73, LCP 3.1-3.3 s. **Pass, by one point.** Treated as a P1.
3. No sideways scroll at 375px: pass.
4. Licence number in the footer: "NSW Electrical Contractor Licence 382607C". Pass.
5. Accreditation stated as SAA: pass.
6. Rebate, price or savings claim without an as-of date: rebate strip carries "As of 25 Sep 2026. Source: Clean Energy Regulator". No dollar or percentage claims on the page. Pass.
7. Fake testimonials or stock photos as installs: reviews come from the live Google widget; photos are real. Pass.
8. Broken links, console errors, title, description: 31 links checked, all 200; both in-page anchors exist; 0 console errors on load (Lighthouse errors-in-console passes). After the embedded HighLevel form loads, Cloudflare's bot check inside that third-party frame logs 7-8 CSP messages; they are not from this site's code. Pass, with that note.
9. CTA contrast: axe colour-contrast passes. Pass.

## Blockers

| # | Blocker | Severity | Tag |
|---|---|---|---|
| 1 | Performance on the real (tracked) build is 70-73, one point above a hard gate. Google Fonts CSS blocks render; GTM and Meta Pixel run during load. | P1 | fixable (fonts, when tracking starts) |
| 2 | Body copy names no Sydney region or suburb. | P1 | fixable (eight region pages are already published) |
| 3 | Install photos have no suburb or system size. | P1 | part fixable (the Woolooware system is real and owner-approved), rest needs-Oz |
| 4 | No install-time or install-day answer on Home. | P1 | fixable (reuse the answers already published on /faqs/ and the solar page) |
| 5 | No cost range or payback on Home. | P1 | needs-Oz (prices) |
| 6 | Form button "Submit", redirect unverified, single step. | P1 | needs-Oz (HighLevel) |
| 7 | Reaching 90+ with tracking on needs GTM and the Pixel to wait for the visitor's first interaction, which stops counting visitors who leave without touching the page. | P1 | needs-Oz (decision) |
| 8 | Credential badges are PNG, and uneven on phones. | P2 | fixable |

No P0. Score is under 90, so the loop continues to round 9.
