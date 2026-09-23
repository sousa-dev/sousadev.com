/**
 * Generates the 1200x630 social images:
 *   - the two home images are a real screenshot of the site's own hero, one per
 *     language, captured from dist/ and cropped to the social ratio;
 *   - every other route gets a typeset card built from the brand assets and the
 *     page heading already in the dictionaries;
 *   - every blog article gets its own card from its title, unless its
 *     frontmatter supplies an `ogImage` of its own.
 *
 * Nothing here invents copy: each image shows the page's own heading plus the
 * wordmark. Run it after a build, because the hero screenshots are taken from
 * the built site: `npm run build && npm run og`.
 *
 * The texture is used here deliberately: the brand guide asks for a textured
 * social image, while the website itself restricts the 45 degree texture to the
 * hero and the CTA block (audit D15).
 *
 * Output lands in public/og/ and is committed, so a deploy does not need a
 * browser. Run: npm run og
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { launch, serveDist } from './browser-lib.mjs';
import { readArticles } from './article-frontmatter.mjs';

const sharp = createRequire(import.meta.url)('sharp');

const root = process.cwd();
const outDir = path.join(root, 'public', 'og');
await mkdir(outDir, { recursive: true });

const dictionaries = {
  en: JSON.parse(await readFile(path.join(root, 'src/i18n/en.json'), 'utf8')),
  pt: JSON.parse(await readFile(path.join(root, 'src/i18n/pt.json'), 'utf8')),
};

const lockup = (await readFile(path.join(root, 'public/logo/horizontal-two-tone-on-dark.svg'), 'utf8'))
  .replace(/<metadata>[\s\S]*?<\/metadata>/, '');

const fontFile = async (name) =>
  (await readFile(path.join(root, 'public', 'fonts', name))).toString('base64');

const displayFont = await fontFile('space-grotesk-latin-500-normal.woff2');
const monoFont = await fontFile('ibm-plex-mono-latin-400-normal.woff2');

// The home card is a hero screenshot, handled separately below.
const ROUTES = [
  { key: 'services', heading: (t) => t.services.pageHeading, eyebrow: (t) => t.services.eyebrow },
  { key: 'process', heading: (t) => t.process.title, eyebrow: (t) => t.process.eyebrow },
  { key: 'products', heading: (t) => t.products.title, eyebrow: (t) => t.products.eyebrow },
  { key: 'about', heading: (t) => t.about.title, eyebrow: (t) => t.about.eyebrow },
  { key: 'blog', heading: (t) => t.blog.title, eyebrow: (t) => t.blog.eyebrow },
  { key: 'contact', heading: (t) => t.contact.title, eyebrow: (t) => t.contact.pageTitle },
  { key: 'privacy', heading: (t) => t.privacy.title, eyebrow: (t) => t.privacy.title },
];

const escapeHtml = (value) =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

function template({ heading, eyebrow, covers }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face { font-family: 'Space Grotesk'; src: url(data:font/woff2;base64,${displayFont}) format('woff2'); font-weight: 500; }
    @font-face { font-family: 'IBM Plex Mono'; src: url(data:font/woff2;base64,${monoFont}) format('woff2'); font-weight: 400; }
    * { margin: 0; box-sizing: border-box; }
    body { width: 1200px; height: 630px; background: #0A1014; color: #F6F8F7; position: relative; overflow: hidden; }
    .texture { position: absolute; inset: 0; background: repeating-linear-gradient(45deg,#0FA347 0 2px,transparent 2px 14px); opacity: .05; }
    .frame { position: relative; height: 100%; padding: 72px; display: flex; flex-direction: column; justify-content: space-between; }
    .eyebrow { font-family: 'IBM Plex Mono', monospace; font-size: 20px; letter-spacing: .16em; text-transform: uppercase; color: #37D97A; }
    h1 { font-family: 'Space Grotesk', sans-serif; font-weight: 500; font-size: 68px; line-height: 1.05; letter-spacing: -.03em; max-width: 960px; }
    .foot { display: flex; align-items: center; justify-content: space-between; gap: 32px; border-top: 1px solid #1A2227; padding-top: 28px; }
    .foot svg { height: 40px; width: auto; }
    .covers { font-family: 'IBM Plex Mono', monospace; font-size: 18px; letter-spacing: .14em; color: #8FA3A8; }
  </style></head><body>
    <div class="texture"></div>
    <div class="frame">
      <p class="eyebrow">${escapeHtml(eyebrow)}</p>
      <h1>${escapeHtml(heading)}</h1>
      <div class="foot">${lockup}<p class="covers">${escapeHtml(covers)}</p></div>
    </div>
  </body></html>`;
}

const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
let written = 0;

const writeCard = async (file, { heading, eyebrow, covers }) => {
  await page.setContent(template({ heading, eyebrow, covers }), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await writeFile(path.join(outDir, file), await page.screenshot({ type: 'png' }));
  written += 1;
};

for (const [locale, dictionary] of Object.entries(dictionaries)) {
  const covers = dictionary.hero.covers.join(' \u00b7 ');
  for (const route of ROUTES) {
    await writeCard(`${locale}-${route.key}.png`, {
      heading: route.heading(dictionary),
      eyebrow: route.eyebrow(dictionary),
      covers,
    });
  }
}

// One card per article that does not bring its own image. Agents adding posts
// do not have to think about this: scripts/check-output.mjs fails the build if
// an article's social image is missing, and README.md says to run `npm run og`.
for (const article of (await readArticles(root)).filter((entry) => !entry.ogImage)) {
  const dictionary = dictionaries[article.locale];
  await writeCard(`${article.locale}-article-${article.slug}.png`, {
    heading: article.title,
    eyebrow: dictionary.blog.eyebrow,
    covers: dictionary.hero.covers.join(' \u00b7 '),
  });
}

/*
 * The two home images are the real hero, screenshotted from the built site, so
 * what a link preview shows is what the page actually looks like. A wide
 * viewport at a 0.8 scale renders the desktop hero at 1200px across; the
 * capture is then cropped to the 1200x630 social ratio about its centre.
 */
const dist = path.join(root, 'dist', 'index.html');
let served;
try {
  await readFile(dist);
  served = await serveDist(4393);
} catch {
  console.warn('warning: dist/ not found, so the home hero images were left unchanged. Run `npm run build && npm run og`.');
}

if (served) {
  for (const [locale, url] of [['en', '/'], ['pt', '/pt']]) {
    const hero = await browser.newPage({
      viewport: { width: 1500, height: 1000 },
      deviceScaleFactor: 0.8,
      // The ProjectFlow panel renders with every step complete under reduced
      // motion, which is the state to capture: no half-finished sequence.
      reducedMotion: 'reduce',
    });
    await hero.goto(`${served.origin}${url}`);
    await hero.evaluate(() => document.fonts.ready);
    const shot = await hero.locator('.hero').screenshot({ type: 'png' });
    const { width, height } = await sharp(shot).metadata();
    await sharp(shot)
      .extract({
        left: Math.max(0, Math.round((width - 1200) / 2)),
        top: Math.max(0, Math.round((height - 630) / 2)),
        width: Math.min(1200, width),
        height: Math.min(630, height),
      })
      .png()
      .toFile(path.join(outDir, `${locale}-home.png`));
    written += 1;
    await hero.close();
  }
  await served.close();
}

await browser.close();
console.log(`Wrote ${written} social images to public/og/`);
