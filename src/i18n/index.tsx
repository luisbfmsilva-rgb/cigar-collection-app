import { getLocales } from 'expo-localization';
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import en, { Strings } from './en';
import es from './es';
import pt from './pt';

export type Locale = 'en' | 'pt' | 'es';
export const LOCALES: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
  { code: 'es', label: 'Español' },
];

const tables: Record<Locale, Strings> = { en, pt, es };

export function deviceLocale(): Locale {
  const code = getLocales()[0]?.languageCode ?? 'en';
  return code === 'pt' || code === 'es' ? code : 'en';
}

function lookup(table: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((node, key) => {
    if (node && typeof node === 'object' && key in (node as Record<string, unknown>)) {
      return (node as Record<string, unknown>)[key];
    }
    return undefined;
  }, table);
}

function interpolate(text: string, params?: Record<string, string | number>) {
  if (!params) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (_, k: string) => (k in params ? String(params[k]) : `{{${k}}}`));
}

type Translate = {
  (path: string, params?: Record<string, string | number>): string;
  list: (path: string) => string[];
};

type Ctx = { locale: Locale; setLocale: (l: Locale) => void; t: Translate; s: Strings };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children, initial }: { children: ReactNode; initial?: Locale }) {
  const [locale, setLocale] = useState<Locale>(initial ?? deviceLocale());

  const t = useMemo<Translate>(() => Object.assign(
    (path: string, params?: Record<string, string | number>) => {
      const value = lookup(tables[locale], path) ?? lookup(en, path);
      return typeof value === 'string' ? interpolate(value, params) : path;
    },
    {
      list: (path: string) => {
        const value = lookup(tables[locale], path) ?? lookup(en, path);
        return Array.isArray(value) ? (value as string[]) : [];
      },
    },
  ), [locale]);

  const set = useCallback((l: Locale) => setLocale(l), []);
  const value = useMemo(() => ({ locale, setLocale: set, t, s: tables[locale] }), [locale, set, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}

/** Picks the label column for the current locale from reference tables (label_en / label_pt / label_es). */
export function localized<T extends { label_en: string; label_pt: string; label_es: string }>(row: T, locale: Locale) {
  return locale === 'pt' ? row.label_pt : locale === 'es' ? row.label_es : row.label_en;
}
