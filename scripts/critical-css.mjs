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
  /^admin(\/|\.html$)/, /^shop-partner(\/|\.html$)/, /^franchise(\/|\.html$)/,
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

// Next puts every page bundle in <head> as <script defer>, so the browser starts
// ~16 JS downloads at the same moment as the hero image and they all share a
// slow mobile connection — the hero (the LCP element) then finishes late, and
// PageSpeed's score swings run to run. Instead the same scripts are started, in
// the same order (async=false keeps defer-like ordering), after the hero paints.
// Total bytes are unchanged; the hero just gets the bandwidth first.
const SCRIPT_RE = /<script src="(\/_next\/static\/[^"]+\.js)" defer(?:="")?><\/script>/g;
function deferScriptsUntilHero(html) {
  const head = html.slice(0, html.indexOf('</head>'));
  const srcs = [...head.matchAll(SCRIPT_RE)].map((m) => m[1]);
  if (!srcs.length) return html;
  // Scripts start only after (1) the document is parsed — Next reads
  // __NEXT_DATA__ from the end of <body>, exactly as with `defer` — and (2) the
  // hero is on screen: whichever comes first of the browser's
  // largest-contentful-paint entry for the fetchpriority=high image, or that
  // image loaded + decoded + two frames (+300ms where the LCP API exists, so it
  // stays a fallback). Pages without a hero image just wait
  // for a frame. A 3s cap means a slow or broken image never holds the app back.
  // No layout reads here (a visibility check would force a costly layout mid-parse).
  const loader =
    '<script>(function(){var s=' + JSON.stringify(srcs) + ',d=document,w=window,x=0,p=0,h=0;' +
    'function start(){if(x||!p||!h)return;x=1;for(var i=0;i<s.length;i++){var e=d.createElement("script");e.src=s[i];e.async=false;d.head.appendChild(e)}}' +
    'function ready(){if(h)return;h=1;setTimeout(start,0)}' +
    'var L=0;function frames(){if(!w.requestAnimationFrame)return ready();requestAnimationFrame(function(){requestAnimationFrame(function(){setTimeout(ready,L?300:0)})})}' +
    'try{if(PerformanceObserver.supportedEntryTypes.indexOf("largest-contentful-paint")>-1){L=1;new PerformanceObserver(function(l){l.getEntries().forEach(function(e){var t=e.element;if(t&&t.tagName==="IMG"&&t.getAttribute("fetchpriority")==="high")ready()})}).observe({type:"largest-contentful-paint",buffered:true})}}catch(e){}' +
    'function parsed(){p=1;var a=d.querySelectorAll("img[fetchpriority=high]"),n=a.length;' +
    'function one(){if(--n<=0)frames()}function dec(g){g.decode?g.decode().then(one,one):one()}' +
    'if(!n)frames();for(var i=0;i<a.length;i++)(function(g){if(g.complete)dec(g);else{g.addEventListener("load",function(){dec(g)});g.addEventListener("error",one)}})(a[i]);' +
    'setTimeout(function(){h=1;start()},3000);start()}' +
    'if(d.readyState!=="loading")parsed();else d.addEventListener("DOMContentLoaded",parsed)})()</script>';
  let first = true;
  const out = html.replace(SCRIPT_RE, (tag, src, offset) => {
    if (offset > head.length || !srcs.includes(src)) return tag;
    if (first) { first = false; return loader; }
    return '';
  });
  // sanity: every bundle must still be referenced exactly once, via the loader
  if (srcs.some((src) => out.split(src).length !== 2)) throw new Error('script rewrite mismatch');
  return out;
}

// next/font preloads only the basic Latin files. Characters outside that range
// (₹, ★, some punctuation) live in the latin-ext files, which the browser only
// discovers after layout — a late font request chain (PageSpeed "network
// dependency tree"). For each page, find those characters, resolve the font
// weight they render in (nearest Tailwind font-* class, h1/h2 / b / strong /
// display classes → 700, else 400) and preload exactly those files, at low
// priority so they never compete with the hero image.
const { parseDocument } = require('htmlparser2');
const WEIGHT_CLASS = { 'font-thin': 100, 'font-extralight': 200, 'font-light': 300, 'font-normal': 400, 'font-medium': 500, 'font-semibold': 600, 'font-bold': 700, 'font-extrabold': 800, 'font-black': 900 };
const BOLD_CLASS = new Set(['text-display-xl', 'text-display-lg', 'text-eyebrow']);
// [Next page, code point, weight] — product prices (₹) rendered from API data
const CLIENT_TEXT_FONTS = [['/', 0x20b9, 400], ['/shop', 0x20b9, 400], ['/shop', 0x20b9, 700]];
const parseRanges = (r) => r.split(',').map((s) => s.trim().replace(/^U\+/i, '').split('-').map((h) => parseInt(h, 16))).map(([a, b]) => [a, b ?? a]);
function fontFaces(html) {
  const css = [...html.matchAll(/<style data-font-css="[^"]*">([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('');
  return [...css.matchAll(/@font-face\{([^}]*)\}/g)].map((m) => {
    const d = m[1];
    return {
      family: (d.match(/font-family:([^;]*)/) || [])[1]?.replace(/['"]/g, '').trim(),
      weight: +((d.match(/font-weight:(\d+)/) || [])[1] || 400),
      url: (d.match(/url\(([^)]+)\)/) || [])[1]?.replace(/['"]/g, ''),
      ranges: parseRanges((d.match(/unicode-range:([^;]*)/) || [])[1] || 'U+0-10FFFF'),
    };
  }).filter((f) => f.url && !/fallback/i.test(f.family || ''));
}
function weightOf(node) {
  const found = new Set();
  for (let n = node.parent; n && n.type !== 'root'; n = n.parent) {
    if (n.type !== 'tag') continue;
    for (const c of (n.attribs?.class || '').split(/\s+/)) {
      const base = c.replace(/^([a-z0-9-]+:)+/, ''); // md:font-bold → font-bold (collect variants too)
      const arb = base.match(/^font-\[(\d{3})\]$/);
      const w = WEIGHT_CLASS[base] || (arb && +arb[1]);
      if (w) { found.add(w); if (base === c) return [...found]; }
      if (BOLD_CLASS.has(c)) { found.add(700); return [...found]; }
    }
    if (/^(h1|h2|b|strong)$/.test(n.name)) { found.add(700); return [...found]; }
  }
  found.add(400);
  return [...found];
}
function preloadExtraFontSubsets(html) {
  const faces = fontFaces(html);
  if (!faces.length) return html;
  const weights = [...new Set(faces.map((f) => f.weight))];
  const nearest = (w) => weights.reduce((a, b) => (Math.abs(b - w) < Math.abs(a - w) ? b : a));
  const preloaded = new Set([...html.matchAll(/<link rel="preload" href="([^"]+\.woff2)"/g)].map((m) => m[1]));
  const need = new Set();
  const body = html.slice(html.indexOf('<body'));
  const walkNodes = (n) => {
    if (n.type === 'tag' && /^(script|style|noscript|svg|template)$/.test(n.name)) return;
    if (n.type === 'text') {
      const chars = [...new Set([...n.data].map((ch) => ch.codePointAt(0)).filter((cp) => cp > 0x7e))];
      if (chars.length) {
        for (const w of weightOf(n).map(nearest)) {
          for (const cp of chars) {
            // the browser uses the LAST declared face (for this weight) whose range covers the char
            const face = faces.filter((f) => f.weight === w && f.ranges.some(([a, b]) => cp >= a && cp <= b)).pop();
            if (face && !preloaded.has(face.url)) need.add(face.url);
          }
        }
      }
    }
    for (const c of n.children || []) walkNodes(c);
  };
  walkNodes(parseDocument(body));
  // Text rendered only after data loads isn't in the HTML (see CLIENT_TEXT_FONTS).
  for (const [page, cp, w] of CLIENT_TEXT_FONTS) {
    if (html.includes(`"page":"${page}"`)) {
      const face = faces.filter((f) => f.weight === nearest(w) && f.ranges.some(([a, b]) => cp >= a && cp <= b)).pop();
      if (face && !preloaded.has(face.url)) need.add(face.url);
    }
  }
  if (!need.size) return html;
  const links = [...need].map((u) => `<link rel="preload" href="${u}" as="font" type="font/woff2" crossorigin="anonymous" fetchpriority="low"/>`).join('');
  return html.replace('</head>', links + '</head>');
}

let done = 0, skipped = 0, failed = 0;
const t0 = Date.now();
for (const abs of walk(PAGES)) {
  const rel = path.relative(PAGES, abs).split(path.sep).join('/');
  if (SKIP.some((re) => re.test(rel))) { skipped++; continue; }
  const html = fs.readFileSync(abs, 'utf8');
  if (html.includes('<!--critical-css-->')) { skipped++; continue; } // already processed
  try {
    // 1. inline the (small) font stylesheet in full. Next's <link rel=preload
    //    as=style> tags go too: the font one would be unused (browser warning)
    //    and the main one would fetch the whole stylesheet at top priority,
    //    competing with the hero — it still loads via its non-blocking link.
    let out = html.replace(/<link rel="preload" href="\/_next\/static\/[^"]+\.css" as="style"\/?>/g, '');
    out = out.replace(LINK_RE, (tag, href) => {
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
    // 3. preload the extra font subsets this page's text needs (e.g. ₹)
    out = preloadExtraFontSubsets(out);
    // 4. let the hero image load before the JS bundles start downloading
    if (process.env.NO_DEFER_JS !== '1') out = deferScriptsUntilHero(out);
    out = out.replace('<head>', '<head><!--critical-css-->');
    fs.writeFileSync(abs, out);
    done++;
  } catch (e) {
    failed++;
    console.warn(`critical-css: left ${rel} unchanged (${e.message})`);
  }
}
console.log(`critical-css: ${done} pages inlined, ${skipped} skipped, ${failed} unchanged — ${((Date.now() - t0) / 1000).toFixed(1)}s`);
