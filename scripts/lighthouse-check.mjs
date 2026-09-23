/**
 * Lighthouse (mobile emulation) against the built site served locally.
 * Writes reports/lighthouse-<page>.json plus a summary table.
 *
 * Local runs measure this machine, not a real 4G device, and a locally served
 * site has no network latency or CDN, so treat the numbers as a lower bound on
 * problems rather than as production evidence. INP is not measured by a page
 * load; the interaction checks live in scripts/browser-checks.mjs.
 *
 * Run: npm run build && npm run test:lighthouse
 */
import { mkdir, writeFile } from 'node:fs/promises';
import lighthouse from 'lighthouse';
import { launch, serveDist } from './browser-lib.mjs';

const PAGES = [
  ['home-en', '/'],
  ['home-pt', '/pt'],
  ['products-en', '/products'],
  ['contact-en', '/contact'],
];

const server = await serveDist(4324);
const browser = await launch({ args: ['--remote-debugging-port=9222'] });
await mkdir('reports', { recursive: true });

const summary = [];
try {
  for (const [name, route] of PAGES) {
    const result = await lighthouse(
      `${server.origin}${route}`,
      { port: 9222, output: 'json', logLevel: 'error' },
      undefined,
    );
    if (!result) continue;
    const { lhr } = result;
    await writeFile(`reports/lighthouse-${name}.json`, JSON.stringify(lhr, null, 2));
    summary.push({
      page: route,
      performance: Math.round((lhr.categories.performance?.score ?? 0) * 100),
      accessibility: Math.round((lhr.categories.accessibility?.score ?? 0) * 100),
      bestPractices: Math.round((lhr.categories['best-practices']?.score ?? 0) * 100),
      seo: Math.round((lhr.categories.seo?.score ?? 0) * 100),
      lcpMs: Math.round(lhr.audits['largest-contentful-paint']?.numericValue ?? 0),
      cls: Number((lhr.audits['cumulative-layout-shift']?.numericValue ?? 0).toFixed(3)),
      tbtMs: Math.round(lhr.audits['total-blocking-time']?.numericValue ?? 0),
    });
  }
} finally {
  await browser.close();
  await server.close();
}

console.table(summary);
await writeFile('reports/lighthouse-summary.json', `${JSON.stringify(summary, null, 2)}\n`);

const below = summary.filter(
  (row) => Math.min(row.performance, row.accessibility, row.bestPractices, row.seo) < 95,
);
if (below.length > 0) {
  console.error('Pages below the 95 target:', below.map((row) => row.page).join(', '));
  process.exit(1);
}
console.log('Lighthouse: every category at or above 95 on the pages checked');
