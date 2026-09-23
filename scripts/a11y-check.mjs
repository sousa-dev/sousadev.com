/**
 * axe-core scan of every built route in both languages, at desktop and mobile
 * width, including the mobile menu open and the product filter applied.
 * Results are written to reports/axe.json.
 *
 * Run: npm run build && npm run test:a11y
 */
import { AxeBuilder } from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { launch, serveDist } from './browser-lib.mjs';

const ROUTES = ['', 'services', 'process', 'products', 'about', 'blog', 'contact', 'privacy', '404'];
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

const server = await serveDist(4323);
const browser = await launch();
const findings = [];
let scans = 0;

async function scan(label, page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  scans += 1;
  for (const violation of results.violations) {
    findings.push({
      page: label,
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      nodes: violation.nodes.map((node) => node.target.join(' ')).slice(0, 4),
    });
  }
}

try {
  for (const width of [1440, 390]) {
    // axe-core/playwright requires a context-created page.
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    for (const route of ROUTES) {
      for (const prefix of ['', '/pt']) {
        const url = `${prefix}/${route}`.replace(/\/$/, '') || '/';
        await page.goto(`${server.origin}${url}`);
        await page.waitForTimeout(120);
        await scan(`${url} @${width}`, page);
      }
    }
    await context.close();
  }

  // Interaction states.
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobile = await mobileContext.newPage();
  await mobile.goto(`${server.origin}/`);
  await mobile.locator('.menu__toggle').click();
  await mobile.waitForTimeout(150);
  await scan('/ with the mobile menu open @390', mobile);
  await mobileContext.close();

  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const desktop = await desktopContext.newPage();
  await desktop.goto(`${server.origin}/products`);
  await desktop.locator('[data-filter-value="in-development"]').click();
  await scan('/products filtered @1440', desktop);

  await desktop.goto(`${server.origin}/contact`);
  await desktop.locator('form button[type="submit"]').click();
  await desktop.waitForTimeout(200);
  await scan('/contact with form errors @1440', desktop);

  await desktop.goto(`${server.origin}/process`);
  await desktop.locator('.faq__item summary').first().click();
  await scan('/process with an open FAQ answer @1440', desktop);
  await desktopContext.close();
} finally {
  await browser.close();
  await server.close();
}

await mkdir('reports', { recursive: true });
await writeFile('reports/axe.json', `${JSON.stringify({ scans, findings }, null, 2)}\n`);

if (findings.length > 0) {
  console.error(`axe found ${findings.length} violation(s) across ${scans} scans:`);
  for (const finding of findings) {
    console.error(`  - [${finding.impact}] ${finding.page}: ${finding.id} (${finding.help})`);
    console.error(`      ${finding.nodes.join(' | ')}`);
  }
  process.exit(1);
}
console.log(`axe: no violations across ${scans} page states (reports/axe.json)`);
