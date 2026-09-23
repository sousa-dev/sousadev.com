import servicesData from '../content/services.json';
import type { Locale } from './i18n';

export interface Service {
  slug: string;
  num: string;
  tags: Record<Locale, string>;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  lead: Record<Locale, string>;
  includes: Record<Locale, string[]>;
  deliverables: Record<Locale, string[]>;
}

/** Single source for the home cards and the expanded /services sections. */
export const services: Service[] = servicesData as Service[];
