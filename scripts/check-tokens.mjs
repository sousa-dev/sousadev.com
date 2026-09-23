/**
 * Regenerates src/styles/tokens.json from src/styles/tokens.css and fails if the
 * committed JSON was out of date, so the machine-readable token sheet cannot
 * drift from the CSS one. Also enforces two production rules from the audit:
 * no text token below 12px (D02), and every custom property used in src/ being
 * defined in the sheet.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readdir } from 'node:fs/promises';

const root = process.cwd();
const cssPath = path.join(root, 'src', 'styles', 'tokens.css');
const jsonPath = path.join(root, 'src', 'styles', 'tokens.json');

const css = await readFile(cssPath, 'utf8');
const tokens = {};
for (const match of css.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
  tokens[`--${match[1]}`] = match[2].trim().replace(/\s+/g, ' ');
}

const problems = [];

// D02: 12px floor for any text size token.
for (const [name, value] of Object.entries(tokens)) {
  if (!name.startsWith('--text-')) continue;
  const px = value.match(/^(\d+(?:\.\d+)?)px$/);
  if (px && Number(px[1]) < 12) problems.push(`${name} is ${value}, below the 12px production floor`);
}

// Every var() used in src/ must exist in the sheet.
async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(astro|css|ts)$/.test(entry.name)) yield full;
  }
}

const used = new Set();
for await (const file of walk(path.join(root, 'src'))) {
  const source = await readFile(file, 'utf8');
  for (const match of source.matchAll(/var\((--[\w-]+)/g)) used.add(match[1]);
}
// Component-local custom properties: values a component computes for itself,
// not design tokens. --logos-shift is the logo strip's loop distance, derived
// from how many copies of the set it renders. Its local height and per-image
// aspect ratio reserve the existing responsive geometry before image loading.
const componentLocal = new Set(['--mark-s', '--mark-d', '--logos-shift', '--logos-height', '--logo-ratio']);
for (const name of used) {
  if (!(name in tokens) && !componentLocal.has(name)) problems.push(`var(${name}) is used but not defined in tokens.css`);
}

const serialised = `${JSON.stringify(tokens, null, 2)}\n`;
let previous = '';
try {
  previous = await readFile(jsonPath, 'utf8');
} catch {
  previous = '';
}
if (previous !== serialised) {
  await writeFile(jsonPath, serialised, 'utf8');
  if (previous !== '' && process.env.CI) {
    problems.push('tokens.json was out of date; it has been regenerated, commit the change');
  } else {
    console.log(`tokens.json ${previous === '' ? 'created' : 'updated'} from tokens.css`);
  }
}

if (problems.length > 0) {
  console.error('Token check failed:');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(`Token check passed: ${Object.keys(tokens).length} tokens, ${used.size} referenced`);
