import { DEFAULT_LOCALE, type Locale } from './i18n';

/**
 * Stable route keys. Adding a page means adding a key here and a page file in
 * both `src/pages/` and `src/pages/pt/`, so the language switch can always
 * resolve the equivalent route.
 */
export const ROUTES = {
  home: '',
  services: 'services',
  process: 'process',
  products: 'products',
  about: 'about',
  blog: 'blog',
  contact: 'contact',
  privacy: 'privacy',
} as const;

export type RouteKey = keyof typeof ROUTES;

/**
 * Trailing-slash policy: never, except the site root `/`. Applied here so
 * links, canonicals, hreflang and the sitemap cannot drift apart.
 */
export function path(locale: Locale, key: RouteKey, hash?: string): string {
  const segment = ROUTES[key];
  const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`;
  const base = segment ? `${prefix}/${segment}` : prefix || '/';
  return hash ? `${base}#${hash}` : base;
}

/** `/blog/my-article` or `/pt/blog/o-meu-artigo`. */
export function articlePath(locale: Locale, slug: string): string {
  return `${path(locale, 'blog')}/${slug}`;
}

export const SITE_URL = 'https://sousadev.com';

export function absolute(pathname: string): string {
  return `${SITE_URL}${pathname === '/' ? '/' : pathname}`;
}

/**
 * Main navigation, used by the desktop nav and the mobile panel. The blog is
 * deliberately not here: it is reachable from the footer, which keeps the top
 * bar focused on what a buyer is deciding between.
 */
export const NAV_KEYS = ['services', 'process', 'products', 'about'] as const satisfies readonly RouteKey[];

/** Company column in the footer, where the blog does appear. */
export const FOOTER_KEYS = ['services', 'process', 'about', 'blog'] as const satisfies readonly RouteKey[];
