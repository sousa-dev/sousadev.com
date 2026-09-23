/**
 * Copies the existing public legal documents into the build output so their URLs
 * survive the switch from serving the repository root to serving dist/
 * (docs/brand-revamp/LAUNCH.md). The repository root files stay the single
 * source: they are not duplicated in src/ or public/.
 *
 * The Cloud Identifier pair documents a separate product and must keep its own
 * URLs; it is never redirected to the company privacy page.
 */
import { copyFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');

const LEGACY = [
  'privacy-policy.html',
  'terms-and-conditions.html',
  'cloud-identifier-privacy-policy.html',
  'cloud-identifier-tos.html',
  'app-ads.txt',
  'CNAME',
];

await mkdir(dist, { recursive: true });

let copied = 0;
for (const file of LEGACY) {
  const source = path.join(root, file);
  try {
    await access(source);
  } catch {
    console.warn(`skipped missing legacy file: ${file}`);
    continue;
  }
  await copyFile(source, path.join(dist, file));
  copied += 1;
}

console.log(`Preserved ${copied} legacy file(s) in dist/`);
