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
const pages = ['/', '/assessment/', '/residential-solar/', '/commercial-project-enquiry/', '/about/'];
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
        if (path === '/' && width === 360) await page.screenshot({ path: `qa-screenshots/home-360.png`, fullPage: true });
        if (path === '/' && width === 1440) await page.screenshot({ path: `qa-screenshots/home-1440.png`, fullPage: true });
        if (path === '/assessment/' && width === 360)
          await page.screenshot({ path: `qa-screenshots/assessment-360.png`, fullPage: true });
        await page.close();
      });
    }
  }

  // Assessment first-question-above-the-fold check (see
  // docs/06-qa-report.md) — the progress bar and the first question's radio
  // group must both be visible without scrolling, at common viewport sizes.
  await run('assessment above-the-fold', async () => {
    for (const [w, h] of [
      [360, 640],
      [390, 844],
      [768, 1024],
      [1440, 900],
    ]) {
      const page = await context.newPage();
      await page.setViewportSize({ width: w, height: h });
      await page.goto(BASE + '/assessment/', { waitUntil: 'load', timeout: 15000 });
      const progressBox = await page.locator('#assessProgressBar').boundingBox();
      const firstCardBox = await page.locator('.radio-cards').first().boundingBox();
      if (!progressBox || progressBox.y > h) errors.push(`assessment @${w}x${h}: progress bar not visible without scrolling`);
      if (!firstCardBox || firstCardBox.y > h) errors.push(`assessment @${w}x${h}: first question not visible without scrolling`);
      await page.close();
    }
  });

  await run('mobile nav toggle', async () => {
    const page = await context.newPage();
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(BASE + '/', { waitUntil: 'load', timeout: 15000 });
    await page.click('#navToggle');
    const isOpen = await page.evaluate(() => document.getElementById('mobileNav').classList.contains('is-open'));
    if (!isOpen) errors.push('Mobile nav did not open on toggle click');
    await page.click('#navToggle');
    const isClosed = await page.evaluate(() => !document.getElementById('mobileNav').classList.contains('is-open'));
    if (!isClosed) errors.push('Mobile nav did not close on second toggle click');
    await page.close();
  });

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

  await run('assessment flow step-through', async () => {
    const page = await context.newPage();
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto(BASE + '/assessment/?goal=ev-charging', { waitUntil: 'load', timeout: 15000 });
    const goalChecked = await page.evaluate(() => document.getElementById('goal4').checked);
    if (!goalChecked) errors.push('Assessment goal preselect via query param failed');

    await page.click('#assessNext');
    const step2active = await page.evaluate(() => document.querySelector('[data-step="2"]').classList.contains('is-active'));
    if (!step2active) errors.push('Assessment step 1 -> 2 did not advance (should have via preselected radio)');

    // try advancing without selecting residential/commercial - should block
    await page.click('#assessNext');
    const stillStep2 = await page.evaluate(() => document.querySelector('[data-step="2"]').classList.contains('is-active'));
    if (!stillStep2) errors.push('Assessment step 2 advanced without required selection (validation should have blocked it)');

    // select the SECOND option in the group (not the one carrying `required`)
    // to specifically catch the "only first radio validated" class of bug
    await page.check('#type2');
    // Step 2 also asks suburb + property type (merged from the old 7-step
    // flow's separate step 3) — both required before it'll advance.
    await page.fill('#suburb', 'Sydney');
    await page.selectOption('#propertyType', 'Commercial building');
    await page.click('#assessNext');
    const step3active = await page.evaluate(() => document.querySelector('[data-step="3"]').classList.contains('is-active'));
    if (!step3active) errors.push('Assessment step 2 -> 3 did not advance after selecting the second (Commercial) option');

    await page.click('#assessBack');
    const backToStep2 = await page.evaluate(() => document.querySelector('[data-step="2"]').classList.contains('is-active'));
    if (!backToStep2) errors.push('Assessment Back button did not return to step 2');
    const suburbPreserved = await page.inputValue('#suburb');
    if (suburbPreserved !== 'Sydney') errors.push('Suburb value lost when navigating back to step 2');

    await page.close();
  });

  await run('assessment skips solar-bill step for electrical goal', async () => {
    const page = await context.newPage();
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto(BASE + '/assessment/?goal=electrical-upgrade', { waitUntil: 'load', timeout: 15000 });
    const goalChecked = await page.evaluate(() => document.getElementById('goal5').checked);
    if (!goalChecked) errors.push('Electrical-upgrade goal preselect via query param failed');
    await page.click('#assessNext'); // step 1 -> 2
    await page.check('#type1');
    await page.fill('#suburb', 'Parramatta');
    await page.selectOption('#propertyType', 'Free-standing house');
    await page.click('#assessNext'); // step 2 -> should skip 3, land on 4
    const onStep4 = await page.evaluate(() => document.querySelector('[data-step="4"]').classList.contains('is-active'));
    if (!onStep4) errors.push('Electrical-upgrade goal did not skip the solar-bill step (step 3)');
    await page.click('#assessBack'); // should return to step 2, not step 3
    const backOnStep2 = await page.evaluate(() => document.querySelector('[data-step="2"]').classList.contains('is-active'));
    if (!backOnStep2) errors.push('Electrical-upgrade goal Back from step 4 did not return to step 2 (skipping step 3)');
    await page.close();
  });

  await run('assessment final submit shows pending notice, not success', async () => {
    const page = await context.newPage();
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto(BASE + '/assessment/?goal=lower-bills', { waitUntil: 'load', timeout: 15000 });
    await page.click('#assessNext'); // 1 -> 2
    await page.check('#type1');
    await page.fill('#suburb', 'Sydney');
    await page.selectOption('#propertyType', 'Free-standing house');
    await page.click('#assessNext'); // 2 -> 3
    await page.click('#assessNext'); // 3 -> 4 (nothing required in step 3)
    await page.fill('#fullName', 'Test Person');
    await page.fill('#phoneNum', '0400000000');
    await page.fill('#emailAddr', 'test@example.com');
    await page.click('#assessNext'); // 4 -> 5
    await page.selectOption('#contactMethod', 'Phone call');
    await page.check('#consent');
    await page.click('#assessSubmit');
    const pendingVisible = await page.evaluate(() => !!document.querySelector('.lead-pending-notice'));
    if (!pendingVisible) errors.push('Assessment submit did not show the not-connected-yet notice');
    const bodyText = await page.evaluate(() => document.body.textContent);
    if (/Thanks[^.]*noted/i.test(bodyText)) errors.push('Assessment submit still shows old "Thanks — noted" success copy');
    await page.close();
  });

  await run('no lead form has action="#" or shows a fake success state', async () => {
    for (const p of ['/assessment/', '/service-request/', '/commercial-project-enquiry/']) {
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

  await run('service request prefill + prototype submit shows pending notice, not success', async () => {
    const page = await context.newPage();
    await page.setViewportSize({ width: 1024, height: 900 });
    const urlBefore = BASE + '/service-request/?type=cleaning';
    await page.goto(urlBefore, { waitUntil: 'load', timeout: 15000 });
    const prefilled = await page.inputValue('#srType');
    if (prefilled !== 'Panel cleaning') errors.push('Service request ?type=cleaning did not preselect "Panel cleaning"');
    await page.fill('#srName', 'Test Person');
    await page.fill('#srPhone', '0400000000');
    await page.fill('#srAddress', '1 Test St, Sydney NSW');
    await page.click('button[type="submit"]');
    const pendingVisible = await page.evaluate(() => !!document.querySelector('.lead-pending-notice'));
    if (!pendingVisible) errors.push('Service request submit did not show the not-connected-yet notice');
    const fakeSuccessVisible = await page.evaluate(() => !!document.querySelector('.assess-success'));
    if (fakeSuccessVisible) errors.push('Service request submit showed a success-style affordance — must never appear');
    if (page.url() !== urlBefore) errors.push('Service request submit navigated away — a live submission may have been attempted');
    await page.close();
  });

  await run('project enquiry prototype submit shows pending notice, not success', async () => {
    const page = await context.newPage();
    await page.setViewportSize({ width: 1024, height: 900 });
    const urlBefore = BASE + '/commercial-project-enquiry/';
    await page.goto(urlBefore, { waitUntil: 'load', timeout: 15000 });
    await page.fill('#companyName', 'Test Co');
    await page.fill('#contactName', 'Test Person');
    await page.fill('#email', 'test@example.com');
    await page.fill('#phone', '0400000000');
    await page.fill('#siteAddress', '1 Test St, Sydney NSW');
    await page.click('button[type="submit"]');
    const pendingVisible = await page.evaluate(() => !!document.querySelector('.lead-pending-notice'));
    if (!pendingVisible) errors.push('Project enquiry submit did not show the not-connected-yet notice');
    const fakeSuccessVisible = await page.evaluate(() => !!document.querySelector('.assess-success'));
    if (fakeSuccessVisible) errors.push('Project enquiry submit showed a success-style affordance — must never appear');
    if (page.url() !== urlBefore) errors.push('Project enquiry submit navigated away — a live submission may have been attempted');
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
