# Production cutover runbook

Created 8 Oct 2026 (audit-remediation pass). This is the order of
operations for switching this redesign from the GitHub Pages preview to
the real production deployment at `ozhomeenergy.com.au`. Nothing in this
document has been executed — it is a runbook, not a log of completed
work. See `docs/launch-audit-2026-10-08.md` for the current, verified
state this runbook starts from, and `docs/owner-inputs-required.md` for
every open item in full detail.

Do the steps in this order. Do not skip ahead on anything marked as
needing owner confirmation, a real browser, or a live-account action —
each later step in this list assumes the ones before it are actually
done, not merely planned.

1. Confirm the final host and redirect capability.
2. Make the repository private as a separate owner action if desired.
3. Confirm 0435 336 336 as the canonical number across the website,
   HighLevel, Google Business Profile and citations.
4. Confirm any NETCC wording before publication.
5. Confirm monitored email and business hours before adding them.
6. Run real test submissions for all five unique HighLevel forms.
7. Verify contact creation, pipeline, tags, SMS and email automations for
   each form.
8. Verify the 10-year warranty matches quotations, contracts and
   handover documents.
9. Complete Privacy Policy, Terms, Complaints and analytics/privacy
   review.
10. Run preview static QA.
11. Run production-mode static QA.
12. Run the complete Playwright/axe suite.
13. Test Safari on a physical iPhone.
14. Test Chrome on a normal desktop or Android device.
15. Generate the production build with `BUILD_TARGET=production`.
16. Keep `ENABLE_ANALYTICS` disabled unless its privacy requirements have
    been approved.
17. Configure genuine HTTP redirects from every existing production
    route.
18. Point the apex domain to the production deployment.
19. Confirm `www` redirects to the apex domain.
20. Verify homepage title, meta description, canonical, schema and one
    H1.
21. Verify `robots.txt` and `sitemap.xml`.
22. Verify all forms again on the production domain.
23. Check for mixed content, 404s and redirect loops.
24. Submit the sitemap in Google Search Console.
25. Begin the scheduled post-launch indexing audit.

## Notes on specific steps

These are context pointers only — they do not change the order or
content of the steps above.

- **Step 3**: `docs/launch-audit-2026-10-08.md` records the known
  conflict as of this pass — current production reportedly displays
  `0420 113 216`, this redesign displays `0435 336 336` (verified
  internally consistent and now permanently QA-gated). This step is where
  that conflict actually gets resolved, not before.
- **Step 6–7**: deliberately not attempted by this or any prior audit
  pass — see the "no live form submissions" constraint in
  `docs/owner-inputs-required.md`'s Lead capture section. The five form
  IDs this step needs to test are listed there and in
  `docs/launch-audit-2026-10-08.md`.
- **Step 8**: the public claim is an owner-supplied business decision,
  not yet solicitor-reviewed — see `docs/owner-inputs-required.md`'s
  warranty entry for the full history.
- **Steps 10–12**: `node scripts/build.js && node
  scripts/qa-static-checks.js` (preview); `SITE_OUT_DIR=site-prod-check
  BUILD_TARGET=production node scripts/build.js && node
  scripts/qa-static-checks.js --production` (production); the Playwright
  suite needs a locally served build and Chromium (`scripts/qa-playwright.js`)
  — axe-core coverage is part of the same pass. All three passed as of
  this audit (see `docs/launch-audit-2026-10-08.md`) but must be re-run
  at cutover time against the actual commit being deployed, not assumed
  from this document.
- **Step 16**: `ENABLE_ANALYTICS=true` only takes effect on top of
  `BUILD_TARGET=production` — see `docs/analytics-integration.md`. This
  pass did not enable it and does not recommend enabling it until the
  privacy disclosure covering GTM/Meta Pixel data collection is reviewed
  and approved.
- **Step 21**: this redesign's own production build already generates a
  real, non-empty `robots.txt` and a 29-URL `sitemap.xml` (verified in
  `docs/launch-audit-2026-10-08.md`) — this step is re-confirming that
  holds true once actually deployed to the real domain, not building it
  for the first time.
