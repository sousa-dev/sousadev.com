import { existsSync } from 'node:fs';
import path from 'node:path';
import type { Locale } from './i18n';

/**
 * Social image for an article.
 *
 * Order of preference:
 *   1. an `ogImage` in the article's own frontmatter, for a real photograph or
 *      diagram belonging to that post;
 *   2. the branded card `npm run og` generates from the article title;
 *   3. the language's blog index card, so a page never advertises an image
 *      that does not exist.
 *
 * Whoever writes an article normally does nothing here. The generator creates
 * the card, and scripts/check-output.mjs fails the build if an article ends up
 * on the fallback, which is the signal that `npm run og` has not been run.
 */
export function articleOgImage(
  locale: Locale,
  slug: string,
  supplied?: string,
): string {
  if (supplied) return supplied;
  const generated = `/og/${locale}-article-${slug}.png`;
  if (existsSync(path.join(process.cwd(), 'public', generated.replace(/^\//, '')))) {
    return generated;
  }
  return `/og/${locale}-blog.png`;
}
