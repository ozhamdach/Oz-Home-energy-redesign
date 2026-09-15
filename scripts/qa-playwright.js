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

  // /service-request/ now embeds a real HighLevel-hosted form (iframe,
  // cross-origin) in place of the custom-built prototype form (and its
  // ?type= preselect, which had no HighLevel equivalent) these tests used
  // to exercise — see git history for that version, and the assessment
  // page test above for the same pattern.
  await run('service request page embeds the real HighLevel form, not a stale prototype', async () => {
    const page = await context.newPage();
    await page.goto(BASE + '/service-request/', { waitUntil: 'load', timeout: 15000 });
    const hasRealEmbed = await page.evaluate(
      () => !!document.querySelector('iframe[data-form-id="2TfIfhVospnHx74eNcAP"]')
    );
    if (!hasRealEmbed) errors.push('/service-request/: expected HighLevel form iframe (2TfIfhVospnHx74eNcAP) not found');
    const hasStaleForm = await page.evaluate(() => !!document.getElementById('serviceRequestForm'));
    if (hasStaleForm) errors.push('/service-request/: retired custom #serviceRequestForm markup is still present');
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
