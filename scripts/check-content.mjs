/**
 * Validates the structured content the site is built from, so a content edit
 * cannot silently break a page:
 *   - EN and PT dictionaries have identical key shapes, types and array lengths,
 *     including the shape of objects inside arrays (audit D07);
 *   - no locale dictionary still carries the duplicated service records (D06);
 *   - services and products match the contracts in IMPLEMENTATION.md;
 *   - product statuses are only the two supplied values, and names, URLs and
 *     domains agree with the original handoff data;
 *   - every dictionary key is used somewhere in src/.
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = async (file) => JSON.parse(await readFile(path.join(root, file), 'utf8'));

const en = await read('src/i18n/en.json');
const pt = await read('src/i18n/pt.json');
const services = await read('src/content/services.json');
const products = await read('src/content/products.json');
const handoffProducts = await read('lda/content/products.json');
const handoffServices = await read('lda/content/services.json');

// The handoff left these PT titles in English. The production copy translates
// them while the EN titles stay identical to the supplied service names.
const ptServiceTitles = new Map([
  ['custom-software', 'Soluções de Software à Medida'],
  ['website-development', 'Desenvolvimento de Sites'],
]);

const problems = [];
const warnings = [];

function shape(value, trail, into) {
  if (Array.isArray(value)) {
    into.push(`${trail}=array(${value.length})`);
    value.forEach((item, index) => shape(item, `${trail}[${index}]`, into));
  } else if (value && typeof value === 'object') {
    for (const key of Object.keys(value).sort()) shape(value[key], `${trail}.${key}`, into);
  } else {
    into.push(`${trail}=${typeof value}`);
  }
  return into;
}

const enShape = shape(en, '', []);
const ptShape = shape(pt, '', []);
for (const entry of enShape) if (!ptShape.includes(entry)) problems.push(`pt.json is missing or differs at ${entry}`);
for (const entry of ptShape) if (!enShape.includes(entry)) problems.push(`pt.json has an extra or differing ${entry}`);

for (const [locale, dictionary] of [['en', en], ['pt', pt]]) {
  if (dictionary.services?.items) {
    problems.push(`${locale}.json still duplicates services.items; services come from src/content/services.json (D06)`);
  }
  if (dictionary.products?.items) {
    problems.push(`${locale}.json still duplicates products.items; products come from src/content/products.json`);
  }
}

// Services contract.
const handoffSlugs = handoffServices.map((service) => service.slug);
if (services.length !== handoffSlugs.length) problems.push('services.json no longer has the four supplied services');
for (const service of services) {
  if (!handoffSlugs.includes(service.slug)) problems.push(`service slug ${service.slug} is not one of the supplied slugs`);
  for (const field of ['title', 'description', 'tags', 'lead']) {
    for (const locale of ['en', 'pt']) {
      if (!service[field]?.[locale]) problems.push(`service ${service.slug} is missing ${field}.${locale}`);
    }
  }
  for (const field of ['includes', 'deliverables']) {
    for (const locale of ['en', 'pt']) {
      if (!Array.isArray(service[field]?.[locale]) || service[field][locale].length === 0) {
        problems.push(`service ${service.slug} is missing ${field}.${locale}`);
      }
    }
    if (service[field].en.length !== service[field].pt.length) {
      problems.push(`service ${service.slug} has different ${field} lengths per language`);
    }
  }
  const supplied = handoffServices.find((item) => item.slug === service.slug);
  for (const locale of ['en', 'pt']) {
    const expectedTitle = locale === 'pt'
      ? (ptServiceTitles.get(service.slug) ?? supplied.title.pt)
      : supplied.title.en;
    if (expectedTitle !== service.title[locale]) {
      problems.push(`service ${service.slug} title (${locale}) differs from the approved title`);
    }
  }
}

// Products contract: names, URLs, domains and statuses must match the handoff.
const STATUSES = new Set(['live', 'in-development']);
if (products.length !== handoffProducts.length) problems.push('products.json no longer has the six supplied products');
for (const product of products) {
  const supplied = handoffProducts.find((item) => item.name === product.name);
  if (!supplied) {
    problems.push(`product ${product.name} is not in the supplied handoff data`);
    continue;
  }
  if (supplied.url !== product.url) problems.push(`product ${product.name} url differs from the handoff`);
  if (supplied.domain !== product.domain) problems.push(`product ${product.name} domain differs from the handoff`);
  if (supplied.status !== product.status) problems.push(`product ${product.name} status differs from the handoff`);
  if (!STATUSES.has(product.status)) problems.push(`product ${product.name} has an unknown status ${product.status}`);
  for (const locale of ['en', 'pt']) {
    if (!product.description?.[locale]) problems.push(`product ${product.name} is missing description.${locale}`);
  }
  if (product.image && !product.alt?.en) {
    problems.push(`product ${product.name} has an image but no English alt text`);
  }
  if (product.image && !product.alt?.pt) {
    problems.push(`product ${product.name} has an image but no Portuguese alt text`);
  }
}

// Unused dictionary keys: a warning, not a failure.
async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(astro|ts)$/.test(entry.name)) yield full;
  }
}
let sources = '';
for await (const file of walk(path.join(root, 'src'))) sources += await readFile(file, 'utf8');

function leafPaths(value, trail = '') {
  if (Array.isArray(value)) return [trail];
  if (value && typeof value === 'object') {
    return Object.keys(value).flatMap((key) => leafPaths(value[key], trail ? `${trail}.${key}` : key));
  }
  return [trail];
}
for (const keyPath of leafPaths(en)) {
  const leaf = keyPath.split('.').slice(-1)[0];
  const parent = keyPath.split('.').slice(-2, -1)[0];
  const direct = new RegExp(`\\.${leaf}\\b`);
  if (!direct.test(sources) && !sources.includes(`t.${keyPath}`) && !(parent && sources.includes(`t.${parent}`))) {
    warnings.push(`dictionary key ${keyPath} is not referenced in src/`);
  }
}

for (const warning of warnings) console.warn(`warning: ${warning}`);
if (problems.length > 0) {
  console.error('Content check failed:');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
const live = products.filter((product) => product.status === 'live').length;
console.log(
  `Content check passed: ${services.length} services, ${products.length} products (${live} live), ` +
    `${leafPaths(en).length} dictionary keys in both languages`,
);
