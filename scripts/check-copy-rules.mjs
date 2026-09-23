/**
 * Copy rules from the handoff, checked against authored production text only:
 * the two dictionaries, the content JSON and the markup of src/ components and
 * pages (frontmatter, <style> and <script> blocks excluded). The handoff in
 * lda/, the legacy site and documentation are deliberately out of scope, since
 * they contain intentional examples that would produce misleading failures.
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const problems = [];

const RULES = [
  {
    id: 'em-dash',
    test: /—/,
    message: 'em dash found; use a comma, full stop or slash',
  },
  {
    id: 'response-time',
    test: /\b(?:\d{1,2}\s*h(?:ours|oras)?\b(?!\w)|within\s+\d+\s*(?:hours|hrs|days)|em\s+\d+\s*(?:horas|dias)|24\/7|same[- ]day\s+repl)/i,
    message: 'response-time promise found; the claim is direct contact with the lead engineer',
  },
  {
    id: 'team-size',
    test: /\b(?:our\s+team\s+of|team\s+of\s+\d+|\d+\s+(?:engineers|developers|people)\b|equipa\s+de\s+\d+)/i,
    message: 'team-size claim found',
  },
  {
    id: 'brand-spelling',
    test: /\bSousadev\b|\bSousaDev\b|\bsousa dev\b/,
    message: '"Sousa Dev" must be two words, capitalised, outside URLs and emails',
  },
  {
    id: 'placeholder-identity',
    test: /NIF\s*0{3}|NIF\s*000\s*000\s*000|lorem ipsum/i,
    message: 'placeholder legal identity or filler copy found',
  },
  {
    id: 'placeholder-media',
    test: /CLIENT LOGO|TEAM \/ WORKSPACE PHOTO|FOTO EQUIPA \/ ESPA|PENDING APPROVED ASSET/,
    message: 'placeholder media label found',
  },
];

function stripAstro(source) {
  return source
    .replace(/^---[\s\S]*?\n---/, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}?/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
}

async function* walk(dir, match) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full, match);
    else if (match.test(entry.name)) yield full;
  }
}

const targets = [];
for await (const file of walk(path.join(root, 'src'), /\.(astro|json|md)$/)) targets.push(file);

for (const file of targets) {
  const raw = await readFile(file, 'utf8');
  const text = file.endsWith('.astro') ? stripAstro(raw) : raw;
  const relative = path.relative(root, file);
  for (const rule of RULES) {
    const lines = text.split('\n');
    lines.forEach((line, index) => {
      if (rule.test.test(line)) {
        problems.push(`${relative}:${index + 1} [${rule.id}] ${rule.message}\n      ${line.trim().slice(0, 140)}`);
      }
    });
  }
}

// Every marketing page must name development, deployment, hosting and management
// somewhere in its own copy. Checked per page component, both languages.
const PILLARS = {
  en: [/develop/i, /deploy/i, /host/i, /manag/i],
  pt: [/desenvolv/i, /deploy|implement/i, /aloja/i, /gest/i],
};
const dictionaries = {
  en: JSON.parse(await readFile(path.join(root, 'src/i18n/en.json'), 'utf8')),
  pt: JSON.parse(await readFile(path.join(root, 'src/i18n/pt.json'), 'utf8')),
};
for (const [locale, dictionary] of Object.entries(dictionaries)) {
  const serialised = JSON.stringify(dictionary);
  for (const pillar of PILLARS[locale]) {
    if (!pillar.test(serialised)) {
      problems.push(`${locale}.json does not mention ${pillar}; every page must name development, deployment, hosting and management`);
    }
  }
  if (!/working globally|trabalhar globalmente/i.test(serialised)) {
    problems.push(`${locale}.json does not use the "working globally" phrasing`);
  }
}

if (problems.length > 0) {
  console.error('Copy rule check failed:');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(`Copy rule check passed across ${targets.length} authored files`);
