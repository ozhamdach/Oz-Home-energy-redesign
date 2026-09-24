#!/usr/bin/env node
/**
 * Responsive/accessibility/interaction smoke test against a built `site/`
 * (and, for the nested-404 check, a built `pages-dist/`). Run:
 *   node scripts/build.js && node scripts/build-pages.js && node scripts/build-redirects.js
 *   (cd site && python3 -m http.server 8811 &)
 *   node scripts/qa-playwright.js
 * Requires the `playwright` package and a Chromium executable — in this
 * project's original build environment both were pre-installed globally;
 * elsewhere, `npm install -D playwright && npx playwright install chromium`
 * and drop the explicit executablePath below.
 *
 * This is the CHROMIUM-only interaction/visual pass. Safari and Firefox are
 * NOT tested by this script or anywhere else in this repo's QA — do not
 * describe this site as cross-browser verified beyond Chromium until an
 * actual WebKit/Firefox pass (e.g. via Playwright's webkit/firefox
 * browsers, or real device testing) has been run and recorded here.
 */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

const BASE = process.env.QA_BASE_URL || 'http://localhost:8811';
const widths = [360, 390, 768, 1024, 1440];
const pages = [
  '/',
  '/assessment/',
  '/residential-solar/',
  '/commercial-project-enquiry/',
  '/about/',
  // Pages that gained real photography this pass — see docs/asset-manifest.md
  '/battery-storage/',
  '/ev-charging/',
  '/commercial-solar/',
  '/commercial-batteries/',
  '/switchboard-upgrades/',
  '/projects/',
  '/commercial-load-review/',
  '/commercial-solar-battery-quote/',
];
const errors = [];

const legacyRoutes = require(path.join(__dirname, '..', 'redirects', 'legacy-routes.json')).routes;

async function run(label, fn) {
  try {
    await fn();
  } catch (err) {
    errors.push(`${label}: THREW ${err.message.split('\n')[0]}`);
  }
}

(async () => {
  require('fs').mkdirSync('qa-screenshots', { recursive: true });
  const browser = await chromium.launch(
    process.env.QA_CHROMIUM_PATH ? { executablePath: process.env.QA_CHROMIUM_PATH } : {}
  );
  // Block external font requests: this is a local smoke test and shouldn't
  // depend on (or wait on) a third-party network in CI/sandboxed environments.
  const context = await browser.newContext();
  context.setDefaultTimeout(10000);
  await context.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());

  for (const path of pages) {
    for (const width of widths) {
      await run(`${path} @${width}`, async () => {
        const page = await context.newPage();
        await page.setViewportSize({ width, height: 900 });
        page.on('pageerror', (e) => errors.push(`${path} @${width}: pageerror ${e.message}`));
        page.on('console', (msg) => {
          // Ignore the font-load failure we cause ourselves by aborting
          // fonts.googleapis.com/gstatic.com requests above, and ignore
          // failures loading the external (and, in this sandbox, likely
          // unreachable) HighLevel review-widget iframe — both are this
          // test environment's own network isolation, not a site defect.
          // See site/js/reviews.js: a failed/slow load just hides that
          // section rather than surfacing a JS error.
          if (
            msg.type() === 'error' &&
            !/Failed to load resource/.test(msg.text()) &&
            !/link\.ozhomeenergy\.com\.au/.test(msg.text())
          ) {
            errors.push(`${path} @${width}: console ${msg.text()}`);
          }
        });
        await page.goto(BASE + path, { waitUntil: 'load', timeout: 15000 });
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth
        );
        if (overflow > 1) errors.push(`${path} @${width}: horizontal overflow ${overflow}px`);

        // Every <img> must actually load (naturalWidth > 0 — a broken path,
        // 404, or unsupported format all leave it at 0) and carry
        // meaningful alt text — see docs/asset-manifest.md.
        const imgIssues = await page.evaluate(() =>
          Array.from(document.images).map((img) => ({
            src: img.currentSrc || img.src,
            broken: img.complete && img.naturalWidth === 0,
            alt: img.getAttribute('alt'),
          }))
        );
        for (const img of imgIssues) {
          if (img.broken) errors.push(`${path} @${width}: broken image ${img.src}`);
          if (img.alt === null) errors.push(`${path} @${width}: <img> missing alt attribute (${img.src})`);
        }

        if (path === '/' && width === 360) await page.screenshot({ path: `qa-screenshots/home-360.png`, fullPage: true });
        if (path === '/' && width === 1440) await page.screenshot({ path: `qa-screenshots/home-1440.png`, fullPage: true });
        if (path === '/assessment/' && width === 360)
          await page.screenshot({ path: `qa-screenshots/assessment-360.png`, fullPage: true });
        const photoPages = ['/battery-storage/', '/ev-charging/', '/commercial-solar/', '/about/', '/projects/'];
        if ((width === 360 || width === 1440) && photoPages.includes(path)) {
          const slug = path.replace(/\//g, '') || 'home';
          await page.screenshot({ path: `qa-screenshots/${slug}-${width}.png`, fullPage: true });
        }
        await page.close();
      });
    }
  }

  // Real touch interaction, not just class-state checks: a synthetic
  // page.click() (the previous version of this test) exercises none of the
  // actual tap/hit-testing path a phone uses, and would have stayed green
  // straight through the real regression this covers (see the ~320px
  // hamburger-offscreen overflow bug and the missing touch-action:
  // manipulation fixed alongside this test — both only show up under real
  // touch emulation, not a synthetic click). Requires its own hasTouch
  // context — the shared `context` above has touch disabled.
  const mobileNavWidths = [
    [320, 568],
    [375, 667],
    [390, 844],
    [430, 932],
  ];
  const mobileDropdowns = [
    { label: 'Solutions', index: 0, expectHrefPrefix: '/residential-solar/' },
    { label: 'For Business', index: 1, expectHrefPrefix: '/commercial-solar/' },
    { label: 'Support', index: 2, expectHrefPrefix: '/learning-centre/' },
  ];
  for (const [w, h] of mobileNavWidths) {
    const touchContext = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true });
    touchContext.setDefaultTimeout(10000);
    await touchContext.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());

    for (const dd of mobileDropdowns) {
      await run(`mobile nav real-tap ${w}x${h} / ${dd.label}`, async () => {
        const page = await touchContext.newPage();
        await page.goto(BASE + '/', { waitUntil: 'load', timeout: 15000 });
        const toggle = page.locator('#navToggle');
        const mobileNav = page.locator('#mobileNav');

        // First tap opens; aria-expanded + aria-label + scroll lock all
        // need to flip together, not just the CSS class.
        await toggle.tap();
        await page.waitForTimeout(150);
        const opened = await mobileNav.evaluate((el) => el.classList.contains('is-open'));
        const ariaExpanded = await toggle.getAttribute('aria-expanded');
        const ariaLabel = await toggle.getAttribute('aria-label');
        const bodyOverflow = await page.evaluate(() => getComputedStyle(document.body).overflow);
        if (!opened) errors.push(`mobile nav @${w}x${h}: hamburger did not open menu on first tap`);
        if (ariaExpanded !== 'true') errors.push(`mobile nav @${w}x${h}: aria-expanded not "true" after opening`);
        if (ariaLabel !== 'Close menu') errors.push(`mobile nav @${w}x${h}: aria-label did not change to "Close menu" after opening`);
        if (bodyOverflow !== 'hidden') errors.push(`mobile nav @${w}x${h}: body scroll not locked while menu open`);

        // Tap the actual <summary> for this dropdown — not a class toggle.
        const summary = page.locator('#mobileNav details > summary').nth(dd.index);
        await summary.tap();
        await page.waitForTimeout(150);
        const details = page.locator('#mobileNav details').nth(dd.index);
        const isExpanded = await details.evaluate((el) => el.hasAttribute('open'));
        if (!isExpanded) {
          errors.push(`mobile nav @${w}x${h} / ${dd.label}: dropdown did not expand on tap`);
          await page.close();
          return;
        }

        // Tap a real link inside it and confirm real navigation — a bare
        // tap() resolved does NOT mean navigation has started yet, so this
        // must race waitForNavigation against the tap, not await them
        // sequentially (a page.waitForLoadState() called only *after* the
        // tap can resolve against the pre-navigation page and falsely
        // report success or failure before the real navigation happens).
        const link = details.locator('.sub-links a').first();
        const href = await link.getAttribute('href');
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'load', timeout: 5000 }).catch(() => {}),
          link.tap(),
        ]);
        const finalUrl = page.url();
        if (!finalUrl.includes(dd.expectHrefPrefix)) {
          errors.push(`mobile nav @${w}x${h} / ${dd.label}: tapping link (href=${href}) did not navigate to ${dd.expectHrefPrefix}, landed on ${finalUrl}`);
        }
        const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
        if (hasOverflow) errors.push(`mobile nav @${w}x${h} / ${dd.label}: horizontal overflow on landed page`);

        await page.close();
      });
    }

    await run(`mobile nav close/escape ${w}x${h}`, async () => {
      const page = await touchContext.newPage();
      await page.goto(BASE + '/', { waitUntil: 'load', timeout: 15000 });
      const toggle = page.locator('#navToggle');
      const mobileNav = page.locator('#mobileNav');

      await toggle.tap();
      await page.waitForTimeout(150);
      await toggle.tap();
      await page.waitForTimeout(150);
      const closedAgain = await mobileNav.evaluate((el) => el.classList.contains('is-open'));
      const overflowRestored = await page.evaluate(() => getComputedStyle(document.body).overflow);
      const labelAfterClose = await toggle.getAttribute('aria-label');
      if (closedAgain) errors.push(`mobile nav @${w}x${h}: menu did not close on second tap`);
      if (overflowRestored === 'hidden') errors.push(`mobile nav @${w}x${h}: body scroll not restored after closing`);
      if (labelAfterClose !== 'Open menu') errors.push(`mobile nav @${w}x${h}: aria-label did not revert to "Open menu" after closing`);

      await toggle.click();
      await page.waitForTimeout(150);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(150);
      const openAfterEscape = await mobileNav.evaluate((el) => el.classList.contains('is-open'));
      const focusedIsToggle = await page.evaluate(() => document.activeElement === document.getElementById('navToggle'));
      if (openAfterEscape) errors.push(`mobile nav @${w}x${h}: Escape did not close the menu`);
      if (!focusedIsToggle) errors.push(`mobile nav @${w}x${h}: keyboard focus not returned to the hamburger after Escape`);

      const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      if (hasOverflow) errors.push(`mobile nav @${w}x${h}: horizontal overflow at rest`);

      await page.close();
    });

    await touchContext.close();
  }

  await run('desktop dropdown nav (mouse + keyboard)', async () => {
    const page = await context.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(BASE + '/', { waitUntil: 'load', timeout: 15000 });
    const firstNavButton = page.locator('.primary-nav > ul > li > button').first();
    await firstNavButton.click();
    const openViaMouse = await page.evaluate(
      () => document.querySelector('.primary-nav > ul > li').classList.contains('is-open')
    );
    if (!openViaMouse) errors.push('Desktop dropdown did not open on click');
    const expandedViaMouse = await firstNavButton.getAttribute('aria-expanded');
    if (expandedViaMouse !== 'true') errors.push('Desktop dropdown button aria-expanded not set to true on open');
    await page.keyboard.press('Escape');
    const closedViaEscape = await page.evaluate(
      () => !document.querySelector('.primary-nav > ul > li').classList.contains('is-open')
    );
    if (!closedViaEscape) errors.push('Desktop dropdown did not close on Escape key');
    await page.close();
  });

  await run('desktop dropdown nav (hover)', async () => {
    const page = await context.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(BASE + '/', { waitUntil: 'load', timeout: 15000 });
    const firstNavItem = page.locator('.primary-nav > ul > li').first();
    const firstNavButton = firstNavItem.locator('> button');

    await firstNavButton.hover();
    const openViaHover = await firstNavItem.evaluate((el) => el.classList.contains('is-open'));
    if (!openViaHover) errors.push('Desktop dropdown did not open on hover');
    const expandedViaHover = await firstNavButton.getAttribute('aria-expanded');
    if (expandedViaHover !== 'true') errors.push('Desktop dropdown button aria-expanded not set to true on hover-open');

    // A genuine mouse click always hovers its target first — confirm the
    // click handler doesn't fight the hover state and immediately close
    // what hover just opened (the actual bug this test exists to catch).
    await firstNavButton.click();
    const stillOpenAfterClick = await firstNavItem.evaluate((el) => el.classList.contains('is-open'));
    if (!stillOpenAfterClick) errors.push('Clicking an already hover-opened dropdown closed it (hover/click race)');

    // Move away and confirm it closes again (the mouseleave close timer).
    await page.mouse.move(640, 850);
    await page.waitForTimeout(300);
    const closedAfterLeave = await firstNavItem.evaluate((el) => !el.classList.contains('is-open'));
    if (!closedAfterLeave) errors.push('Desktop dropdown did not close after the mouse moved away');

    await page.close();
  });

  // /assessment/ now embeds a real HighLevel-hosted form (iframe, cross-origin)
  // in place of the custom-built multi-step form these three tests used to
  // exercise — see git history for that version. Nothing here can assert on
  // the iframe's internal behavior (different origin, and this sandbox can't
  // reach link.ozhomeenergy.com.au anyway); the presence/attributes of the
  // embed itself are checked by scripts/qa-static-checks.js instead.
  await run('assessment page embeds the real HighLevel form, not a stale prototype', async () => {
    const page = await context.newPage();
    await page.goto(BASE + '/assessment/', { waitUntil: 'load', timeout: 15000 });
    const hasRealEmbed = await page.evaluate(
      () => !!document.querySelector('iframe[data-form-id="7CTbeFedTXyoPJoS2CmH"]')
    );
    if (!hasRealEmbed) errors.push('/assessment/: expected HighLevel form iframe (7CTbeFedTXyoPJoS2CmH) not found');
    const hasStaleForm = await page.evaluate(() => !!document.getElementById('assessmentForm'));
    if (hasStaleForm) errors.push('/assessment/: retired custom #assessmentForm markup is still present');
    await page.close();
  });

  await run('homepage trust grid: five transparent credential cells, correct badge sizes, no evnex stage, matching desktop heights', async () => {
    for (const width of [1440, 390]) {
      const page = await context.newPage();
      await page.setViewportSize({ width, height: 1100 });
      await page.goto(BASE + '/', { waitUntil: 'load', timeout: 15000 });
      const data = await page.evaluate(() => {
        const cards = [...document.querySelectorAll('.trust-card')];
        const rect = (sel) => {
          const el = document.querySelector(sel);
          return el ? el.getBoundingClientRect() : null;
        };
        const style = (sel) => {
          const el = document.querySelector(sel);
          return el ? getComputedStyle(el) : null;
        };
        const evnexImg = document.querySelector('.trust-card--evnex .trust-card-mark img');
        const teslaImg = document.querySelector('.trust-card--tesla .trust-card-mark img');
        return {
          cardCount: cards.length,
          cardHeights: cards.map((c) => c.getBoundingClientRect().height),
          saaWidth: rect('.trust-card--saa .trust-card-mark img')?.width ?? 0,
          secHeight: rect('.trust-card--sec .trust-card-mark img')?.height ?? 0,
          ohmeHeight: rect('.trust-card--ohme .trust-card-mark img')?.height ?? 0,
          evnexHeight: rect('.trust-card--evnex .trust-card-mark img')?.height ?? 0,
          evnexNaturalW: evnexImg?.naturalWidth ?? 0,
          evnexNaturalH: evnexImg?.naturalHeight ?? 0,
          teslaNaturalW: teslaImg?.naturalWidth ?? 0,
          teslaNaturalH: teslaImg?.naturalHeight ?? 0,
          evnexStageExists: !!document.querySelector('.evnex-badge-stage'),
          cardBgs: [...document.querySelectorAll('.trust-card')].map((c) => getComputedStyle(c).backgroundColor),
          cardShadows: [...document.querySelectorAll('.trust-card')].map((c) => getComputedStyle(c).boxShadow),
        };
      });

      if (data.cardCount !== 5) errors.push(`/ @${width}: expected 5 .trust-card credential items, found ${data.cardCount}`);
      if (data.evnexNaturalW === 0 || data.evnexNaturalH === 0) errors.push(`/ @${width}: Evnex badge image has zero natural dimensions (failed to load)`);
      if (data.evnexHeight < 60) errors.push(`/ @${width}: Evnex badge rendered height ${data.evnexHeight}px is below the required 60px minimum`);
      if (data.evnexStageExists) errors.push(`/ @${width}: .evnex-badge-stage still exists — should have been removed`);
      data.cardBgs.forEach((bg, i) => {
        if (bg !== 'rgba(0, 0, 0, 0)') errors.push(`/ @${width}: trust-card #${i} has a non-transparent background (${bg})`);
      });
      data.cardShadows.forEach((sh, i) => {
        if (sh !== 'none') errors.push(`/ @${width}: trust-card #${i} has a box-shadow (${sh}) — cells must not look like white tiles`);
      });

      if (width === 1440) {
        if (data.saaWidth < 180) errors.push(`/ @${width}: SAA badge width ${data.saaWidth}px is below the required 180px minimum`);
        if (data.secHeight < 80) errors.push(`/ @${width}: SEC badge height ${data.secHeight}px is below the required 80px minimum`);
        if (data.ohmeHeight < 90) errors.push(`/ @${width}: Ohme badge height ${data.ohmeHeight}px is below the required 90px minimum`);
        if (data.evnexHeight < 88) errors.push(`/ @${width}: Evnex badge height ${data.evnexHeight}px is below the required 88px desktop minimum`);
        const maxH = Math.max(...data.cardHeights);
        const minH = Math.min(...data.cardHeights);
        if (maxH - minH > 2) errors.push(`/ @${width}: desktop credential cells do not have matching heights (max ${maxH}, min ${minH}, diff ${(maxH - minH).toFixed(2)}px)`);
      }

      await page.close();
    }
  });

  await run('no lead form has action="#" or shows a fake success state', async () => {
    for (const p of ['/service-request/', '/commercial-project-enquiry/']) {
      const page = await context.newPage();
      await page.goto(BASE + p, { waitUntil: 'load', timeout: 15000 });
      const actionHash = await page.evaluate(() => {
        const f = document.querySelector('form');
        return f && f.getAttribute('action') === '#';
      });
      if (actionHash) errors.push(`${p}: form still has action="#"`);
      await page.close();
    }
  });

  // /service-request/ and /commercial-project-enquiry/ both now embed a
  // real HighLevel-hosted form (iframe, cross-origin) in place of the
  // custom-built prototype forms these tests used to exercise — see git
  // history for those versions, and the assessment page test above for
  // the same pattern. Service Request's form ID was corrected from
  // 2TfIfhVospnHx74eNcAP to D54fnMMf1LWTXOCNlh28 (the latter's internal
  // HighLevel name is "Service Request"; the former's was the suspicious
  // "Google/Meta ads Request a Quote").
  await run('service request page embeds the real HighLevel form, not a stale prototype', async () => {
    const page = await context.newPage();
    await page.goto(BASE + '/service-request/', { waitUntil: 'load', timeout: 15000 });
    const hasRealEmbed = await page.evaluate(
      () => !!document.querySelector('iframe[data-form-id="D54fnMMf1LWTXOCNlh28"]')
    );
    if (!hasRealEmbed) errors.push('/service-request/: expected HighLevel form iframe (D54fnMMf1LWTXOCNlh28) not found');
    const hasStaleForm = await page.evaluate(() => !!document.getElementById('serviceRequestForm'));
    if (hasStaleForm) errors.push('/service-request/: retired custom #serviceRequestForm markup is still present');
    await page.close();
  });

  await run('commercial project enquiry page embeds the real HighLevel form, not a stale prototype', async () => {
    const page = await context.newPage();
    await page.goto(BASE + '/commercial-project-enquiry/', { waitUntil: 'load', timeout: 15000 });
    const hasRealEmbed = await page.evaluate(
      () => !!document.querySelector('iframe[data-form-id="UyzHXWGEaLtIQqI9z2kc"]')
    );
    if (!hasRealEmbed) errors.push('/commercial-project-enquiry/: expected HighLevel form iframe (UyzHXWGEaLtIQqI9z2kc) not found');
    const hasStaleForm = await page.evaluate(() => !!document.getElementById('projectEnquiryForm'));
    if (hasStaleForm) errors.push('/commercial-project-enquiry/: retired custom #projectEnquiryForm markup is still present');
    await page.close();
  });

  // Commercial Load Review — single-page conversion funnel for paid Meta
  // traffic (see the brief this page was built against). 23 Sep 2026
  // (launch-readiness repair pass): the hardcoded LeadConnector webhook was
  // removed from site/js/commercial-load-review.js — LEAD_ENDPOINT is now
  // '' and every submission shows the honest "not connected" panel instead
  // of attempting any network request. The tests below assert exactly
  // that, not a successful submit.

  await run('commercial load review: initial state — only Q1 visible, both consent boxes unticked', async () => {
    const page = await context.newPage();
    await page.goto(BASE + '/commercial-load-review/', { waitUntil: 'load', timeout: 15000 });
    const state = await page.evaluate(() => ({
      q1Hidden: document.getElementById('clrQ1').hidden,
      q2Hidden: document.getElementById('clrQ2').hidden,
      q3Hidden: document.getElementById('clrQ3').hidden,
      q4Hidden: document.getElementById('clrQ4').hidden,
      q5Hidden: document.getElementById('clrQ5').hidden,
      contactHidden: document.getElementById('clrContact').hidden,
      consentChecked: document.getElementById('clrConsent').checked,
      marketingChecked: document.getElementById('clrMarketing').checked,
    }));
    if (state.q1Hidden) errors.push('CLR: Q1 should be visible on load');
    if (!state.q2Hidden || !state.q3Hidden || !state.q4Hidden || !state.q5Hidden || !state.contactHidden) {
      errors.push('CLR: only Q1 should be visible before any answers — found a later question already revealed');
    }
    if (state.consentChecked || state.marketingChecked) errors.push('CLR: consent checkboxes must be unticked by default');
    await page.close();
  });

  await run('commercial load review: individual-home exit, no contact capture', async () => {
    const page = await context.newPage();
    await page.goto(BASE + '/commercial-load-review/', { waitUntil: 'load', timeout: 15000 });
    await page.check('#siteType-home');
    await page.waitForTimeout(600);
    const exitVisible = await page.evaluate(() => !document.getElementById('clrExitSiteType').hidden);
    const q2Visible = await page.evaluate(() => !document.getElementById('clrQ2').hidden);
    const contactVisible = await page.evaluate(() => !document.getElementById('clrContact').hidden);
    if (!exitVisible) errors.push('CLR: choosing "Individual home" did not show the out-of-scope exit panel');
    if (q2Visible) errors.push('CLR: Q2 was revealed after an out-of-scope exit — should stop entirely');
    if (contactVisible) errors.push('CLR: contact fields were revealed after an out-of-scope exit — must never capture contact details');
    await page.close();
  });

  await run('commercial load review: non-NSW postcode exit', async () => {
    const page = await context.newPage();
    await page.goto(BASE + '/commercial-load-review/', { waitUntil: 'load', timeout: 15000 });
    await page.check('#siteType-business');
    await page.waitForTimeout(600);
    await page.fill('#clrSuburb', 'Melbourne');
    await page.fill('#clrPostcode', '3000');
    await page.waitForTimeout(700);
    const exitVisible = await page.evaluate(() => !document.getElementById('clrExitPostcode').hidden);
    const q3Visible = await page.evaluate(() => !document.getElementById('clrQ3').hidden);
    if (!exitVisible) errors.push('CLR: a non-NSW postcode (3000) did not show the out-of-scope exit panel');
    if (q3Visible) errors.push('CLR: Q3 was revealed after a non-NSW postcode exit');
    await page.close();
  });

  await run('commercial load review: full happy path via mouse — "ask someone else" does not block submit, no PII in analytics, honest not-connected state (no fake success)', async () => {
    const page = await context.newPage();
    let webhookHit = false;
    await page.route('https://services.leadconnectorhq.com/**', (route) => {
      webhookHit = true;
      route.abort();
    });
    await page.goto(BASE + '/commercial-load-review/?utm_source=meta&utm_campaign=loadreview&fbclid=abc123', {
      waitUntil: 'load',
      timeout: 15000,
    });
    await page.check('#siteType-business');
    await page.waitForTimeout(600);
    await page.fill('#clrSuburb', 'Parramatta');
    await page.fill('#clrPostcode', '2150');
    await page.waitForTimeout(700);
    await page.check('#loadPattern-overnight');
    await page.waitForTimeout(600);
    await page.check('#spend-3000-7500');
    await page.waitForTimeout(600);
    // "I'd need to ask someone else" must not block submission.
    await page.check('#decision-askelse');
    await page.waitForTimeout(600);
    const contactVisible = await page.evaluate(() => !document.getElementById('clrContact').hidden);
    if (!contactVisible) errors.push('CLR: contact fields did not reveal after "I\'d need to ask someone else" — that answer must not block progress');

    await page.fill('#clrFullName', 'Test Person');
    await page.fill('#clrBusinessName', 'Test Co Pty Ltd');
    await page.fill('#clrWorkEmail', 'test.person@example.com');
    await page.fill('#clrPhone', '0400000000');
    await page.check('#clrConsent');

    const dataLayerJson = await page.evaluate(() => {
      window.__clrDL = [];
      const push = Array.prototype.push;
      window.dataLayer.push = function () {
        push.apply(window.__clrDL, arguments);
        return push.apply(this, arguments);
      };
      return true;
    });
    void dataLayerJson;

    await page.click('#clrSubmit');
    await page.waitForTimeout(500);

    const notConnectedVisible = await page.evaluate(() => !document.getElementById('clrNotConnected').hidden);
    const confirmVisible = await page.evaluate(() => !document.getElementById('clrConfirm').hidden);
    const formHidden = await page.evaluate(() => document.getElementById('clrForm').hidden);
    if (!notConnectedVisible) errors.push('CLR: "not connected" panel did not appear on submit — LEAD_ENDPOINT is unset, this must never show fake success');
    if (confirmVisible) errors.push('CLR: the success confirmation panel is visible with no endpoint configured — this is a fake-success bug');
    if (!formHidden) errors.push('CLR: form was not hidden after submit');
    if (webhookHit) errors.push('CLR: a request was sent to a leadconnectorhq.com URL even though LEAD_ENDPOINT is unset');

    const dl = await page.evaluate(() => window.__clrDL || []);
    const dlText = JSON.stringify(dl).toLowerCase();
    ['test person', 'test.person@example.com', '0400000000', 'test co pty ltd'].forEach((pii) => {
      if (dlText.includes(pii.toLowerCase())) errors.push(`CLR: dataLayer push contained PII-looking value: ${pii}`);
    });
    if (dl.some((e) => e.event === 'form_complete')) errors.push('CLR: form_complete was pushed to dataLayer with no endpoint configured — nothing was actually submitted');
    if (!dl.some((e) => e.event === 'form_submit_blocked_no_endpoint')) errors.push('CLR: form_submit_blocked_no_endpoint event was not pushed to dataLayer');
    await page.close();
  });

  await run('commercial load review: keyboard-only completion', async () => {
    const page = await context.newPage();
    await page.goto(BASE + '/commercial-load-review/', { waitUntil: 'load', timeout: 15000 });

    // Q1: Tab to the radio group, arrow to "Business or commercial premises"
    // (first option), settle, then keep tabbing/arrowing through every
    // subsequent question exactly as a keyboard-only visitor would.
    await page.locator('#siteType-business').focus();
    await page.keyboard.press('Space');
    await page.waitForTimeout(600);

    await page.locator('#clrSuburb').focus();
    await page.keyboard.type('Chatswood');
    await page.keyboard.press('Tab');
    await page.keyboard.type('2067');
    await page.waitForTimeout(700);

    await page.locator('#loadPattern-daytime').focus();
    await page.keyboard.press('Space');
    await page.waitForTimeout(600);

    await page.locator('#spend-under1000').focus();
    await page.keyboard.press('Space');
    await page.waitForTimeout(600);

    await page.locator('#decision-decide').focus();
    await page.keyboard.press('Space');
    await page.waitForTimeout(600);

    const contactVisible = await page.evaluate(() => !document.getElementById('clrContact').hidden);
    if (!contactVisible) {
      errors.push('CLR keyboard-only: contact fields never revealed — keyboard-driven progressive reveal is broken');
      await page.close();
      return;
    }

    await page.locator('#clrFullName').focus();
    await page.keyboard.type('Keyboard Tester');
    await page.keyboard.press('Tab');
    await page.keyboard.type('Keyboard Test Co');
    await page.keyboard.press('Tab');
    await page.keyboard.type('keyboard.tester@example.com');
    await page.keyboard.press('Tab');
    await page.keyboard.type('0400111222');
    await page.locator('#clrConsent').focus();
    await page.keyboard.press('Space');
    await page.locator('#clrSubmit').focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    const notConnectedVisible = await page.evaluate(() => !document.getElementById('clrNotConnected').hidden);
    if (!notConnectedVisible) errors.push('CLR keyboard-only: submission via keyboard did not reach the "not connected" panel');
    await page.close();
  });

  await run('commercial load review: first-touch attribution survives a reload without query params', async () => {
    // Own context so localStorage starts clean — the shared `context` above
    // may already carry ft_ values from an earlier test's own first-touch
    // capture (which is correct behavior for that test, but would make
    // "first load ever" a false premise here).
    const freshContext = await browser.newContext();
    const page = await freshContext.newPage();
    await page.goto(BASE + '/commercial-load-review/?utm_source=meta&utm_campaign=first_touch_test&campaign_id=camp1', {
      waitUntil: 'load',
      timeout: 15000,
    });
    await page.waitForTimeout(200);
    const ftAfterFirstLoad = await page.evaluate(() => localStorage.getItem('ft_utm_campaign'));
    if (ftAfterFirstLoad !== 'first_touch_test') {
      errors.push(`CLR: first-touch utm_campaign not captured to localStorage on first load (got ${ftAfterFirstLoad})`);
    }
    // Reload with a DIFFERENT campaign in the query string — first-touch
    // must not be overwritten by this later visit.
    await page.goto(BASE + '/commercial-load-review/?utm_source=meta&utm_campaign=second_touch_test', {
      waitUntil: 'load',
      timeout: 15000,
    });
    await page.waitForTimeout(200);
    const ftAfterSecondLoad = await page.evaluate(() => localStorage.getItem('ft_utm_campaign'));
    const ltAfterSecondLoad = await page.evaluate(() => document.getElementById('lt_utm_campaign').value);
    if (ftAfterSecondLoad !== 'first_touch_test') {
      errors.push(`CLR: first-touch utm_campaign was overwritten by a later visit (got ${ftAfterSecondLoad})`);
    }
    if (ltAfterSecondLoad !== 'second_touch_test') {
      errors.push(`CLR: latest-touch utm_campaign did not update to the current visit's value (got ${ltAfterSecondLoad})`);
    }
    await freshContext.close();
  });

  // Commercial Solar & Battery Quote — second single-page conversion funnel.
  // 23 Sep 2026 (launch-readiness repair pass): same webhook removal as
  // Commercial Load Review above — LEAD_ENDPOINT is now '' in
  // site/js/commercial-solar-battery-quote.js, so submitting always shows
  // the "not connected" panel rather than a fake success state.

  await run('commercial solar battery quote: initial state — only Q1 visible, both consent boxes unticked', async () => {
    const page = await context.newPage();
    await page.goto(BASE + '/commercial-solar-battery-quote/', { waitUntil: 'load', timeout: 15000 });
    const state = await page.evaluate(() => ({
      q1Hidden: document.getElementById('csbqQ1').hidden,
      q2Hidden: document.getElementById('csbqQ2').hidden,
      q3Hidden: document.getElementById('csbqQ3').hidden,
      contactHidden: document.getElementById('csbqContact').hidden,
      consentChecked: document.getElementById('csbqConsent').checked,
      marketingChecked: document.getElementById('csbqMarketing').checked,
    }));
    if (state.q1Hidden) errors.push('CSBQ: Q1 should be visible on load');
    if (!state.q2Hidden || !state.q3Hidden || !state.contactHidden) {
      errors.push('CSBQ: only Q1 should be visible before any answers — found a later question already revealed');
    }
    if (state.consentChecked || state.marketingChecked) errors.push('CSBQ: consent checkboxes must be unticked by default');
    await page.close();
  });

  await run('commercial solar battery quote: full happy path via mouse — no PII in analytics, honest not-connected state (no fake success)', async () => {
    const page = await context.newPage();
    let webhookHit = false;
    await page.route('https://services.leadconnectorhq.com/**', (route) => {
      webhookHit = true;
      route.abort();
    });
    await page.goto(BASE + '/commercial-solar-battery-quote/?utm_source=meta&utm_campaign=csbq&fbclid=xyz789', {
      waitUntil: 'load',
      timeout: 15000,
    });
    await page.check('#propType-warehouse');
    await page.waitForTimeout(600);
    await page.check('#spend-5000-15000');
    await page.waitForTimeout(600);
    await page.check('#goal-lowerbills');
    await page.waitForTimeout(600);

    const contactVisible = await page.evaluate(() => !document.getElementById('csbqContact').hidden);
    if (!contactVisible) errors.push('CSBQ: contact fields did not reveal after answering all three questions');

    await page.fill('#csbqFullName', 'Test Person');
    await page.fill('#csbqBusinessName', 'Test Co Pty Ltd');
    await page.fill('#csbqPhone', '0400000000');
    await page.fill('#csbqWorkEmail', 'test.person@example.com');
    await page.fill('#csbqSuburb', 'Parramatta');
    await page.fill('#csbqPostcode', '2150');
    await page.check('#csbqConsent');

    await page.evaluate(() => {
      window.__csbqDL = [];
      const push = Array.prototype.push;
      window.dataLayer.push = function () {
        push.apply(window.__csbqDL, arguments);
        return push.apply(this, arguments);
      };
    });

    await page.click('#csbqSubmit');
    await page.waitForTimeout(500);

    const notConnectedVisible = await page.evaluate(() => !document.getElementById('csbqNotConnected').hidden);
    const confirmVisible = await page.evaluate(() => !document.getElementById('csbqConfirm').hidden);
    const formHidden = await page.evaluate(() => document.getElementById('csbqForm').hidden);
    if (!notConnectedVisible) errors.push('CSBQ: "not connected" panel did not appear on submit — LEAD_ENDPOINT is unset, this must never show fake success');
    if (confirmVisible) errors.push('CSBQ: the success confirmation panel is visible with no endpoint configured — this is a fake-success bug');
    if (!formHidden) errors.push('CSBQ: form was not hidden after submit');
    if (webhookHit) errors.push('CSBQ: a request was sent to a leadconnectorhq.com URL even though LEAD_ENDPOINT is unset');

    const dl = await page.evaluate(() => window.__csbqDL || []);
    const dlText = JSON.stringify(dl).toLowerCase();
    ['test person', 'test.person@example.com', '0400000000', 'test co pty ltd'].forEach((pii) => {
      if (dlText.includes(pii.toLowerCase())) errors.push(`CSBQ: dataLayer push contained PII-looking value: ${pii}`);
    });
    if (dl.some((e) => e.event === 'form_complete')) errors.push('CSBQ: form_complete was pushed to dataLayer with no endpoint configured — nothing was actually submitted');
    if (!dl.some((e) => e.event === 'form_submit_blocked_no_endpoint')) errors.push('CSBQ: form_submit_blocked_no_endpoint event was not pushed to dataLayer');
    await page.close();
  });

  await run('commercial solar battery quote: keyboard-only completion', async () => {
    const page = await context.newPage();
    await page.goto(BASE + '/commercial-solar-battery-quote/', { waitUntil: 'load', timeout: 15000 });

    await page.locator('#propType-manufacturing').focus();
    await page.keyboard.press('Space');
    await page.waitForTimeout(600);

    await page.locator('#spend-under5000').focus();
    await page.keyboard.press('Space');
    await page.waitForTimeout(600);

    await page.locator('#goal-resilience').focus();
    await page.keyboard.press('Space');
    await page.waitForTimeout(600);

    const contactVisible = await page.evaluate(() => !document.getElementById('csbqContact').hidden);
    if (!contactVisible) {
      errors.push('CSBQ keyboard-only: contact fields never revealed — keyboard-driven progressive reveal is broken');
      await page.close();
      return;
    }

    await page.locator('#csbqFullName').focus();
    await page.keyboard.type('Keyboard Tester');
    await page.keyboard.press('Tab');
    await page.keyboard.type('Keyboard Test Co');
    await page.keyboard.press('Tab');
    await page.keyboard.type('0400111222');
    await page.keyboard.press('Tab');
    await page.keyboard.type('keyboard.tester@example.com');
    await page.keyboard.press('Tab');
    await page.keyboard.type('Chatswood');
    await page.keyboard.press('Tab');
    await page.keyboard.type('2067');
    await page.locator('#csbqConsent').focus();
    await page.keyboard.press('Space');
    await page.locator('#csbqSubmit').focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    const notConnectedVisible = await page.evaluate(() => !document.getElementById('csbqNotConnected').hidden);
    if (!notConnectedVisible) errors.push('CSBQ keyboard-only: submission via keyboard did not reach the "not connected" panel');
    await page.close();
  });

  // Legacy route coverage: every entry in redirects/legacy-routes.json must
  // resolve to its destination via the client-side bridge page (see
  // docs/legacy-url-migration.md) — never a hard 404.
  await run('legacy route coverage', async () => {
    for (const route of legacyRoutes) {
      const page = await context.newPage();
      await page.goto(BASE + route.from + '/', { waitUntil: 'load', timeout: 15000 });
      await page.waitForTimeout(400); // let the 0-second meta-refresh fire
      const finalPath = new URL(page.url()).pathname;
      if (finalPath !== route.to) {
        errors.push(`Legacy route ${route.from} did not land on ${route.to} (landed on ${finalPath})`);
      }
      await page.close();
    }
  });

  await browser.close();

  // Nested-404 check under a simulated GitHub Pages project-site subpath —
  // see docs/legacy-url-migration.md's sibling doc and scripts/build-pages.js's
  // 404.html handling. Runs against pages-dist/ via scripts/qa-pages-server.js,
  // a separate lightweight server from the one serving `site/` above.
  await run('nested 404 works under GitHub Pages subpath', async () => {
    const PAGES_PORT = 8822;
    const BASE_PATH = '/Oz-Home-energy-redesign';
    const server = spawn('node', [path.join(__dirname, 'qa-pages-server.js'), String(PAGES_PORT), BASE_PATH], {
      stdio: 'ignore',
    });
    try {
      await new Promise((resolve, reject) => {
        const start = Date.now();
        const check = () => {
          require('http')
            .get(`http://localhost:${PAGES_PORT}${BASE_PATH}/`, (res) => {
              res.resume();
              resolve();
            })
            .on('error', () => {
              if (Date.now() - start > 5000) reject(new Error('qa-pages-server.js did not start in time'));
              else setTimeout(check, 100);
            });
        };
        check();
      });

      const browser2 = await chromium.launch(
        process.env.QA_CHROMIUM_PATH ? { executablePath: process.env.QA_CHROMIUM_PATH } : {}
      );
      const page = await browser2.newPage();
      const res = await page.goto(`http://localhost:${PAGES_PORT}${BASE_PATH}/missing/deep-page`, {
        waitUntil: 'load',
        timeout: 15000,
      });
      if (!res || res.status() !== 404) {
        errors.push(`Nested missing route did not return HTTP 404 (got ${res && res.status()})`);
      }
      const homeHref = await page.locator('a', { hasText: 'Return Home' }).getAttribute('href');
      if (!homeHref || !homeHref.startsWith(BASE_PATH)) {
        errors.push(`404 page's "Return Home" link is not anchored to the Pages base path: ${homeHref}`);
      }
      // Actually follow it and confirm it resolves (not another 404).
      const res2 = await page.goto(`http://localhost:${PAGES_PORT}${homeHref}`, { waitUntil: 'load', timeout: 15000 });
      if (!res2 || res2.status() !== 200) {
        errors.push(`404 page's "Return Home" link did not resolve to a real page (status ${res2 && res2.status()})`);
      }
      await browser2.close();
    } finally {
      server.kill();
    }
  });

  if (errors.length) {
    console.log('QA ISSUES FOUND:');
    errors.forEach((e) => console.log(' -', e));
    process.exitCode = 1;
  } else {
    console.log('QA PASSED (Chromium only — Safari/Firefox are NOT tested by this suite and remain unverified): no console errors, no horizontal overflow, all interactions work as expected.');
  }
})();
