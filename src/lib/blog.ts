import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from './i18n';

export type Article = CollectionEntry<'blog'>;

const isPublished = (entry: Article) => import.meta.env.DEV || entry.data.draft !== true;

/** Articles for one language, newest first. */
export async function getArticles(locale: Locale): Promise<Article[]> {
  const all = await getCollection('blog');
  return all
    .filter((entry) => entry.data.locale === locale && isPublished(entry))
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** The same article in the other language, when one exists. */
export async function getTranslation(
  article: Article,
  locale: Locale,
): Promise<Article | undefined> {
  const all = await getCollection('blog');
  return all.find(
    (entry) =>
      entry.data.locale === locale &&
      entry.data.translationKey === article.data.translationKey &&
      isPublished(entry),
  );
}

/** Slug without the locale folder, so `/blog/x` and `/pt/blog/x` pair up. */
export function articleSlug(article: Article): string {
  return article.id.replace(/^(en|pt)\//, '');
}

export function readingMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
