#!/usr/bin/env node
/**
 * Programmatic location pages generator.
 * Reads src/data/locations.json and writes src/pages/locations/<slug>/
 * content.html + meta.json for each district.
 *
 * Run before the main build: node scripts/generate-location-pages.js
 * The generated files are committed — they're source, not build output.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'src', 'data', 'locations.json');
const PAGES_DIR = path.join(ROOT, 'src', 'pages', 'locations');

const locations = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

for (const loc of locations) {
  const dir = path.join(PAGES_DIR, loc.slug);
  fs.mkdirSync(dir, { recursive: true });

  const suburbList = loc.suburbs.join(', ');
  const suburbListLong = loc.suburbs.slice(0, -1).join(', ') + ' and ' + loc.suburbs[loc.suburbs.length - 1];
  const isEndeavour = loc.gridOperator === 'Endeavour Energy';

  const gridSection = isEndeavour
    ? `<section class="section section-alt">
  <div class="container grid grid-2" style="align-items:start;">
    <div>
      <p class="eyebrow">Grid connection</p>
      <h2>Endeavour Energy network</h2>
      <p>${loc.name} properties connect to the grid via Endeavour Energy — a different distributor to Ausgrid, which covers most of inner Sydney. The solar connection application process, metering and export limit rules differ between the two networks. We handle the Endeavour Energy application as part of every installation we carry out in this area, so you don't need to navigate it yourself.</p>
    </div>
    <div>
      <p class="eyebrow">Typical system sizes</p>
      <h2>What suits this area</h2>
      <p>${loc.systemContext}</p>
      <p>${loc.housingNote}</p>
    </div>
  </div>
</section>`
    : `<section class="section section-alt">
  <div class="container grid grid-2" style="align-items:start;">
    <div>
      <p class="eyebrow">Grid connection</p>
      <h2>Ausgrid network</h2>
      <p>${loc.name} is served by Ausgrid, Sydney's main electricity distributor. Solar export approvals, metering and supply tariffs all run through Ausgrid here. We handle the Ausgrid connection application as part of every installation we carry out in this area.</p>
    </div>
    <div>
      <p class="eyebrow">Typical system sizes</p>
      <h2>What suits this area</h2>
      <p>${loc.systemContext}</p>
      <p>${loc.housingNote}</p>
    </div>
  </div>
</section>`;

  const content = `<section class="page-banner">
  <div class="container">
    <p class="breadcrumbs"><a href="/">Home</a><span class="sep">/</span><a href="/locations/">Locations</a><span class="sep">/</span>${loc.name}</p>
    <p class="eyebrow">Service Area</p>
    <h1>Solar, Battery &amp; EV Charger Installation — ${loc.name}</h1>
    <p class="lede">Oz Home Energy installs solar panels, battery storage and EV chargers across ${loc.name}, including ${suburbListLong}. Licensed NSW electrical contractor, ${loc.gridOperator}-connected installs.</p>
    <div class="hero-ctas">
      <a class="btn btn-primary" href="/assessment/">Get a Free Quote</a>
      <a class="btn btn-secondary" href="tel:+61435336336">Call 0435 336 336</a>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head">
      <p class="eyebrow">What we install</p>
      <h2>Services in ${loc.name}</h2>
    </div>
    <div class="grid grid-3">
      <div class="card">
        <h3><a href="/residential-solar/">Solar panels</a></h3>
        <p>System sizing, STC rebate and payback calculation. We design around your roof, usage profile and export appetite.</p>
      </div>
      <div class="card">
        <h3><a href="/battery-storage/">Battery storage</a></h3>
        <p>Pairing a battery with solar captures excess generation for evening use. Federal rebate available on eligible systems.</p>
      </div>
      <div class="card">
        <h3><a href="/ev-charging/">EV charger installation</a></h3>
        <p>${loc.evNote}</p>
      </div>
    </div>
  </div>
</section>

${gridSection}

<section class="section">
  <div class="container container-narrow">
    <p class="eyebrow">Suburbs we serve</p>
    <h2>Coverage across ${loc.name}</h2>
    <p>We carry out installations across ${loc.name}, including ${suburbListLong}. If your suburb isn't listed here, start an assessment — we'll confirm coverage for your specific address during the process.</p>
    <div class="tag-list">
      ${loc.suburbs.map((s) => `<span class="tag">${s}</span>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="section final-cta">
  <div class="container container-narrow">
    <h2>Get a quote for your ${loc.name} property</h2>
    <div class="cta-row">
      <a class="btn btn-primary" href="/assessment/">Get a Free Quote</a>
      <a class="btn btn-secondary" href="tel:+61435336336">Call 0435 336 336</a>
    </div>
  </div>
</section>
`;

  const meta = {
    title: loc.metaTitle,
    description: loc.metaDesc,
    canonical: `/locations/${loc.slug}/`,
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Locations', url: '/locations/' },
      { name: loc.name, url: `/locations/${loc.slug}/` },
    ],
  };

  fs.writeFileSync(path.join(dir, 'content.html'), content, 'utf8');
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2) + '\n', 'utf8');
  console.log(`Generated: /locations/${loc.slug}/`);
}

console.log(`\nDone — ${locations.length} location pages generated.`);
console.log('Run node scripts/build.js to build the site.');
