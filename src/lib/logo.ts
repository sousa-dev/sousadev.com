import lockupRaw from '../../public/logo/horizontal-two-tone-on-dark.svg?raw';

/**
 * The supplied horizontal lockup, adapted for inline use (audit D16).
 *
 * The geometry is the handoff file, including its vertical separator and its
 * outlined wordmark: nothing is retyped or reconstructed. Three build-time
 * changes are made so the specified nav/footer hover can work at all:
 *   1. the C2PA provenance block is dropped from the inline copy, since it is
 *      ~13 KB of base64 that would otherwise be inlined on every page. The
 *      original file with provenance stays in public/logo/ and in lda/;
 *   2. the two mark chevrons are wrapped in a group that can be rotated on its
 *      own, so the whole lockup does not rotate;
 *   3. the chevron strokes move from hardcoded hex to custom properties, so the
 *      documented colour exchange is a CSS concern and can be switched off
 *      under prefers-reduced-motion.
 */
const body = lockupRaw
  .replace(/<metadata>[\s\S]*?<\/metadata>/, '')
  .replace(/^[\s\S]*?<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '')
  .trim();

const paths = body.match(/<path\b[^>]*><\/path>|<path\b[^>]*\/>/g) ?? [];
const separator = body.match(/<line\b[^>]*(?:><\/line>|\/>)/)?.[0] ?? '';
const wordmark = body.match(/<g\b[\s\S]*<\/g>/)?.[0] ?? '';

if (paths.length < 2 || !separator || !wordmark) {
  throw new Error('Unexpected structure in the supplied horizontal lockup SVG');
}

const chevronS = paths[0] as string;
const chevronD = paths[1] as string;

function asVariable(pathMarkup: string, cssVariable: string): string {
  return pathMarkup.replace(/stroke="#[0-9A-Fa-f]{6}"/, `stroke="var(${cssVariable})"`);
}

/** viewBox of the supplied lockup. */
export const LOCKUP_VIEWBOX = '0 0 534.3152709359606 120';
export const LOCKUP_RATIO = 534.3152709359606 / 120;
export const MARK_VIEWBOX = '0 0 120 120';

export const markMarkup = [
  asVariable(chevronS, '--mark-s'),
  asVariable(chevronD, '--mark-d'),
].join('');

export const lockupMarkup = [
  `<g class="lockup__mark">${markMarkup}</g>`,
  separator,
  wordmark,
].join('');
