/**
 * Copies the brand assets this site actually uses from the original handoff in
 * lda/brand-kit/ to their production locations under public/, and generates the
 * favicon.ico and the web manifest, which the handoff does not supply.
 *
 * The handoff stays untouched. public/ is the editing source from here on, so
 * this script is a one-time migration that is safe to re-run. Assets that are
 * not used by the site (email signature, PNG logo exports, Ink favicon set,
 * unused lockups) are deliberately not copied, to keep them out of the build.
 */
import { mkdir, copyFile, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const kit = path.join(root, 'lda', 'brand-kit');

const LOGOS = [
  // nav and footer lockup (inlined from this file by src/components/Logo.astro)
  ['logo/horizontal/horizontal-two-tone-on-dark.svg', 'logo/horizontal-two-tone-on-dark.svg'],
  // documents and anything on Paper
  ['logo/horizontal/horizontal-mono-ink.svg', 'logo/horizontal-mono-ink.svg'],
  // success state, social image, square contexts
  ['logo/mark/mark-two-tone-on-dark.svg', 'logo/mark-two-tone-on-dark.svg'],
  ['logo/mark/mark-mono-paper.svg', 'logo/mark-mono-paper.svg'],
  ['logo/mark/mark-mono-ink.svg', 'logo/mark-mono-ink.svg'],
  ['logo/stacked/stacked-two-tone-on-dark.svg', 'logo/stacked-two-tone-on-dark.svg'],
  ['logo/app-icon/app-icon-green.svg', 'logo/app-icon-green.svg'],
];

const FAVICONS = [16, 32, 48, 180, 192, 512];

await mkdir(path.join(root, 'public', 'logo'), { recursive: true });
await mkdir(path.join(root, 'public', 'favicon'), { recursive: true });
await mkdir(path.join(root, 'public', 'loader'), { recursive: true });

/**
 * Logos are copied with the C2PA provenance block removed. Each supplied SVG
 * carries about 13 KB of base64 metadata around roughly 300 bytes of geometry,
 * and these files are served to browsers on every page. The geometry, colours
 * and viewBox are copied unchanged, and the originals with full provenance stay
 * in lda/brand-kit/logo/.
 */
const stripSvgMetadata = (svg) => svg.replace(/<metadata>[\s\S]*?<\/metadata>/g, '');

for (const [from, to] of LOGOS) {
  const svg = await readFile(path.join(kit, from), 'utf8');
  await writeFile(path.join(root, 'public', to), stripSvgMetadata(svg));
}
/**
 * Favicons are copied with their non-essential PNG chunks removed. The supplied
 * 16px tile is 6.3 KB, of which 5.8 KB is a C2PA provenance chunk; the pixel
 * data (IHDR, sRGB, IDAT, IEND) is copied through byte for byte. The originals
 * with full provenance remain in lda/brand-kit/favicon/.
 */
const KEEP_CHUNKS = new Set(['IHDR', 'PLTE', 'tRNS', 'gAMA', 'sRGB', 'IDAT', 'IEND']);

function stripPngMetadata(buffer) {
  const signature = buffer.subarray(0, 8);
  const kept = [signature];
  let offset = 8;
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('latin1', offset + 4, offset + 8);
    const end = offset + 12 + length;
    if (KEEP_CHUNKS.has(type)) kept.push(buffer.subarray(offset, end));
    offset = end;
  }
  return Buffer.concat(kept);
}

for (const size of FAVICONS) {
  const source = await readFile(path.join(kit, 'favicon', `favicon-${size}.png`));
  await writeFile(path.join(root, 'public', 'favicon', `favicon-${size}.png`), stripPngMetadata(source));
}
/**
 * The loader's own file, `loader/sousadev-loader.svg`, is a static export: it
 * has no `<animate>` elements despite the package's README describing it as
 * SMIL-animated. The actual working animated markup only exists inline inside
 * `loader/embed-example.html`, as its first (dark, default-colour) demo
 * instance. That markup, not the static file, is what is copied to
 * production, so the shipped loader actually animates as documented. The
 * mask id and the two `--sd-loader-*` custom properties are the file's own
 * naming, kept unchanged.
 */
async function extractAnimatedLoader() {
  const html = await readFile(path.join(kit, 'loader', 'embed-example.html'), 'utf8');
  const match = html.match(/<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 120 120".*?<\/svg>/s);
  if (!match) throw new Error('Could not find the animated loader markup in embed-example.html');
  return match[0];
}

await writeFile(
  path.join(root, 'public', 'loader', 'sousadev-loader.svg'),
  await extractAnimatedLoader(),
);

/** ICO container holding the supplied 16, 32 and 48px PNGs unchanged. */
async function writeIco(sizes, target) {
  const pngs = await Promise.all(
    sizes.map((size) => readFile(path.join(root, 'public', 'favicon', `favicon-${size}.png`))),
  );
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(sizes.length, 4);
  const entries = [];
  let offset = 6 + sizes.length * 16;
  sizes.forEach((size, index) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(pngs[index].length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += pngs[index].length;
    entries.push(entry);
  });
  await writeFile(target, Buffer.concat([header, ...entries, ...pngs]));
}

await writeIco([16, 32, 48], path.join(root, 'public', 'favicon.ico'));

for (const locale of ['en', 'pt']) {
  const dictionary = JSON.parse(await readFile(path.join(root, 'src', 'i18n', `${locale}.json`), 'utf8'));
  const startUrl = locale === 'pt' ? '/pt/' : '/';
  const manifest = {
    name: 'Sousa Dev',
    short_name: 'Sousa Dev',
    description: dictionary.seo.home.description,
    start_url: startUrl,
    scope: startUrl,
    display: 'standalone',
    background_color: '#0A1014',
    theme_color: '#0A1014',
    lang: locale === 'pt' ? 'pt-PT' : 'en',
    icons: [
      { src: '/favicon/favicon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/favicon/favicon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/logo/app-icon-green.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
  await writeFile(
    path.join(root, 'public', locale === 'pt' ? 'site.pt.webmanifest' : 'site.webmanifest'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
}

console.log('Copied brand assets to public/, wrote favicon.ico and EN/PT web manifests');
