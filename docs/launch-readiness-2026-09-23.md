# Launch Readiness Checklist — 23 September 2026

This is the final go/no-go checklist for switching this build from "GitHub
Pages preview, `noindex` everywhere" to a real production deploy at
`https://ozhomeenergy.com.au` with real search indexing. It was written at
the end of a launch-readiness repair pass that found and fixed several real
gaps (a live Tesla photo that hadn't actually been removed as previously
claimed, a hardcoded public webhook URL, unconfirmed claims still live,
analytics loading on the preview, contradictory service-area claims — see
`docs/06-qa-report.md`'s "Launch-readiness repair pass" section and
`docs/owner-inputs-required.md` for full detail on each).

**Every box below must be checked — by a real action, not by assumption —
before this site goes live and before production search indexing is
enabled.** Where a box depends on a decision only the business owner can
make, it says so. Nothing in this repository can check these boxes on its
own; this document exists so nobody has to reconstruct the list from
scratch, or from memory, when that day comes.

## Source control

- [ ] This branch (`claude/cool-dirac-re7hub`) is merged into `main` via a
      reviewed pull request — not force-pushed, not merged without review.
- [ ] `main`'s HEAD is what actually gets deployed — confirm
      `.github/workflows/deploy-pages.yml` ran successfully against the
      merge commit (it only triggers on pushes to `main`, see
      `README.md`).

## Hosting & domain

- [ ] Production host is selected and confirmed (GitHub Pages long-term,
      or a host capable of real server-side redirects — see
      `docs/legacy-url-migration.md` §7 for why this matters).
- [ ] `https://ozhomeenergy.com.au` (apex, no `www`) is confirmed as the
      production origin, or `PRODUCTION_ORIGIN` in `scripts/build.js` and
      the equivalent hardcoded values in `src/layout.html` are updated to
      match whatever was actually decided.
- [ ] Real server-side (not client-side meta-refresh) redirects are
      configured for every route in `redirects/legacy-routes.json`, on the
      real production host — the client-side legacy-bridge pages this repo
      builds are a preview-only stand-in, not a production redirect
      strategy (see `docs/legacy-url-migration.md`).
- [ ] The full current-site indexed URL list (Search Console → Pages
      report, plus an independent crawl) has been exported and checked
      against `redirects/legacy-routes.json` for anything missing.

## Tesla

- [ ] Either (a) Tesla has granted written marketing/publication approval
      (an email from `energyproductsmarketing@tesla.com` or equivalent —
      see the Tesla section of `docs/owner-inputs-required.md` for the
      exact contractual clause this satisfies), and the commented-out
      Tesla content has been activated following the steps in that
      document, **or** (b) no such approval exists yet, and every Tesla
      reference remains exactly as it is now: commented out in
      `src/pages/home/content.html` and `src/pages/battery-storage/
      content.html`, absent from `/ev-charging/`, the draft page kept at
      `docs/tesla-powerwall-3-DRAFT/` outside `src/pages/`, and the asset
      files under `assets/original-photography/` rather than `site/`.
- [ ] If Tesla assets were ever fully removed from git history (not just
      the working tree) as an additional precaution, that rewrite was done
      deliberately and with sign-off — it affects every existing clone of
      this repository.

## Warranty

- [ ] A solicitor has reviewed the "OHE 15-Year Workmanship Warranty —
      Draft Terms" document (particularly its Section 10 ACL wording) and
      the terms are reflected in the real Sales and Installation
      Agreement / handover-pack templates used with actual customers.
- [ ] Only once that's true: the warranty content commented out in
      `src/pages/home/content.html` (two blocks — the hero-trust line
      already edited, and the trust-card marked `WARRANTY CARD`) and
      `src/pages/about/content.html` (marked `WARRANTY SECTION`) is
      uncommented and rebuilt.

## Owner claim confirmations

- [ ] Every open item in `docs/owner-inputs-required.md`'s "Specific
      claims to confirm" section is either confirmed accurate or remains
      removed/neutralised — re-check that document directly rather than
      relying on this summary, since it's the maintained source of truth.
- [ ] Google Business Profile URL supplied and confirmed live — nothing in
      this build currently links to one; if a GBP link/embed is wanted
      anywhere on the site, that's new work, not a flip of an existing
      flag.
- [ ] Any further accreditation, certification, award, installation count
      or savings figure the owner wants published has gone through the
      same confirmation process as everything already on the site — never
      added directly without it.

## Legal

- [ ] `/privacy-policy/`, `/terms/` and `/complaints/` have all been
      reviewed by an Australian solicitor — they are currently structured
      drafts, not reviewed legal documents (see
      `docs/owner-inputs-required.md`, "Legal & business detail").
- [ ] Every open item in that same "Legal & business detail" section
      (registered entity name, ABN, official email, postal address if
      public, privacy contact, file-retention policy, marketing-consent
      wording, complaints SLA) is supplied.

## Lead capture

- [ ] All four live HighLevel-embedded forms — Energy Assessment (form ID
      `7CTbeFedTXyoPJoS2CmH`), homepage Quick Free Quote
      (`ILAJCu9qJyVzX582GAtX`), Commercial Project Enquiry
      (`UyzHXWGEaLtIQqI9z2kc`), Service Request (`D54fnMMf1LWTXOCNlh28`) —
      have each had a real end-to-end test submission confirmed to land in
      the correct HighLevel pipeline with the correct tags. This repo can
      only confirm the widgets load; it cannot confirm HighLevel's own
      pipeline/workflow configuration behind them.
- [ ] A secure server-side endpoint (with server-side validation, spam
      protection, rate limiting, and — for Commercial Load Review — file
      upload safety) has been supplied and connected for the three
      currently-unconnected commercial funnels: Commercial Load Review,
      Commercial Solar & Battery Quote, and Commercial Battery Assessment.
      See `docs/04-highlevel-integration.md`'s "Server-side safety
      requirements" for the full list.
- [ ] Each of those three funnels has passed its own end-to-end lead test
      once connected. Only once **Commercial Battery Assessment**
      specifically has passed this test should
      `src/data/site-status.json`'s `commercialBatteryAssessment.published`
      be flipped to `true` (this is what allows it to be indexed —
      everything else stays true regardless).
- [ ] The exposed `services.leadconnectorhq.com` webhook URL that was
      hardcoded in this repo's source until 23 Sep 2026 has been rotated
      on the HighLevel side (see `docs/owner-inputs-required.md`,
      "Webhook rotation").

## QA

- [ ] `node scripts/build.js && node scripts/qa-static-checks.js` passes
      (preview mode).
- [ ] `SITE_OUT_DIR=site-prod-check BUILD_TARGET=production node
      scripts/build.js && node scripts/qa-static-checks.js --production`
      passes (production mode) — re-run this again after any further
      content change, not just once now.
- [ ] The full Playwright suite (`scripts/qa-playwright.js`) has passed via
      GitHub Actions (`.github/workflows/qa.yml`) against the actual merge
      commit going live, not an earlier commit.
- [ ] Manual testing completed on **Safari on a real iPhone** and **Chrome
      on a real Android or desktop device** — this repo's automated QA has
      only ever run against headless Chromium; Safari/WebKit and mobile
      Chrome remain genuinely unverified (see `docs/06-qa-report.md`).

## Only after every box above is checked

- [ ] Switch the real build to `BUILD_TARGET=production` for the actual
      production deploy (never for the GitHub Pages preview — see
      `README.md`).
- [ ] Confirm the production `robots.txt` and `sitemap.xml` look correct
      for the live domain before removing any interim crawl-blocking.
- [ ] Only then enable production search indexing (e.g. submitting the
      sitemap in Google Search Console) — indexing should follow this
      checklist being complete, not the other way around.

Do not describe any item above as done unless it has actually happened.
This document is a checklist to work through, not a record of intent.
