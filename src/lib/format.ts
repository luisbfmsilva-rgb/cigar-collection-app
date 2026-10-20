import type { Locale } from '@/i18n';

type T = (path: string, params?: Record<string, string | number>) => string;

export function timeAgo(iso: string, t: T, now = Date.now()) {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return t('time.now');
  if (min < 60) return t('time.m', { n: min });
  const h = Math.floor(min / 60);
  if (h < 24) return t('time.h', { n: h });
  const d = Math.floor(h / 24);
  return t('time.d', { n: d });
}

/** "7 months", "12 days", "2 years" — for how long a cigar has been stored. */
export function storedFor(fromIso: string, t: T, now = new Date()) {
  const from = new Date(fromIso);
  const days = Math.max(0, Math.floor((now.getTime() - from.getTime()) / 86400000));
  if (days < 60) return t('time.days', { n: days });
  const months = Math.floor(days / 30.44);
  if (months < 24) return t('time.months', { n: months });
  return t('time.years', { n: Math.floor(months / 12) });
}

export function daysSince(fromIso: string, now = new Date()) {
  return Math.floor((now.getTime() - new Date(fromIso).getTime()) / 86400000);
}

export function formatRating(r: number | null | undefined, locale: Locale) {
  if (r == null) return '–';
  return Number(r).toLocaleString(locale === 'en' ? 'en-US' : locale === 'pt' ? 'pt-BR' : 'es-ES', {
    minimumFractionDigits: r % 1 === 0 ? 1 : 2,
    maximumFractionDigits: 2,
  });
}

/** 52 × 6" */
export function formatSize(ring: number | null, lengthIn: number | null) {
  if (!ring && !lengthIn) return null;
  const len = lengthIn ? `${Number(lengthIn).toString().replace(/\.0+$/, '')}"` : '';
  return [ring ? String(ring) : null, len || null].filter(Boolean).join(' × ');
}

export function cigarTitle(c: { brand_name?: string | null; line: string; vitola?: string | null }) {
  return [c.brand_name, c.line].filter(Boolean).join(' ');
}

const COUNTRY_NAMES: Record<string, { en: string; pt: string; es: string }> = {
  BR: { en: 'Brazil', pt: 'Brasil', es: 'Brasil' },
  CU: { en: 'Cuba', pt: 'Cuba', es: 'Cuba' },
  DO: { en: 'Dominican Republic', pt: 'República Dominicana', es: 'República Dominicana' },
  NI: { en: 'Nicaragua', pt: 'Nicarágua', es: 'Nicaragua' },
  HN: { en: 'Honduras', pt: 'Honduras', es: 'Honduras' },
  CR: { en: 'Costa Rica', pt: 'Costa Rica', es: 'Costa Rica' },
  EC: { en: 'Ecuador', pt: 'Equador', es: 'Ecuador' },
  MX: { en: 'Mexico', pt: 'México', es: 'México' },
  US: { en: 'United States', pt: 'Estados Unidos', es: 'Estados Unidos' },
  PA: { en: 'Panama', pt: 'Panamá', es: 'Panamá' },
  PE: { en: 'Peru', pt: 'Peru', es: 'Perú' },
  CO: { en: 'Colombia', pt: 'Colômbia', es: 'Colombia' },
  PH: { en: 'Philippines', pt: 'Filipinas', es: 'Filipinas' },
  ID: { en: 'Indonesia', pt: 'Indonésia', es: 'Indonesia' },
  CM: { en: 'Cameroon', pt: 'Camarões', es: 'Camerún' },
  ES: { en: 'Spain', pt: 'Espanha', es: 'España' },
  CA: { en: 'Canada', pt: 'Canadá', es: 'Canadá' },
  GB: { en: 'United Kingdom', pt: 'Reino Unido', es: 'Reino Unido' },
  DE: { en: 'Germany', pt: 'Alemanha', es: 'Alemania' },
  PT: { en: 'Portugal', pt: 'Portugal', es: 'Portugal' },
  AR: { en: 'Argentina', pt: 'Argentina', es: 'Argentina' },
};

export function countryName(code: string | null | undefined, locale: Locale) {
  if (!code) return null;
  return COUNTRY_NAMES[code.toUpperCase()]?.[locale] ?? code.toUpperCase();
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

/** Stars on the 0.25–5 scale derived from the 100-point review. */
export function scoreToRating(score100: number) {
  const r = Math.round((score100 / 20) * 4) / 4;
  return Math.min(5, Math.max(0.25, r));
}

export function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
