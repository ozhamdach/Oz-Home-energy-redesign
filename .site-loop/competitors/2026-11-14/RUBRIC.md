# Top 1% Solar Website Scorecard (extract, verbatim from the owner's scorecard doc)

A page ships when it scores 90/100 or more and passes every hard gate.

## Scoring rubric (100 points)

Conversion and trust carry half the score, because a top 1% solar site is
judged by quote requests, not looks.

| Category | Points | What a 100% score looks like |
|---|---|---|
| Conversion | 25 | One primary CTA ("Get my free quote") visible above the fold on mobile and desktop; sticky call/quote bar on mobile; quote form 3 steps or fewer with a progress bar; click-to-call phone; clear next step after submit |
| Trust and proof | 20 | Real install photos (not stock) with suburb names; Google rating + review count pulled live; named brands installed (panels, inverters, batteries); SAA-accredited installer, NSW licence number, warranty terms stated plainly; director face and story |
| Performance | 15 | Mobile PageSpeed 90+; LCP under 2.5s, INP under 200ms, CLS under 0.1; images in AVIF/WebP with sizes set; no render-blocking third-party scripts |
| Local SEO | 15 | Unique title and meta description; one H1 with service + Sydney; LocalBusiness/Electrician schema with licence and service area; FAQ schema where FAQs exist; internal links to 3+ related pages; suburb/region mentions that read naturally |
| Content and clarity | 10 | Answers the buyer's real questions: cost ranges, payback, rebates, how long install takes, what happens on install day; plain English, short paragraphs; no filler copy |
| Design and brand | 10 | Consistent brand tokens (colour, type, spacing); clear visual hierarchy; generous whitespace; custom icons/illustration; feels premium next to the top Sydney competitors |
| Accessibility | 5 | WCAG 2.2 AA: 4.5:1 text contrast, keyboard navigable, visible focus, labelled form fields, alt text on every meaningful image |

Score each criterion 0, 50% or 100% of its share, and write one line of
evidence per deduction. Performance and Accessibility come from the measured
Lighthouse (mobile) and axe numbers, not from judgement.

"Criterion" means each semicolon-separated item in the right-hand column.
Each category's points are shared equally between its criteria.

## Page must-haves: Home

Job: win trust in 5 seconds, route to the right service.
Must-haves: hero with outcome headline + quote CTA; rating strip; 3 service
cards (solar, batteries, EV chargers); "how it works" in 3–4 steps; recent
installs; FAQ; final CTA.

## Hard gates (automatic fail)

Any one of these fails the page, whatever its score.

1. Quote or contact form doesn't submit, or submits without confirmation
2. Mobile Lighthouse Performance under 70, or LCP over 4s
3. Layout breaks or scrolls sideways at 375px wide
4. NSW electrical contractor licence number missing from the footer (NSW requires it in advertising)
5. Installer accreditation stated wrongly: installers are now accredited by Solar Accreditation Australia (SAA), not the CEC, since 2024
6. Rebate, price or savings claim with no "as of" date or source
7. Fake or unattributed testimonials, or stock photos presented as real installs
8. Broken links, console errors, or missing page title / meta description
9. Text contrast under 4.5:1 on any CTA

## Blocker severity

| Severity | Meaning |
|---|---|
| P0 | Breaks a hard gate or loses leads (broken form, missing licence, LCP over 4s) |
| P1 | Costs 3+ points or clearly hurts conversion or trust |
| P2 | Polish, under 3 points |

## Competitor benchmark

Every audit compares the page with the matching page on 3–5 of the best
solar sites. The auditor scores the competitors' pages on the same rubric
and reports the gap per category. A page can't pass if it scores below the
best competitor in Conversion or Trust, even at 90+.

Steal list: the audit notes 1–3 things a competitor does better (ideas and
structure, never copied copy or images).

## Independent audit

The page is scored by a fresh auditor that sees only evidence, never the
builder's reasoning, code changes or past scores. Every lost point cites a
screenshot area, metric or HTML line.
