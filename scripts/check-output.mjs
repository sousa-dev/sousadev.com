/**
 * Post-build checks against dist/, the bytes that would actually be published.
 *   - every expected route exists in both languages;
 *   - all four legacy legal URLs and the CNAME survive;
 *   - one h1 per page, a single main landmark, a skip link;
 *   - canonical, hreflang (en, pt, x-default) and Organization JSON-LD present;
 *   - every marketing page ends with the proposal CTA block;
 *   - the contact pages carry a real form and no duplicate CTA form;
 *   - no handoff bundle, design preview runtime, Google Fonts request or legacy
 *     template script leaked into the output;
 *   - every og:image a page advertises exists in the output, and no article
 *     silently falls back to the blog index card (run `npm run og`);
 *   - homepage JS and CSS byte budgets, reported raw and gzipped.
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import path from 'node:path';
import { readArticles } from './article-frontmatter.mjs';

const root = process.cwd();
const dist = path.join(root, 'dist');
const problems = [];
const notes = [];

const ROUTES = ['', 'services', 'process', 'products', 'about', 'blog', 'contact', 'privacy', '404'];
const pages = [];
for (const route of ROUTES) {
  for (const prefix of ['', 'pt']) {
    const segments = [prefix, route].filter(Boolean);
    // Astro emits the root 404 as dist/404.html, not as a directory.
    const file =
      route === '404' && prefix === ''
        ? path.join(dist, '404.html')
        : path.join(dist, ...segments, 'index.html');
    pages.push({
      url: `/${segments.join('/')}` || '/',
      file,
      locale: prefix === 'pt' ? 'pt' : 'en',
      route: route || 'home',
    });
  }
}

const LEGACY = [
  'privacy-policy.html',
  'terms-and-conditions.html',
  'cloud-identifier-privacy-policy.html',
  'cloud-identifier-tos.html',
  'CNAME',
  'robots.txt',
  'sitemap.xml',
  'favicon.ico',
  'site.webmanifest',
  'site.pt.webmanifest',
];

const FORBIDDEN = [
  { id: 'google-fonts', test: /fonts\.(googleapis|gstatic)\.com/ },
  { id: 'design-runtime', test: /support\.js|__bundler|x-dc\b|DCLogic/ },
  { id: 'legacy-template', test: /owl\.carousel|jquery|bootstrap\.min|formsubmit\.co/i },
  { id: 'analytics', test: /googletagmanager|google-analytics|gtag\(/ },
  { id: 'handoff-path', test: /\/lda\//, allow: [] },
];

for (const page of pages) {
  let html;
  try {
    html = await readFile(page.file, 'utf8');
  } catch {
    problems.push(`missing page: ${page.url}`);
    continue;
  }

  const h1 = html.match(/<h1\b/g) ?? [];
  if (h1.length !== 1) problems.push(`${page.url} has ${h1.length} h1 elements`);
  if ((html.match(/<main\b/g) ?? []).length !== 1) problems.push(`${page.url} does not have exactly one <main>`);
  if (!html.includes('class="skip-link"')) problems.push(`${page.url} has no skip link`);
  if (!/<link rel="canonical"/.test(html)) problems.push(`${page.url} has no canonical link`);
  if (page.route !== 'home' || true) {
    for (const lang of ['hreflang="en"', 'hreflang="pt"', 'hreflang="x-default"']) {
      if (page.route === '404') continue;
      if (!html.includes(lang)) problems.push(`${page.url} is missing ${lang}`);
    }
  }
  if (!html.includes('"@type":"Organization"')) problems.push(`${page.url} has no Organization JSON-LD`);
  const expectedLang = page.locale === 'pt' ? 'pt-PT' : 'en';
  if (!html.includes(`<html lang="${expectedLang}"`)) problems.push(`${page.url} has the wrong html lang`);
  const expectedManifest = page.locale === 'pt' ? '/site.pt.webmanifest' : '/site.webmanifest';
  if (!html.includes(`<link rel="manifest" href="${expectedManifest}"`)) {
    problems.push(`${page.url} has the wrong web manifest`);
  }

  const forms = html.match(/<form\b/g) ?? [];
  if (page.route === 'contact') {
    if (forms.length !== 1) problems.push(`${page.url} must show exactly one proposal form, found ${forms.length}`);
    if (!/class="[^"]*\bcta__form--always\b/.test(html)) {
      problems.push(`${page.url} does not force the form at every width`);
    }
    // Match the element, not the class name inside the inlined stylesheet.
    if (/class="[^"]*\bcta__link\b/.test(html)) {
      problems.push(`${page.url} still renders the mobile link variant and could link to itself`);
    }
  } else if (page.route !== '404') {
    if (forms.length !== 1) problems.push(`${page.url} should end with one CTA proposal form, found ${forms.length}`);
    if (!html.includes('id="proposal"')) problems.push(`${page.url} does not end with the CTA block`);
  }

  for (const rule of FORBIDDEN) {
    if (rule.test.test(html)) problems.push(`${page.url} contains forbidden content [${rule.id}]`);
  }
}

for (const file of LEGACY) {
  try {
    await stat(path.join(dist, file));
  } catch {
    problems.push(`missing preserved file in dist: ${file}`);
  }
}

// The Cloud Identifier documents must stay their own documents.
const ciTos = await readFile(path.join(dist, 'cloud-identifier-tos.html'), 'utf8').catch(() => '');
if (ciTos && !/cloud-identifier-privacy-policy\.html/.test(ciTos)) {
  problems.push('cloud-identifier-tos.html no longer links its own privacy document');
}

// Nothing from the handoff or the preview runtime should be in the output.
async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}
for await (const file of walk(dist)) {
  const relative = path.relative(dist, file);
  if (/(^|\/)(_src|lda)\//.test(relative) || /support\.js$|ios-frame\.jsx$|\.dc\.html$/.test(relative)) {
    problems.push(`handoff or preview artefact in dist: ${relative}`);
  }
}

/*
 * Social images. Every og:image must be a file that actually exists in the
 * output, or a link preview shows nothing at all. Articles are checked more
 * strictly: src/lib/og.ts falls back to the blog index card when an article's
 * own card has not been generated, and that fallback is the signal that
 * `npm run og` still has to run, so it fails here rather than shipping every
 * article with the same picture.
 */
const articlePages = [];
for await (const file of walk(dist)) {
  if (!file.endsWith('.html')) continue;
  const url = `/${path.relative(dist, file).replace(/index\.html$/, '').replace(/\/$/, '')}`;
  if (/^\/(pt\/)?blog\/.+/.test(url)) articlePages.push({ url, file });
}

for (const page of [...pages, ...articlePages]) {
  let html;
  try {
    html = await readFile(page.file, 'utf8');
  } catch {
    continue;
  }
  const image = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
  if (!image) {
    problems.push(`${page.url} has no og:image`);
    continue;
  }
  try {
    await stat(path.join(dist, image.replace(/^https?:\/\/[^/]+\//, '')));
  } catch {
    problems.push(`${page.url} advertises a social image that is not in the output: ${image}`);
  }
}

/*
 * Articles are checked against their own frontmatter rather than against the
 * rendered tag: an article that supplies no `ogImage` must have the card that
 * `npm run og` generates from its title, or src/lib/og.ts quietly falls back to
 * the blog index card and every article ships with the same picture.
 */
const articles = await readArticles(root);
for (const article of articles) {
  if (article.ogImage) continue;
  const card = path.join('og', `${article.locale}-article-${article.slug}.png`);
  try {
    await stat(path.join(dist, card));
  } catch {
    problems.push(
      `article ${article.locale}/${article.slug} has no social image of its own; run \`npm run og\` to generate /${card}`,
    );
  }
}
notes.push(
  `social images: ${pages.length + articlePages.length} pages checked, ${articles.length} article(s), ` +
    `${articles.filter((entry) => entry.ogImage).length} with a supplied image`,
);

// Byte budgets for the homepage, reported raw, gzipped and brotli.
const home = await readFile(path.join(dist, 'index.html'), 'utf8');
const assets = [...home.matchAll(/(?:src|href)="(\/_astro\/[^"]+)"/g)].map((match) => match[1]);
const totals = { js: { raw: 0, gzip: 0, brotli: 0 }, css: { raw: 0, gzip: 0, brotli: 0 } };
for (const asset of new Set(assets)) {
  const buffer = await readFile(path.join(dist, asset.replace(/^\//, '')));
  const kind = asset.endsWith('.css') ? 'css' : asset.endsWith('.js') ? 'js' : null;
  if (!kind) continue;
  totals[kind].raw += buffer.length;
  totals[kind].gzip += gzipSync(buffer).length;
  totals[kind].brotli += brotliCompressSync(buffer).length;
}
const inlineScripts = [...home.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]
  .filter((match) => !/application\/ld\+json/.test(match[0]))
  .reduce((sum, match) => sum + Buffer.byteLength(match[1]), 0);
totals.js.raw += inlineScripts;

// Stylesheets are inlined into the HTML, so measure them there too.
const inlineStyles = [...home.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
  .map((match) => match[1])
  .join('');
totals.css.raw += Buffer.byteLength(inlineStyles);
totals.css.gzip += gzipSync(Buffer.from(inlineStyles)).length;
totals.css.brotli += brotliCompressSync(Buffer.from(inlineStyles)).length;

const kb = (value) => `${(value / 1024).toFixed(1)} KB`;
notes.push(
  `homepage JS: ${kb(totals.js.raw)} raw, ${kb(totals.js.gzip)} gzip, ${kb(totals.js.brotli)} brotli (budget 15 KB)`,
);
notes.push(
  `homepage CSS: ${kb(totals.css.raw)} raw, ${kb(totals.css.gzip)} gzip, ${kb(totals.css.brotli)} brotli (budget 30 KB)`,
);
if (totals.js.raw > 15 * 1024) problems.push(`homepage JS is over budget at ${kb(totals.js.raw)} raw`);
if (totals.css.gzip > 30 * 1024) problems.push(`homepage CSS is over budget at ${kb(totals.css.gzip)} gzip`);
if (totals.css.raw > 30 * 1024) {
  notes.push(`note: homepage CSS is ${kb(totals.css.raw)} uncompressed, above the 30 KB figure if read as raw bytes`);
}

const sitemap = await readFile(path.join(dist, 'sitemap.xml'), 'utf8');
for (const page of pages) {
  if (page.route === '404') continue;
  const expected = `https://sousadev.com${page.url}`;
  if (!sitemap.includes(`<loc>${expected}</loc>`)) problems.push(`sitemap is missing ${expected}`);
}
if (/404/.test(sitemap)) problems.push('sitemap should not list the 404 pages');

for (const note of notes) console.log(note);
if (problems.length > 0) {
  console.error('Output check failed:');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(`Output check passed: ${pages.length} pages, ${LEGACY.length} preserved files`);
