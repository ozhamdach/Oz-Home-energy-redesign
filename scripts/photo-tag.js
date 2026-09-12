#!/usr/bin/env node
/**
 * Dev-only helper: prints a <picture> block for a processed photo slug,
 * reading widths/dimensions from site/img/photos/manifest.json so the
 * srcset is always correct. Not used by the build — just saves hand-typing
 * width lists while wiring photos into content.html files.
 *
 * Usage: node scripts/photo-tag.js <slug> "<alt text>" ["<sizes>"] ["fetchpriority=high"]
 */
const fs = require('fs');
const path = require('path');

const [, , slug, alt, sizes = '(min-width: 780px) 50vw, 100vw', priority] = process.argv;
if (!slug || !alt) {
  console.error('Usage: node scripts/photo-tag.js <slug> "<alt text>" ["<sizes>"] [priority]');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'site', 'img', 'photos', 'manifest.json'), 'utf8'));
const entry = manifest[slug];
if (!entry) {
  console.error(`No manifest entry for slug "${slug}". Known slugs:\n` + Object.keys(manifest).join('\n'));
  process.exit(1);
}

const base = `/img/photos/${slug}`;
const srcset = (ext) => entry.widths.map((w) => `${base}-${w}.${ext} ${w}w`).join(', ');
const fallbackWidth = entry.widths[entry.widths.length - 1];
const loading = priority === 'priority' ? '' : ' loading="lazy"';
const fetchpriority = priority === 'priority' ? ' fetchpriority="high"' : '';

console.log(`<picture>
  <source type="image/avif" srcset="${srcset('avif')}" sizes="${sizes}">
  <source type="image/webp" srcset="${srcset('webp')}" sizes="${sizes}">
  <img src="${base}-${fallbackWidth}.jpg" width="${entry.width}" height="${entry.height}"${loading}${fetchpriority} alt="${alt}">
</picture>`);
