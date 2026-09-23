/**
 * Captures a real screenshot of each product's own landing page and writes an
 * optimised WebP to public/images/products/.
 *
 * These are screenshots of Sousa Dev's own live products, taken from the URLs
 * in src/content/products.json. Nothing is mocked up or composed: if a page
 * does not load, the product keeps no image rather than getting a fabricated
 * one, and the script reports the failure.
 *
 * Output is 880x416, cropped from the top of a 1375x1000 desktop capture.
 *
 * Two constraints set that size. The handoff asks for 880x640, but the only
 * place these appear is the card preview strip, and a 640px-tall source ships
 * roughly 2.7x the pixels the card can use, which slowed the largest
 * contentful paint on /products. At the same time the source has to stay
 * narrower in aspect (2.11) than the widest card preview box (about 2.65 at
 * 390px), because object-fit: cover trims whichever axis is proportionally
 * larger: any wider and it would crop the sides off each landing page instead
 * of trimming the bottom. Change TARGET and re-run if the card geometry
 * changes or a larger product preview is introduced.
 *
 * Run: npm run shots
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { launch } from './browser-lib.mjs';

const root = process.cwd();
const outDir = path.join(root, 'public', 'images', 'products');
const dataPath = path.join(root, 'src', 'content', 'products.json');

// The viewport matches the 880x640 target aspect ratio (1.375), so the capture
// is a straight downscale and nothing is cropped off the sides of a layout.
const VIEWPORT = { width: 1375, height: 1000 };
const TARGET = { width: 880, height: 416 };
const SETTLE_MS = 3500;

/** Stable file name per product, derived from its own domain. */
const fileFor = (product) => `${product.domain.replace(/\./g, '-')}.webp`;

const products = JSON.parse(await readFile(dataPath, 'utf8'));
await mkdir(outDir, { recursive: true });

const browser = await launch();
const context = await browser.newContext({
  viewport: VIEWPORT,
  deviceScaleFactor: 2,
  // Some landing pages gate on a real UA string.
  userAgent:
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
});

const results = [];

for (const product of products) {
  const page = await context.newPage();
  try {
    const response = await page.goto(product.url, { waitUntil: 'networkidle', timeout: 45000 });
    const status = response?.status() ?? 0;
    if (status >= 400) throw new Error(`HTTP ${status}`);

    // Let fonts, hero imagery and entry animations settle before capturing.
    await page.evaluate(() => document.fonts?.ready).catch(() => undefined);
    await page.waitForTimeout(SETTLE_MS);

    // Anything that would put a banner over the hero is worth dismissing, but
    // only by clicking an obvious accept control: nothing is injected or faked.
    for (const label of [/accept all/i, /accept cookies/i, /^accept$/i, /aceitar/i, /got it/i]) {
      const button = page.getByRole('button', { name: label }).first();
      if (await button.isVisible().catch(() => false)) {
        await button.click({ timeout: 2000 }).catch(() => undefined);
        await page.waitForTimeout(600);
        break;
      }
    }

    const shot = await page.screenshot({ type: 'png' });
    const file = fileFor(product);
    await sharp(shot)
      .resize({ ...TARGET, fit: 'cover', position: 'top' })
      .webp({ quality: 82 })
      .toFile(path.join(outDir, file));

    results.push({ product: product.name, file, ok: true });
  } catch (error) {
    results.push({ product: product.name, ok: false, reason: String(error.message ?? error) });
  } finally {
    await page.close();
  }
}

await context.close();
await browser.close();

for (const result of results) {
  console.log(
    result.ok
      ? `captured  ${result.product} -> public/images/products/${result.file}`
      : `FAILED    ${result.product}: ${result.reason}`,
  );
}

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} product screenshots captured`);
if (failed.length > 0) {
  console.error('Products without a screenshot keep image: null and render the brand plate.');
  process.exit(1);
}
