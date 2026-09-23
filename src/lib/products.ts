import productsData from '../content/products.json';
import type { Locale } from './i18n';

export type ProductStatus = 'live' | 'in-development';

export interface Product {
  name: string;
  url: string;
  domain: string;
  status: ProductStatus;
  description: Record<Locale, string>;
  /** Screenshot in `src/images/products/`. Null until a real one is supplied. */
  image: string | null;
  alt: Record<Locale, string | null>;
}

const STATUS_ORDER: Record<ProductStatus, number> = { live: 0, 'in-development': 1 };

/** Supplied order, live first. Names, URLs and statuses come from the data file. */
export const products: Product[] = [...(productsData as Product[])].sort(
  (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
);

/** Counts are derived from the data, never hardcoded (audit D01). */
export const productCounts = {
  all: products.length,
  live: products.filter((p) => p.status === 'live').length,
  inDevelopment: products.filter((p) => p.status === 'in-development').length,
};
