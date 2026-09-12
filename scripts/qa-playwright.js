#!/usr/bin/env node
/**
 * Responsive/accessibility/interaction smoke test against a built `site/`.
 * Run: node scripts/build.js && (cd site && python3 -m http.server 8811 &)
 *      then: node scripts/qa-playwright.js
 * Requires the `playwright` package and a Chromium executable — in this
 * project's original build environment both were pre-installed globally;
 * elsewhere, `npm install -D playwright && npx playwright install chromium`
 * and drop the explicit executablePath below.
 */
const { chromium } = require('playwright');

const BASE = process.env.QA_BASE_URL || 'http://localhost:8811';
const widths = [375, 768, 1024, 1440];
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
          // fonts.googleapis.com/gstatic.com requests above — that's this
          // test's own network isolation, not a site defect.
          if (msg.type() === 'error' && !/Failed to load resource/.test(msg.text())) {
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

        if (path === '/' && width === 375) await page.screenshot({ path: `qa-screenshots/home-375.png`, fullPage: true });
        if (path === '/' && width === 1440) await page.screenshot({ path: `qa-screenshots/home-1440.png`, fullPage: true });
        if (path === '/assessment/' && width === 375)
          await page.screenshot({ path: `qa-screenshots/assessment-375.png`, fullPage: true });
        const photoPages = ['/battery-storage/', '/ev-charging/', '/commercial-solar/', '/about/', '/projects/'];
        if ((width === 375 || width === 1440) && photoPages.includes(path)) {
          const slug = path.replace(/\//g, '') || 'home';
          await page.screenshot({ path: `qa-screenshots/${slug}-${width}.png`, fullPage: true });
        }
        await page.close();
      });
    }
  }

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

  await run('project enquiry prototype submit', async () => {
    const page = await context.newPage();
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto(BASE + '/commercial-project-enquiry/', { waitUntil: 'load', timeout: 15000 });
    await page.fill('#companyName', 'Test Co');
    await page.fill('#contactName', 'Test Person');
    await page.fill('#email', 'test@example.com');
    await page.fill('#phone', '0400000000');
    await page.fill('#siteAddress', '1 Test St, Sydney NSW');
    await page.click('button[type="submit"]');
    const successVisible = await page.evaluate(() => !!document.querySelector('.assess-success'));
    if (!successVisible) errors.push('Project enquiry prototype submit did not show success message');
    await page.close();
  });

  await browser.close();

  if (errors.length) {
    console.log('QA ISSUES FOUND:');
    errors.forEach((e) => console.log(' -', e));
    process.exitCode = 1;
  } else {
    console.log('QA PASSED: no console errors, no horizontal overflow, all interactions work as expected.');
  }
})();
