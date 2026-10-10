# Launch audit — 8 Oct 2026

Audit-remediation pass. No deployment, DNS change, production-indexing
change, analytics enablement or external-account change was made as part
of this audit — it is a review and documentation pass only.

## Verification method

Two different kinds of claim appear below, verified two different ways:

- **This repository and its build** — verified directly in this session:
  reading source files, running `node scripts/build.js` (preview) and
  `SITE_OUT_DIR=site-prod-check BUILD_TARGET=production node
  scripts/build.js` (production), and inspecting the generated output
  (`site/`, `site-prod-check/`) with `grep`/`node` against the actual
  bytes on disk — not assumed from documentation.
- **The currently-live production domain** (`ozhomeenergy.com.au`'s
  existing, older HighLevel-built site — not this redesign) — this
  session's outbound network access goes through a sandboxed egress
  proxy that does not permit reaching that domain. Confirmed directly:

  ```
  $ curl -sI --max-time 10 https://ozhomeenergy.com.au/
  HTTP/1.1 403 Forbidden
  Content-Type: text/plain; charset=utf-8
  ```

  That `403` is the proxy's own rejection, not a response from the real
  site. Every claim below about the currently-live production domain is
  therefore **recorded as given, not independently re-verified by this
  session**, and is placed under "External action required" rather than
  "Verified complete" — confirming it conclusively needs a real browser
  session outside this sandbox.

---

## 1. Verified complete

Checked directly against this repository/build in this session; command
and result given for each.

- **Main is at commit `4cecebe012e36066919ea2a19afea7a76cf8da53`.**
  `git log origin/main -1` confirms this exactly.
- **The GitHub Pages redesign is a preview and must remain `noindex,
  nofollow`.** Every real content page in the preview build (`node
  scripts/build.js`, no `BUILD_TARGET`) renders `<meta name="robots"
  content="noindex, nofollow">`; `scripts/qa-static-checks.js` asserts
  this for every page (legacy bridges and 404 use `noindex, follow`,
  deliberately).
- **Preview and production-mode static QA pass.** `node
  scripts/qa-static-checks.js` → `STATIC QA PASSED` (58 files). Production:
  `SITE_OUT_DIR=site-prod-check BUILD_TARGET=production node
  scripts/build.js && node scripts/qa-static-checks.js --production` →
  `STATIC QA PASSED` (58 files). Re-run as part of this audit's Task 5
  validation (see below) — both still pass after this pass's own changes.
- **The production build generates 29 indexable sitemap URLs.**
  `grep -c "<url>" site-prod-check/sitemap.xml` → `29`.
- **`/projects/`, `/products/` and `/commercial-battery-assessment/`
  remain gated and `noindex, follow` in production.** Each page's
  rendered `<meta name="robots">` reads exactly `noindex, follow`, and
  none appears in `sitemap.xml` (`grep -c "/<slug>/" sitemap.xml` → `0`
  for all three) — hidden from discovery, not deleted; each is still
  directly built and reachable by URL.
- **Tesla content is approved, active and locked.** Both approved titles
  ("Tesla Energy Certified Installer", "Tesla Powerwall Certified
  Installer") appear on their approved pages; the Tesla badge asset
  exists at `img/brand/tesla/tesla-certified-installer-black.svg`; the
  homepage links to `/tesla-powerwall-3/`; `/tesla-powerwall-3/` is built
  and appears in the production sitemap; the battery-storage feature
  block is present. `scripts/qa-static-checks.js` already restricted
  Tesla content to its three approved pages — this pass added the
  companion positive-presence checks (badge file exists, homepage link
  exists, both pages still carry an approved title) so none of this can
  be silently dropped again without the build going red. No Tesla content
  was touched by this pass, per the locked constraints.
- **Public website warranty wording is 10 years.** `grep -rn
  "10-Year Workmanship Warranty\|15-Year Workmanship Warranty" site/`
  finds the 10-year phrase on the homepage and About page, and zero
  occurrences of "15-Year" anywhere in rendered output. Permanent QA gate
  already in place; unchanged by this pass.
- **Homepage reviews were removed; the Projects review widget may remain
  only inside the currently gated Projects page.** `grep -n "reviews.js\|
  What customers say" site/index.html` → no matches. `grep -n
  "reviewWidget\|reviewsSection" site/projects/index.html` → present.
  Projects itself is currently gated (`noindex, follow`, absent from the
  production sitemap — see above), consistent with "remain only inside
  the currently gated Projects page."
- **The repository is currently public.** Confirmed via the GitHub API
  (`search_repositories`, `ozhamdach/Oz-Home-energy-redesign`):
  `"private": false, "visibility": "public"`. A stale claim to the
  contrary in `docs/owner-inputs-required.md` (two places) has been
  corrected as part of this pass — see Task 2 below.
- **The live-form inventory contains five unique HighLevel forms.**
  `grep -rn data-form-id= src/pages/*/content.html` confirms exactly five
  unique IDs across six embed sites (the Quick Free Quote form is reused,
  unchanged, on both Home and Contact):
  - `7CTbeFedTXyoPJoS2CmH` — Energy Assessment (`/assessment/`)
  - `ILAJCu9qJyVzX582GAtX` — Quick Free Quote (Home **and** Contact)
  - `UyzHXWGEaLtIQqI9z2kc` — Commercial Project Enquiry
  - `D54fnMMf1LWTXOCNlh28` — Service Request
  - `OmaWW64OZ3FaCGGvEIgx` — EV Quick Quote (`/ev-charging/`)

  This was previously under-counted as "four" in two docs (the EV form
  was added later via site-loop and never folded back into the
  checklist) — corrected as part of Task 2 below, and now permanently
  gated by a new `scripts/qa-static-checks.js` check confirming each ID
  renders on its expected page(s).

## 2. External action required

Needs action or verification outside this repository/session — a real
browser, a live account, or DNS/hosting access this sandboxed session
does not have. Where the claim is about the currently-live production
domain, it is recorded as given (see "Verification method" above), not
independently re-verified here.

- **The official domain currently serves the older HighLevel website, not
  this redesign.** As given; this session cannot reach the live domain to
  confirm.
- **Current production displays `0420 113 216` while the redesign
  displays `0435 336 336`.** The redesign side is verified complete (see
  above, and the new phone-consistency QA gate added in Task 3). The
  current-production side is as given — this exact conflict was already
  flagged in `docs/owner-inputs-required.md`'s "Canonical public phone
  number" entry (25 Sep 2026 audit pass), so it has prior documented
  provenance beyond this session alone. Resolving it (deciding and
  propagating one canonical number across the live site, HighLevel,
  Google Business Profile and citations) is cutover runbook step 3.
- **Current production `/robots.txt` and `/sitemap.xml` return empty
  bodies.** As given; unverifiable from this sandbox. (For contrast: this
  redesign's own production build generates a real `robots.txt` with
  `Allow: /` and a sitemap line, and a 29-URL `sitemap.xml` — see
  "Verified complete" above.)
- **Current production has no useful homepage title, meta description or
  canonical visible in the delivered/rendered page.** As given;
  unverifiable from this sandbox. Cutover runbook step 20 re-checks this
  on the production domain once cutover happens.
- **Current production uses two H1 elements for "LOWER ENERGY BILLS" and
  "START HERE."** As given; unverifiable from this sandbox.
- **Current production's About CTA links to a Growth Local preview URL.**
  As given; unverifiable from this sandbox.
- **Real-browser form loading and CRM delivery remain unverified.** This
  session can confirm each HighLevel widget's markup renders with the
  correct form ID (see "Verified complete" above) but cannot confirm
  HighLevel's own pipeline, tagging or automation behind it — that needs
  a real end-to-end test submission in a real browser against the real
  HighLevel account, deliberately not attempted here (the task's own
  constraint: no form submissions). This is cutover runbook steps 6–7.

## 3. Owner confirmation required

A decision or fact only the business owner can supply; nothing here was
guessed or invented.

- **NETCC wording.** Current production reportedly displays "NETCC
  Member." That wording must not be copied into this redesign unless its
  exact current status and the permitted wording are separately
  confirmed — not done, and not planned, as part of this pass. Not
  present anywhere in this repository's source.
- **Monitored business email address and business hours** — unchanged
  from the existing open items in `docs/owner-inputs-required.md`; still
  not published anywhere in this build.
- **A real suburb list** — Greater Sydney is confirmed as the service
  boundary (24 Sep 2026, owner decision), but no specific suburb list has
  been supplied; suburb pages/grids remain out of scope until one exists.
- **Canonical public phone number across external systems** — this
  repository is internally consistent at `0435 336 336` (verified above,
  now permanently gated), but whether that's the number to actually use
  across the live site, HighLevel, Google Business Profile and citations
  is the owner's call (see "External action required" above).
- **Solicitor review of the 10-year workmanship warranty** and its
  alignment with the real Sales and Installation Agreement/handover
  documents — the public claim rests on direct owner instruction, not
  legal review; unchanged by this pass.
- **Repository privacy** — currently public (verified above); making it
  private, if desired, is a separate owner action this pass does not take
  on its own initiative.

## 4. Intentionally unpublished

Built but deliberately not indexed/linked, or deliberately left off the
public site — not a bug, not forgotten.

- **`/projects/`** — gated (`publishGate: "projects"` in
  `src/data/site-status.json`, currently `false`); needs real case
  studies before publishing.
- **`/products/`** — gated (`publishGate: "products"`, currently
  `false`).
- **`/commercial-battery-assessment/`** — gated (`publishGate:
  "commercialBatteryAssessment"`, currently `false`); needs a connected,
  tested CRM endpoint before publishing (see
  `docs/04-highlevel-integration.md`).
- **Homepage review widget** — disabled 2 Oct 2026 after being found
  capable of rendering a visibly broken iframe; no fabricated testimonial
  was added in its place. The Projects page's separate embed of the same
  widget is unaffected and un-reviewed.
- **Business email, business hours, insurance detail, a founder photo,
  Google rating/review-count strip** — all deliberately omitted from
  every page that would otherwise show them, rather than invented or
  placeholder-filled. See `docs/owner-inputs-required.md` for the full,
  current list.
- **NETCC membership wording** — not published anywhere in this build
  (see "Owner confirmation required" above).

---

## Changes made in this pass

See `docs/owner-inputs-required.md`, `docs/launch-readiness-2026-09-23.md`
and `docs/06-qa-report.md` for the specific stale-documentation
corrections made (Task 2), and `scripts/qa-static-checks.js` for the new
permanent QA assertions added (Task 3) — both summarized in the top-level
report for this pass. This audit document is a point-in-time snapshot;
re-verify against the live source rather than trusting it blindly on a
future pass, per this project's own established practice.
