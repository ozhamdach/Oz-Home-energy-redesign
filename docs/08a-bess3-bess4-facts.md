# BESS3 / BESS4 — Sourced Facts (NSW Peak Demand Reduction Scheme)

**Verification method and its limits:** this sandbox's network egress proxy
blocks direct access to `energysustainabilityschemes.nsw.gov.au` (the
official IPART/PDRS site) and to every third-party domain tested
(`greenenergytrading.com.au`, `energymatters.com.au`, etc.) — confirmed by
repeated `EGRESS_BLOCKED` errors from the fetch tool. The `WebSearch` tool
is not subject to the same block and returned consistent, cross-corroborated
figures from roughly ten independent commercial sources (solar/battery
retailers and installers summarising the scheme) rather than a single fetch
of the primary government page. **Treat the figures below as
well-corroborated but not independently confirmed against the primary
source document** — before this funnel goes live, someone with access to
open `energysustainabilityschemes.nsw.gov.au` directly should confirm these
against the official BESS3/BESS4 fact sheets and the PDRS Rule itself.

## BESS3 — apartment buildings

- Applies to residential apartment buildings, BCA Class 2, with **at least
  4 individual dwellings**.
- Combined usable battery capacity: **greater than 20 kWh, up to and
  including 200 kWh**. No more than 5 kWh of that capacity is recognised
  per dwelling.
- Battery must be on the Clean Energy Council's approved product list;
  installation to AS/NZS 5139.
- Installer must be on the Solar Accreditation Australia (SAA) list, with
  planning and network approvals in place before certificates can be
  created.
- Minimum customer co-payment: **$1,000 per implementation**.

## BESS4 — small and medium business

- Applies to small/medium **business premises** — explicitly **excludes
  residential buildings and data centres**.
- Same capacity band as BESS3: **greater than 20 kWh, up to and including
  200 kWh** combined usable capacity.
- Qualification is based on **battery size, not industry type** (aside from
  the data-centre exclusion above).
- Battery must be on the Scheme Administrator's approved product list.
- Minimum customer contribution: **$5,000 per implementation**.

## BESS5 — large commercial/industrial (mentioned for context, not this campaign)

- Capacity band: **greater than 200 kWh, up to 30 MWh**.
- This campaign's ad creative and landing page target BESS3/BESS4 only;
  a visitor whose answers suggest BESS5 scale is routed to
  `bess5_or_manual_review`, not treated as in-scope for this specific ad
  spend.

## Effective date

All three new activities (BESS3, BESS4, BESS5) are eligible for certificate
creation for implementations **on or after 1 September 2026** — already
in effect as of this document's writing (today's date is 2026-09-13).

## Why the landing page never claims "eligible"

None of the above can be confirmed from a short lead-generation form: exact
usable capacity is a design decision made after a site visit, product
CEC/SASC-list status depends on what's actually specified, and installer
accreditation/network approval are steps in the sales process, not answers
a visitor gives on a landing page. Every classification this funnel
produces is therefore a `_review_required`/`_review` label — a routing
decision for sales, not an eligibility determination for the visitor.

## Sources consulted (via WebSearch; primary .gov.au source not directly reachable this session)

- [BESS3 BESS4 BESS5 — NSW PDRS Battery Rebates | GreenDeal](https://www.greendeal.com.au/pdrs-bess3-bess4-bess5-incentives)
- [NSW Commercial Battery Rebates: BESS3, BESS4 & BESS5 | Energy Matters](https://www.energymatters.com.au/rebates-incentives/nsw/nsw-commercial-battery-incentives/)
- [Questions and answers — Battery activities information session, 15 July 2026 | IPART](https://www.energysustainabilityschemes.nsw.gov.au/sites/default/files/cm9_documents/Q%2526As-Battery-activities-information-session-15-July-2026.PDF)
- [BESS3, BESS4 & BESS5: New PDRS Battery Activities NSW | Green Energy Trading](https://greenenergytrading.com.au/commercial-battery-installer-nsw-bess3-bess4-bess5)
- [BESS3, BESS4 & BESS5: New PDRS Battery Activities NSW | National Carbon Bank of Australia](https://www.nationalcarbonbank.com.au/commercial-battery-installer-nsw-bess3-bess4-bess5)
- [NSW Battery Incentives Explained: PDRS for Businesses | Melbourne Energy Group](https://melbourneenergygroup.com.au/community/nsw-battery-incentives-explained-peak-demand-reduction-scheme-pdrs-for-businesses/)
- [NSW Battery Rebate 2026: BESS1–BESS5 PDRS Explained | Amperage](https://amperage.app/blog/nsw-battery-rebate-2026-bess-pdrs-explained)
- [NSW Expands Battery Incentives To Apartments And Businesses For The First Time | SMBtech](https://smbtech.au/news/nsw-expands-battery-incentives-to-apartments-and-businesses-for-the-first-time/)
- [PDRS Rule and changes | IPART](https://www.energysustainabilityschemes.nsw.gov.au/pdrs-rule-and-changes)
- [NSW Apartment Battery Rebate: The BESS3 Guide for Strata Committees | Solar Choice](https://www.solarchoice.net.au/learn/solar-rebates/nsw/apartment-battery-bess3-rebate/)
- [NSW Battery Incentives for Business: BESS4 and BESS5 | Ampaura Australia](https://ampauraaustralia.com.au/blog/nsw-pdrs-battery-incentive-bess4-bess5)
