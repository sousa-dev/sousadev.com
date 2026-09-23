import type { APIRoute } from 'astro';
import { LOCALES, type Locale } from '../lib/i18n';
import { ROUTES, path, articlePath, absolute, type RouteKey } from '../lib/routes';
import { getArticles, articleSlug } from '../lib/blog';

/**
 * Built from the same route helper the links use, so the sitemap cannot drift
 * from the pages or from the trailing-slash policy. 404 pages are excluded.
 */
export const GET: APIRoute = async () => {
  const entries: { loc: string; alternates: { hreflang: string; href: string }[] }[] = [];

  for (const key of Object.keys(ROUTES) as RouteKey[]) {
    for (const locale of LOCALES) {
      entries.push({
        loc: absolute(path(locale, key)),
        alternates: LOCALES.map((code) => ({ hreflang: code, href: absolute(path(code, key)) })),
      });
    }
  }

  for (const locale of LOCALES) {
    const articles = await getArticles(locale as Locale);
    for (const article of articles) {
      entries.push({
        loc: absolute(articlePath(locale as Locale, articleSlug(article))),
        alternates: [],
      });
    }
  }

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries.map((entry) =>
      [
        '  <url>',
        `    <loc>${entry.loc}</loc>`,
        ...entry.alternates.map(
          (alt) =>
            `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}" />`,
        ),
        '  </url>',
      ].join('\n'),
    ),
    '</urlset>',
    '',
  ].join('\n');

  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
