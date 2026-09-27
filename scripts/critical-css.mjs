// Post-build: inline the critical CSS into pre-rendered public pages.
//
// Why: the site-wide stylesheet (Tailwind build, ~230 KB / ~37 KB gzipped) was a
// render-blocking <link> — on a slow mobile connection nothing could paint
// until it downloaded (PageSpeed "render-blocking requests").
//
// What it does, for each pre-rendered public page in .next/server/pages:
//   1. The small next/font stylesheet (@font-face + metric-matched fallback) is
//      inlined in full, so text renders with the right metrics from the first
//      paint (no font-swap layout shift).
//   2. Critters inlines only the rules that match that page's HTML, and the full
//      stylesheet is still loaded — just without blocking the first paint
//      (media="print" → "all" on load, with a <noscript> fallback). The shared
//      CSS file itself is never modified.
//
// Skipped (keep the normal blocking <link>): admin / shop-partner / logged-in
// pages and dynamic-route shells, whose content is rendered on the client after
// hydration and would otherwise risk a flash of unstyled content.
//
// Runs after `next build` (see package.json). Any per-page failure leaves that
// page untouched, so the worst case is the previous behaviour.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Critters = require('critters');

const ROOT = process.cwd();
const DIST = path.join(ROOT, '.next');
const PAGES = path.join(DIST, 'server', 'pages');

const SKIP = [
  /^admin(\/|\.html$)/, /^shop-partner(\/|\.html$)/,
  /^(cart|checkout|orders|profile|addresses|wallet|notifications|reviews|emergency|spin|refer)(\/|\.html$)/,
  /^service\//, /^(404|500)\.html$/, /\[/,
];

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
  const p = path.join(dir, d.name);
  return d.isDirectory() ? walk(p) : d.name.endsWith('.html') ? [p] : [];
});

// CSS url(...) values are relative to /_next/static/chunks/ — rewrite to absolute.
const absolutize = (css, file) => css.replace(/url\((['"]?)([^'")]+)\1\)/g, (m, q, u) =>
  /^(data:|https?:|\/|#)/.test(u) ? m : `url(${q}${new URL(u, `http://x/_next/${file}`).pathname}${q})`);

const cssCache = new Map();
const readCss = (href) => {
  if (!cssCache.has(href)) {
    const file = href.replace(/^\/_next\//, '');
    cssCache.set(href, fs.readFileSync(path.join(DIST, file), 'utf8'));
  }
  return cssCache.get(href);
};

const critters = new Critters({
  path: DIST,
  publicPath: '/_next/',
  preload: 'media',
  noscriptFallback: true,
  inlineFonts: false, // @font-face comes from the fully-inlined font stylesheet
  preloadFonts: false, // next/font already preloads the font files
  pruneSource: false, // the stylesheet is shared by every page — never modify it
  reduceInlineStyles: false,
  mergeStylesheets: false,
  // Critters can't match Tailwind arbitrary-variant selectors such as
  // `.max-md\:\[\&\>\*\]\:w-\[100px\]>*` (child/nth-child variants), so it would
  // drop them — always keep those rules (a few KB).
  allowRules: [/\\\[\\&/, />\s*(\*|:nth-child|:not|:first|:last)/],
  logLevel: 'silent',
});

const LINK_RE = /<link rel="stylesheet" href="(\/_next\/static\/[^"]+\.css)"([^>]*)\/?>/g;

let done = 0, skipped = 0, failed = 0;
const t0 = Date.now();
for (const abs of walk(PAGES)) {
  const rel = path.relative(PAGES, abs).split(path.sep).join('/');
  if (SKIP.some((re) => re.test(rel))) { skipped++; continue; }
  const html = fs.readFileSync(abs, 'utf8');
  if (html.includes('<!--critical-css-->')) { skipped++; continue; } // already processed
  try {
    // 1. inline the (small) font stylesheet in full
    let out = html.replace(LINK_RE, (tag, href) => {
      const css = readCss(href);
      if (!/@font-face/.test(css) || css.length > 20000) return tag;
      return `<style data-font-css="${href}">${absolutize(css, href.replace(/^\/_next\//, '')).replace(/<\/style/gi, '\\3C/style')}</style>`;
    });
    // 2. critical CSS for everything else
    out = await critters.process(out);
    // sanity: must still reference the full stylesheet and carry inlined rules
    if (!/media="print"/.test(out) || !/<noscript><link rel="stylesheet"/.test(out) || !/<style>[^<]{500,}/.test(out)) {
      throw new Error('unexpected critters output');
    }
    out = out.replace('<head>', '<head><!--critical-css-->');
    fs.writeFileSync(abs, out);
    done++;
  } catch (e) {
    failed++;
    console.warn(`critical-css: left ${rel} unchanged (${e.message})`);
  }
}
console.log(`critical-css: ${done} pages inlined, ${skipped} skipped, ${failed} unchanged — ${((Date.now() - t0) / 1000).toFixed(1)}s`);
