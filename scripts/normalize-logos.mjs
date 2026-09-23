/**
 * Normalises the company logos for a dark surface.
 *
 * Source: assets/companies/, the original artwork exactly as supplied.
 * Output: src/assets/companies/, one PNG per logo, which Astro then converts
 * to WebP at the size the row renders.
 *
 * The supplied artwork is a mix of transparent and white-backed files in
 * several inks. On the Ink surface the white-backed ones read as white boxes
 * and the dark-ink ones nearly disappear, so each logo is reduced to a single
 * Paper-coloured silhouette: the shape is unchanged, the background goes, and
 * the whole row reads as one set. This is a presentation treatment of real
 * logos, not new artwork.
 *
 * Output names are slugified, so `My Logo.JPG` becomes `my-logo.png`. A
 * numeric prefix is kept and is what orders the strip: `1-acme.png` comes
 * before `2-globex.png`. Outputs with no matching source are deleted, so
 * removing or renaming a logo removes it from the site.
 *
 * This runs as part of `npm run build`. Run it on its own with `npm run logos`
 * to refresh the generated files without a full build.
 */
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const sharp = createRequire(import.meta.url)('sharp');

const root = process.cwd();
const sourceDir = path.join(root, 'assets', 'companies');
const outDir = path.join(root, 'src', 'assets', 'companies');

/** Paper, the brand's light ink for dark surfaces. */
const PAPER = { r: 246, g: 248, b: 247 };

/** The row renders each logo inside a box about 150x64 CSS pixels. */
const MAX_WIDTH = 400;
const MAX_HEIGHT = 160;

/**
 * Anything at least this light counts as background and becomes fully
 * transparent; anything at least this dark becomes fully opaque. Values
 * between the two keep a proportional alpha, which is what preserves the
 * antialiasing on curved letterforms.
 */
const BACKGROUND = 0.92;
const INK = 0.45;

await mkdir(outDir, { recursive: true });

/** `Aveiro Tech_City.PNG` -> `aveiro-tech-city.png`, prefix digits intact. */
const outputName = (file) =>
  `${file
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')}.png`;

let sources = [];
try {
  sources = (await readdir(sourceDir)).filter((file) => /\.(png|jpe?g|webp|avif|gif)$/i.test(file));
} catch {
  console.warn(`warning: ${path.relative(root, sourceDir)} does not exist, so no logos were generated.`);
}

const expected = new Set(sources.map(outputName));
const skipped = [];
let written = 0;

// Delete anything left from a logo that has been renamed or removed, so the
// strip cannot keep showing a company that is no longer in the source folder.
let removed = 0;
for (const file of await readdir(outDir).catch(() => [])) {
  if (!expected.has(file)) {
    await rm(path.join(outDir, file));
    removed += 1;
  }
}

for (const file of sources) {
  const source = path.join(sourceDir, file);

  // Flatten onto white first, so a transparent background and a painted white
  // background are treated the same way from here on.
  const { data, info } = await sharp(source)
    .flatten({ background: '#ffffff' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  /*
   * Artwork that is light ink on a dark plate has to be inverted first, or the
   * plate would become the silhouette and the artwork a hole in it. The four
   * corners say which case this is: they are background in either design.
   */
  const corner = (x, y) => data[y * info.width + x] / 255;
  const corners = [
    corner(0, 0),
    corner(info.width - 1, 0),
    corner(0, info.height - 1),
    corner(info.width - 1, info.height - 1),
  ];
  const darkPlate = corners.reduce((sum, value) => sum + value, 0) / corners.length < 0.5;

  const alpha = Buffer.alloc(info.width * info.height);
  for (let i = 0; i < alpha.length; i += 1) {
    const luminance = darkPlate ? 1 - data[i] / 255 : data[i] / 255;
    const ratio = (BACKGROUND - luminance) / (BACKGROUND - INK);
    alpha[i] = Math.round(Math.min(1, Math.max(0, ratio)) * 255);
  }

  const silhouette = await sharp({
    create: {
      width: info.width,
      height: info.height,
      channels: 3,
      background: PAPER,
    },
  })
    .joinChannel(alpha, { raw: { width: info.width, height: info.height, channels: 1 } })
    .png()
    .toBuffer();

  // Trim the transparent margin so every logo fills its slot to the same
  // degree, then bound the size. Trimming can fail on an all-transparent
  // image, which means the thresholds found no ink at all.
  let trimmed;
  try {
    trimmed = await sharp(silhouette).trim({ threshold: 1 }).toBuffer();
  } catch {
    skipped.push(`${file}: no ink found above the background threshold`);
    continue;
  }

  const output = await sharp(trimmed)
    .resize({ width: MAX_WIDTH, height: MAX_HEIGHT, fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();

  await writeFile(path.join(outDir, outputName(file)), output);
  written += 1;
}

for (const note of skipped) console.warn(`warning: ${note}`);
console.log(
  `Normalised ${written} company logo(s) into src/assets/companies/` +
    (removed > 0 ? `, removed ${removed} with no source` : ''),
);
