import en from '../i18n/en.json';
import pt from '../i18n/pt.json';

export const LOCALES = ['en', 'pt'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export type Dictionary = typeof en;

const DICTIONARIES: Record<Locale, Dictionary> = {
  en,
  // The PT dictionary is validated against the EN key shape by
  // scripts/check-content.mjs, so this cast cannot hide a missing key.
  pt: pt as unknown as Dictionary,
};

export function useTranslations(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'en' ? 'pt' : 'en';
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Fills `{name}` placeholders. Used for counts and dates, never for copy. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in values ? String(values[key]) : match,
  );
}

const DATE_LOCALE: Record<Locale, string> = { en: 'en-GB', pt: 'pt-PT' };

/** `22 Sep 2026` in EN, `22 set 2026` in PT, per the developer spec. */
export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
