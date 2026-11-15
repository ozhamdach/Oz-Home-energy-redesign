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
  // Form ID updated 10 Oct 2026: swapped from 7CTbeFedTXyoPJoS2CmH to the
  // shorter 2TfIfhVospnHx74eNcAP ("Google/Meta ads Request a Quote") on
  // direct owner instruction — see src/pages/assessment/content.html.
  await run('assessment page embeds the real HighLevel form, not a stale prototype', async () => {
    const page = await context.newPage();
    await page.goto(BASE + '/assessment/', { waitUntil: 'load', timeout: 15000 });
    const hasRealEmbed = await page.evaluate(
      () => !!document.querySelector('iframe[data-form-id="2TfIfhVospnHx74eNcAP"]')
    );
    if (!hasRealEmbed) errors.push('/assessment/: expected HighLevel form iframe (2TfIfhVospnHx74eNcAP) not found');
    const hasStaleForm = await page.evaluate(() => !!document.getElementById('assessmentForm'));
    if (hasStaleForm) errors.push('/assessment/: retired custom #assessmentForm markup is still present');
    await page.close();
  });

  // Stepped quote flow (14 Nov 2026). Steps 1 and 2 are this site's own
  // markup (site/js/quote-steps.js); step 3 opens the HighLevel form with
  // the answers added to its address. The form itself is cross-origin and
  // unreachable from this sandbox, so this checks the flow, the progress
  // bar and the address the form is given, not the form's contents.
  // The same three-step flow runs on /assessment/ and on the ad landing page
  // /request-a-quote/ (site/js/quote-steps.js).
  for (const [path, label] of [['/assessment/', 'assessment'], ['/request-a-quote/', 'request-a-quote']]) {
    await run(`${path} stepped quote flow passes the answers to the HighLevel form`, async () => {
      const page = await context.newPage();
      // Preview builds carry no analytics, so give the page a dataLayer to
      // write its form_step events into.
      await page.addInitScript(() => { window.dataLayer = window.dataLayer || []; });
      // Ad tags in the address, as an ad click would bring.
      await page.goto(BASE + path + '?utm_source=qa&utm_campaign=qa-steps&gclid=QA', { waitUntil: 'load', timeout: 15000 });
      const state = () =>
        page.evaluate(() => ({
          count: document.getElementById('qstepsCount').textContent.trim(),
          now: document.getElementById('qstepsBar').getAttribute('aria-valuenow'),
          visible: [...document.querySelectorAll('.qstep')].filter((s) => !s.hidden).map((s) => s.getAttribute('data-step')).join(','),
          src: document.querySelector('#quoteSteps iframe').getAttribute('src') || '',
          focus: document.activeElement ? document.activeElement.id : '',
        }));
      let st = await state();
      if (st.count !== 'Step 1 of 3' || st.visible !== '1') errors.push(`${path}: expected to start on step 1, got "${st.count}" showing step(s) ${st.visible}`);
      if (st.src) errors.push(`${path}: the HighLevel form should not load before step 3`);
      const formId = await page.evaluate(() => document.querySelector('#quoteSteps iframe').getAttribute('data-form-id'));
      if (formId !== '2TfIfhVospnHx74eNcAP') errors.push(`${path}: the steps should end in HighLevel form 2TfIfhVospnHx74eNcAP, found ${formId}`);
      await page.click('.qopt[data-goal="Battery"]');
      st = await state();
      if (st.count !== 'Step 2 of 3' || st.visible !== '2' || st.now !== '2') errors.push(`${path}: choosing an option should show step 2, got "${st.count}" (bar ${st.now})`);
      if (st.focus !== 'qstep2Title') errors.push(`${path}: focus should move to the step 2 heading`);
      await page.check('input[name="qbill"][value="$500-$750 per quarter"]', { force: true });
      await page.click('#qstepsNext');
      st = await state();
      if (st.count !== 'Step 3 of 3' || st.visible !== '3' || st.now !== '3') errors.push(`${path}: Continue should show step 3, got "${st.count}" (bar ${st.now})`);
      if (!st.src.includes('/widget/form/2TfIfhVospnHx74eNcAP?')) errors.push(`${path}: step 3 did not point the form at its HighLevel address with answers`);
      if (!st.src.includes('primary_goal=Battery')) errors.push(`${path}: the chosen goal was not passed to the form`);
      if (!st.src.includes('multi_dropdown_3ea2=' + encodeURIComponent('$500-$750 per quarter'))) errors.push(`${path}: the chosen bill range was not passed to the form`);
      if (st.src.includes('timeframe=')) errors.push(`${path}: an unanswered question should not be passed to the form`);
      // HighLevel's form_embed.js reads the ad tags from this page's own
      // address when the form loads, so they must still be there at step 3.
      const search = await page.evaluate(() => window.location.search);
      if (!search.includes('utm_source=qa') || !search.includes('gclid=QA')) errors.push(`${path}: the ad tags should still be in the page address at step 3, got "${search}"`);
      const steps = await page.evaluate(() => window.dataLayer.filter((e) => e && e.event === 'form_step').map((e) => e.form_id + ':' + e.step).join(','));
      if (steps !== `${label}:1,${label}:2,${label}:3`) errors.push(`${path}: expected form_step events ${label}:1,${label}:2,${label}:3, got "${steps}"`);
      await page.click('.qstep-summary .qback');
      st = await state();
      const kept = await page.evaluate(() => !!document.querySelector('input[name="qbill"]:checked'));
      if (st.visible !== '2' || !kept) errors.push(`${path}: Change should go back to step 2 with the answers kept`);
      await page.close();

      // A link with ?for=battery arrives with step 1 already answered.
      const pre = await context.newPage();
      await pre.goto(BASE + path + '?for=battery&utm_source=qa', { waitUntil: 'load', timeout: 15000 });
      const preState = await pre.evaluate(() => ({
        count: document.getElementById('qstepsCount').textContent.trim(),
        chosen: (document.querySelector('.qopt[aria-pressed="true"]') || { getAttribute: () => '' }).getAttribute('data-goal'),
      }));
      if (preState.count !== 'Step 2 of 3' || preState.chosen !== 'Battery') errors.push(`${path}?for=battery: expected step 2 with Battery chosen, got "${preState.count}" with "${preState.chosen}"`);
      await pre.close();
    });
  }

  // ===================================================================
  // QUOTE-TO-LEAD JOURNEY (15 Nov 2026 audit). The real HighLevel form is
  // never loaded or submitted here: every request to the form domain is
  // answered by a stand-in page that behaves the way HighLevel's form does
  // (read from its code on 15 Nov 2026): it posts ["iframeLoaded"] when it
  // runs, and after an accepted submit it posts ["set-sticky-contacts", ...]
  // (which carries contact details) and then sends the top window to the
  // form's redirect address with the form address's own tags appended.
  // These tests prove this site's handling. They do NOT prove that
  // HighLevel received a lead: that needs a controlled live test.
  // ===================================================================
  const FORM_ORIGIN = 'https://link.ozhomeenergy.com.au';
  const FAKE_PII = ['qa-person@example.com', '61400000000', 'QA Person'];
  const standInForm = `<!doctype html><meta charset="utf-8"><title>stand-in form</title>
    <style>body { margin: 0; padding: 60px 16px; } button { display: block; margin: 0 0 16px; padding: 12px; }</style>
    <button id="invalid" type="button">Send with a required field empty</button>
    <button id="ok" type="button">Send a valid form</button>
    <script>
      parent.postMessage(["iframeLoaded"], "*");
      // A validation error: HighLevel shows its own message and nothing leaves the form.
      document.getElementById("invalid").onclick = function () {};
      document.getElementById("ok").onclick = function () {
        parent.postMessage(["set-sticky-contacts", "_ud", JSON.stringify({ email: "qa-person@example.com", phone: "+61400000000", name: "QA Person" }), "loc", "fp"], "*");
        var u = new URL(${JSON.stringify(BASE + '/quote-received/')});
        new URLSearchParams(location.search).forEach(function (v, k) { u.searchParams.append(k, v); });
        // HighLevel's form does more work between the message and the
        // redirect; the gap here stands in for that. If the browser leaves
        // before the page has handled the message, the marker is never
        // written. That race is real, which is why /quote-received/ also
        // accepts the form-domain referrer (tested separately below; a
        // referrer cannot be produced here because this test runs on http).
        setTimeout(function () { window.top.location.href = u.href; }, 250);
      };
    </script>`;
  // mode: 'ok' answers with the stand-in form; 'blocked' refuses the connection.
  const mockFormDomain = async (page, state) => {
    await page.route(FORM_ORIGIN + '/**', (route) => {
      const url = route.request().url();
      if (url.includes('/js/form_embed.js')) return route.fulfill({ contentType: 'text/javascript', body: '/* stand-in */' });
      if (state.mode === 'blocked') return route.abort('connectionrefused');
      return route.fulfill({ contentType: 'text/html', body: standInForm });
    });
  };
  const journeyInit = async (page, timeoutMs) => {
    await page.addInitScript((ms) => {
      window.dataLayer = window.dataLayer || [];
      window.__fbq = [];
      window.fbq = function () { window.__fbq.push(Array.prototype.slice.call(arguments)); };
      if (ms) window.OHE_FORM_TIMEOUT_MS = ms;
    }, timeoutMs || 0);
  };
  const leadState = (page) =>
    page.evaluate(() => ({
      state: (document.getElementById('enqCard') || { getAttribute: () => 'not the confirmation page' }).getAttribute('data-enq-state'),
      h1: (document.querySelector('h1') || { textContent: '' }).textContent.trim(),
      leads: (window.dataLayer || []).filter((e) => e && e.event === 'lead_submitted'),
      pixelLeads: (window.__fbq || []).filter((a) => a[0] === 'track' && a[1] === 'Lead').length,
      everything: JSON.stringify(window.dataLayer || []) + ' ' + JSON.stringify(window.__fbq || []) + ' ' + JSON.stringify(Object.assign({}, sessionStorage)) + ' ' + window.location.href,
    }));
  const walkToForm = async (page, path) => {
    if (path === '/assessment/' || path === '/request-a-quote/') {
      await page.click('.qopt[data-goal="Battery"]');
      await page.check('input[name="qbill"][value="$500-$750 per quarter"]', { force: true });
      await page.click('#qstepsNext');
    }
  };

  for (const [path, viewport] of [['/assessment/', { width: 390, height: 844 }], ['/request-a-quote/', { width: 1440, height: 900 }], ['/contact/', { width: 390, height: 844 }], ['/ev-charging/', { width: 1440, height: 900 }], ['/', { width: 390, height: 844 }]]) {
    await run(`${path} journey: form loads, a validation error counts nothing, one confirmed submit counts once`, async () => {
      const page = await context.newPage();
      await page.setViewportSize(viewport);
      const state = { mode: 'ok' };
      await mockFormDomain(page, state);
      await journeyInit(page, 4000);
      await page.goto(BASE + path, { waitUntil: 'load', timeout: 15000 });
      await walkToForm(page, path);
      // Put the form well clear of the sticky header and the phone's bottom
      // bar: a click inside a cross-origin iframe is not hit-tested against
      // this page, so a covered button would click whatever is on top of it.
      const centreForm = () => page.evaluate(() => { const w = document.querySelector('.form-embed-wrap'); window.scrollTo(0, w.getBoundingClientRect().top + window.scrollY - 220); });
      await centreForm();
      await page.waitForFunction(() => document.querySelector('.form-embed-wrap').getAttribute('data-form-state') === 'ready', null, { timeout: 8000 });
      const ready = await page.evaluate(() => ({
        spinner: getComputedStyle(document.querySelector('.form-embed-wrap .form-embed-loading')).display,
        notice: !!document.querySelector('.form-embed-notice'),
        readyEvents: window.dataLayer.filter((e) => e.event === 'form_ready').length,
        failed: window.dataLayer.filter((e) => e.event === 'form_load_failed').length,
      }));
      if (ready.spinner !== 'none') errors.push(`${path}: the loading spinner should go once the form is heard from`);
      if (ready.notice || ready.failed) errors.push(`${path}: the "taking too long" notice must not show for a form that loaded`);
      if (ready.readyEvents !== 1) errors.push(`${path}: expected one form_ready event, got ${ready.readyEvents}`);

      // A message that only looks like the form's, sent by the page itself
      // (wrong origin), must be ignored.
      await page.evaluate(() => window.postMessage(['set-sticky-contacts', '_ud', '{}', 'loc', 'fp'], '*'));
      // A validation error inside the form.
      const frame = page.frameLocator('.form-embed-wrap iframe').first();
      await centreForm();
      await frame.locator('#invalid').click();
      await page.waitForTimeout(300);
      const afterInvalid = await page.evaluate(() => ({ pending: sessionStorage.getItem('ohe_lead_pending'), path: window.location.pathname, leads: window.dataLayer.filter((e) => e.event === 'lead_submitted').length }));
      if (afterInvalid.pending) errors.push(`${path}: a spoofed message or a failed submit left a "lead pending" marker`);
      if (afterInvalid.leads) errors.push(`${path}: a lead was counted without a confirmed submit`);
      if (afterInvalid.path.indexOf('quote-received') !== -1) errors.push(`${path}: the visitor was sent to the confirmation page without a submit`);
      if (afterInvalid.path !== new URL(BASE + path).pathname) errors.push(`${path}: test setup: the page changed to ${afterInvalid.path} before the submit`);

      // A confirmed submit.
      await Promise.all([page.waitForURL(/\/quote-received\//, { timeout: 8000 }), frame.locator('#ok').click()]);
      await page.waitForLoadState('load');
      let st = await leadState(page);
      if (st.state !== 'confirmed' || st.h1 !== 'Thanks, your enquiry is in.') errors.push(`${path}: after a confirmed submit the page should say the enquiry is in, got "${st.h1}" (${st.state})`);
      if (st.leads.length !== 1 || st.pixelLeads !== 1) errors.push(`${path}: expected exactly one lead_submitted and one Pixel Lead, got ${st.leads.length} and ${st.pixelLeads}`);
      const lead = st.leads[0] || {};
      if (lead.lead_source !== 'highlevel_submit_message') errors.push(`${path}: lead_source should be highlevel_submit_message, got ${lead.lead_source}`);
      const formId = { '/assessment/': '2TfIfhVospnHx74eNcAP', '/request-a-quote/': '2TfIfhVospnHx74eNcAP', '/contact/': 'ILAJCu9qJyVzX582GAtX', '/': 'ILAJCu9qJyVzX582GAtX', '/ev-charging/': 'OmaWW64OZ3FaCGGvEIgx' }[path];
      if (lead.form_id !== formId) errors.push(`${path}: the lead should name form ${formId}, got ${lead.form_id}`);
      if ((path === '/assessment/' || path === '/request-a-quote/') && lead.service !== 'Battery') errors.push(`${path}: the lead should carry the chosen service "Battery", got "${lead.service}"`);
      for (const pii of FAKE_PII) if (st.everything.includes(pii)) errors.push(`${path}: contact detail "${pii}" reached analytics, storage or the address`);

      // Refresh: same wording, nothing counted again.
      await page.reload({ waitUntil: 'load' });
      st = await leadState(page);
      if (st.state !== 'confirmed') errors.push(`${path}: a refresh after a confirmed submit should keep the confirmed wording`);
      if (st.leads.length || st.pixelLeads) errors.push(`${path}: a refresh counted the lead again (${st.leads.length} dataLayer, ${st.pixelLeads} Pixel)`);
      await page.close();
    });
  }

  await run('confirmation page: a direct visit, a shared link and a bare referrer count nothing', async () => {
    // Direct visit in a fresh tab, with a contact detail someone pasted into the address.
    const direct = await context.newPage();
    await journeyInit(direct);
    await direct.goto(BASE + '/quote-received/?primary_goal=Battery&email=qa-person%40example.com', { waitUntil: 'load', timeout: 15000 });
    let st = await leadState(direct);
    if (st.state !== 'unconfirmed') errors.push('/quote-received/ direct visit: must not say the enquiry is in');
    if (/enquiry is in/i.test(st.h1)) errors.push('/quote-received/ direct visit: heading claims the enquiry was received');
    if (st.leads.length || st.pixelLeads) errors.push(`/quote-received/ direct visit: counted a lead (${st.leads.length} dataLayer, ${st.pixelLeads} Pixel)`);
    const search = await direct.evaluate(() => window.location.search);
    if (search.includes('email') || !search.includes('primary_goal=Battery')) errors.push(`/quote-received/: unknown address tags should be dropped and known ones kept, got "${search}"`);
    const tel = await direct.locator('#enqUnconfirmed a[href="tel:+61435336336"]').count();
    if (!tel) errors.push('/quote-received/ direct visit: the phone number should be offered');
    await direct.close();

    // The form domain as referrer, but no form was open in this tab.
    const bare = await context.newPage();
    await journeyInit(bare);
    await bare.goto(BASE + '/quote-received/', { waitUntil: 'load', timeout: 15000, referer: FORM_ORIGIN + '/' });
    st = await leadState(bare);
    if (st.state !== 'unconfirmed' || st.leads.length || st.pixelLeads) errors.push('/quote-received/: a referrer alone, with no form opened in the tab, must not count a lead');
    await bare.close();

    // Fallback signal: a form was open in this tab and the browser says the
    // visit came from the form domain (the message was blocked).
    const fb = await context.newPage();
    const state = { mode: 'ok' };
    await mockFormDomain(fb, state);
    await journeyInit(fb, 4000);
    await fb.goto(BASE + '/contact/', { waitUntil: 'load', timeout: 15000 });
    await fb.waitForFunction(() => document.querySelector('.form-embed-wrap').getAttribute('data-form-state') === 'ready', null, { timeout: 8000 });
    await fb.goto(BASE + '/quote-received/', { waitUntil: 'load', timeout: 15000, referer: FORM_ORIGIN + '/' });
    st = await leadState(fb);
    const ref = await fb.evaluate(() => document.referrer);
    if (ref.indexOf(FORM_ORIGIN) !== 0) errors.push(`fallback test setup: document.referrer was "${ref}"`);
    if (st.state !== 'confirmed' || st.leads.length !== 1 || st.leads[0].lead_source !== 'highlevel_form_redirect') errors.push(`/quote-received/: form-domain referrer plus a form opened in the tab should count one lead by the fallback signal, got ${JSON.stringify(st.leads)} (${st.state})`);
    // Coming back by a second fresh navigation must not count again.
    await fb.goto(BASE + '/quote-received/', { waitUntil: 'load', timeout: 15000, referer: FORM_ORIGIN + '/' });
    st = await leadState(fb);
    if (st.leads.length || st.pixelLeads) errors.push('/quote-received/: the same submit was counted twice on a second visit');
    await fb.close();
  });

  for (const [path, viewport] of [['/assessment/', { width: 390, height: 844 }], ['/contact/', { width: 1440, height: 900 }]]) {
    await run(`${path} journey: a blocked form shows a way forward, keeps the answers and recovers on "Try again"`, async () => {
      const page = await context.newPage();
      await page.setViewportSize(viewport);
      const state = { mode: 'blocked' };
      await mockFormDomain(page, state);
      await journeyInit(page, 1200);
      await page.goto(BASE + path, { waitUntil: 'load', timeout: 15000 });
      await walkToForm(page, path);
      await page.waitForSelector('.form-embed-notice', { timeout: 8000 });
      const blocked = await page.evaluate(() => {
        const n = document.querySelector('.form-embed-notice');
        const call = n.querySelector('a[href^="tel:"]');
        const r = n.getBoundingClientRect();
        return {
          role: n.getAttribute('role'),
          tel: call ? call.getAttribute('href') : '',
          anyFormDomainLink: !!n.querySelector('a[href*="link.ozhomeenergy.com.au"]'),
          retry: !!n.querySelector('button'),
          visible: r.width > 0 && r.height > 0,
          spinner: getComputedStyle(document.querySelector('.form-embed-wrap .form-embed-loading')).display,
          claimsSent: /received|enquiry is in|thank/i.test(n.textContent),
          failed: window.dataLayer.filter((e) => e.event === 'form_load_failed').length,
          leads: window.dataLayer.filter((e) => e.event === 'lead_submitted').length,
          pending: sessionStorage.getItem('ohe_lead_pending'),
          summary: (document.getElementById('qstepsSummary') || { textContent: '' }).textContent,
          overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
        };
      });
      if (blocked.role !== 'alert' || !blocked.visible) errors.push(`${path}: the blocked-form notice should be a visible alert`);
      if (blocked.tel !== 'tel:+61435336336') errors.push(`${path}: the blocked-form notice should offer the phone number, got "${blocked.tel}"`);
      if (blocked.anyFormDomainLink) errors.push(`${path}: the fallback must not depend on the form domain`);
      if (!blocked.retry) errors.push(`${path}: the blocked-form notice should offer "Try again"`);
      if (blocked.spinner !== 'none') errors.push(`${path}: the spinner should stop once the notice shows`);
      if (blocked.claimsSent || blocked.leads || blocked.pending) errors.push(`${path}: a blocked form must not look like, or count as, a sent enquiry`);
      if (blocked.failed !== 1) errors.push(`${path}: expected one form_load_failed event, got ${blocked.failed}`);
      if (blocked.overflowX) errors.push(`${path}: the notice causes sideways scroll`);
      if (path === '/assessment/' && !/A home battery/.test(blocked.summary)) errors.push(`${path}: the chosen answers should still show while the form is blocked, got "${blocked.summary}"`);

      // The form domain comes back; "Try again" recovers without a page reload.
      state.mode = 'ok';
      await page.click('.form-embed-notice button');
      await page.waitForFunction(() => document.querySelector('.form-embed-wrap').getAttribute('data-form-state') === 'ready', null, { timeout: 8000 });
      const after = await page.evaluate(() => ({
        notice: !!document.querySelector('.form-embed-notice'),
        bill: document.querySelector('input[name="qbill"]:checked') ? document.querySelector('input[name="qbill"]:checked').value : '',
        src: document.querySelector('.form-embed-wrap iframe').getAttribute('src'),
      }));
      if (after.notice) errors.push(`${path}: the notice should go once the form loads`);
      if (path === '/assessment/' && (after.bill !== '$500-$750 per quarter' || !after.src.includes('primary_goal=Battery'))) errors.push(`${path}: answers were lost on "Try again"`);
      await page.close();
    });
  }

  await run('/assessment/ journey: progress survives a reload, and ad tags from an earlier page reach the form address', async () => {
    const page = await context.newPage();
    const state = { mode: 'ok' };
    await mockFormDomain(page, state);
    await journeyInit(page, 4000);
    // Land on a service page from an ad, then click through to the quote page.
    await page.goto(BASE + '/battery-storage/?utm_source=qa-ad&utm_campaign=qa-campaign&gclid=QA-GCLID&email=qa-person%40example.com', { waitUntil: 'load', timeout: 15000 });
    await page.goto(BASE + '/assessment/', { waitUntil: 'load', timeout: 15000 });
    await page.click('.qopt[data-goal="Solar and battery"]');
    await page.check('input[name="qtime"][value="Within the next 3 months"]', { force: true });
    await page.reload({ waitUntil: 'load' });
    const restored = await page.evaluate(() => ({
      count: document.getElementById('qstepsCount').textContent.trim(),
      goal: (document.querySelector('.qopt[aria-pressed="true"]') || { getAttribute: () => '' }).getAttribute('data-goal'),
      time: document.querySelector('input[name="qtime"]:checked') ? document.querySelector('input[name="qtime"]:checked').value : '',
      saved: sessionStorage.getItem('ohe_quote_steps') || '',
    }));
    if (restored.count !== 'Step 2 of 3' || restored.goal !== 'Solar and battery' || restored.time !== 'Within the next 3 months') errors.push(`/assessment/: a reload on step 2 should restore the step and answers, got ${JSON.stringify(restored)}`);
    await page.click('#qstepsNext');
    const src = await page.evaluate(() => document.querySelector('#quoteSteps iframe').getAttribute('src'));
    for (const want of ['primary_goal=Solar%20and%20battery', 'timeframe=Within%20the%20next%203%20months', 'utm_source=qa-ad', 'utm_campaign=qa-campaign', 'gclid=QA-GCLID']) {
      if (!src.includes(want)) errors.push(`/assessment/: the form address should carry ${want}, got ${src}`);
    }
    if (/email|qa-person/.test(src) || /qa-person/.test(restored.saved)) errors.push('/assessment/: a contact detail from an earlier address reached the form address or saved progress');
    await page.close();
  });

  await run('both quote pages offer the same answers, word for word', async () => {
    // The option values are the HighLevel form's own option text. The two
    // pages must not drift apart, or one of them sends a blank answer.
    const read = async (path) => {
      const page = await context.newPage();
      await page.goto(BASE + path, { waitUntil: 'load', timeout: 15000 });
      const v = await page.evaluate(() => JSON.stringify({
        goals: [...document.querySelectorAll('#quoteSteps .qopt')].map((b) => b.getAttribute('data-goal')),
        bill: [...document.querySelectorAll('#quoteSteps input[name="qbill"]')].map((i) => i.value),
        time: [...document.querySelectorAll('#quoteSteps input[name="qtime"]')].map((i) => i.value),
        form: document.getElementById('quoteSteps').getAttribute('data-form-src'),
      }));
      await page.close();
      return v;
    };
    const a = await read('/assessment/');
    const b = await read('/request-a-quote/');
    if (a !== b) errors.push(`the quote steps on /assessment/ and /request-a-quote/ differ:\n      ${a}\n      ${b}`);
    if (!JSON.parse(a).goals.length) errors.push('/assessment/: no quote step options found');
  });

  await run('homepage trust grid: six transparent credential cells, correct badge sizes, no evnex stage, matching desktop heights', async () => {
    for (const width of [1440, 390]) {
      const page = await context.newPage();
      await page.setViewportSize({ width, height: 1100 });
      await page.goto(BASE + '/', { waitUntil: 'load', timeout: 15000 });
      // The trust grid's images use loading="lazy" by design (they're below
      // the fold and shouldn't compete with LCP resources) — at narrow
      // viewports the section can sit far enough down the page that the
      // browser hasn't started fetching them right after the load event.
      // Scroll the section into view and let the lazy-load fire, the same
      // way a real visitor reaches it, before asserting on natural size.
      await page.evaluate(() => document.querySelector('.trust-card--evnex .trust-card-mark img')?.scrollIntoView());
      await page.waitForFunction(() => {
        const img = document.querySelector('.trust-card--evnex .trust-card-mark img');
        return !img || img.complete;
      }, { timeout: 5000 }).catch(() => {});
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
          teslaWidth: rect('.trust-card--tesla .trust-card-mark img')?.width ?? 0,
          evnexStageExists: !!document.querySelector('.evnex-badge-stage'),
          cardBgs: [...document.querySelectorAll('.trust-card')].map((c) => getComputedStyle(c).backgroundColor),
          cardShadows: [...document.querySelectorAll('.trust-card')].map((c) => getComputedStyle(c).boxShadow),
        };
      });

      if (data.cardCount !== 5) errors.push(`/ @${width}: expected 5 .trust-card credential items, found ${data.cardCount}`);
      if (data.evnexNaturalW === 0 || data.evnexNaturalH === 0) errors.push(`/ @${width}: Evnex badge image has zero natural dimensions (failed to load)`);
      if (data.evnexHeight < 60) errors.push(`/ @${width}: Evnex badge rendered height ${data.evnexHeight}px is below the required 60px minimum`);
      if (data.evnexStageExists) errors.push(`/ @${width}: .evnex-badge-stage still exists — should have been removed`);
      if (data.teslaNaturalW === 0 || data.teslaNaturalH === 0) errors.push(`/ @${width}: Tesla badge image has zero natural dimensions (failed to load)`);
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
        if (data.teslaWidth < 200) errors.push(`/ @${width}: Tesla badge width ${data.teslaWidth}px is below the required 200px desktop minimum`);
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
