/**
 * Presentation-layer formatting helpers.
 *
 * All monetary values are rendered as Indian Rupees using the `en-IN` locale so
 * that grouping follows the Indian numbering system (₹1,20,000 rather than
 * ₹120,000) and compact notation reads as ₹1.2 Lakh / ₹2 Crore.
 */
const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat('en-IN');

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const relativeFormatter = new Intl.RelativeTimeFormat('en-IN', {
  numeric: 'auto',
});

/** `₹12,000` */
export function formatCurrency(value: number): string {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

/** `₹1.2L` / `₹2Cr` — used in dense card layouts. */
export function formatCompactCurrency(value: number): string {
  return compactCurrencyFormatter.format(Number.isFinite(value) ? value : 0);
}

/** An annual award rendered as `₹12,000 / year`. */
export function formatAnnualAmount(value: number): string {
  return `${formatCurrency(value)} / year`;
}

/** `12,480` (Indian grouping). */
export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** `4 Mar 2026` */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return dateFormatter.format(date);
}

/** Bytes to a human readable string, e.g. `1.4 MB`. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'] as const;
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

/* -------------------------------------------------------------------------- */
/*  Identity helpers                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Reduce a provider name to a two-letter monogram, e.g.
 * `Reliance Foundation` → `RF`. Used by the decorative avatar.
 */
export function monogramFor(value: string): string {
  const initials = value
    .split(/[\s—-]+/)
    .map((part) => part.charAt(0))
    .filter((char) => /[A-Za-z0-9]/.test(char))
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return initials || '—';
}

/** Deterministic 0-360 hue derived from an id, used to tint card avatars. */
export function hueFor(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 360;
  }
  return hash;
}

/* -------------------------------------------------------------------------- */
/*  Date maths                                                                 */
/* -------------------------------------------------------------------------- */

const MS_PER_DAY = 86_400_000;

/** Whole days between now and an ISO timestamp. Negative when in the past. */
export function daysUntil(iso: string, from: Date = new Date()): number {
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return Number.NaN;
  const start = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const end = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((end - start) / MS_PER_DAY);
}

/** Human countdown, e.g. `3 days left`, `Due today`, `Closed 4 days ago`. */
export function formatCountdown(days: number): string {
  if (Number.isNaN(days)) return '—';
  if (days === 0) return 'Due today';
  if (days === 1) return '1 day left';
  if (days === -1) return 'Closed 1 day ago';
  if (days > 1) return `${days} days left`;
  return `Closed ${Math.abs(days)} days ago`;
}

/** Convert a day delta into relative prose, e.g. `in 2 months`. */
export function formatRelativeDays(days: number): string {
  if (Number.isNaN(days)) return '—';
  if (Math.abs(days) < 30) return relativeFormatter.format(days, 'day');
  if (Math.abs(days) < 365) return relativeFormatter.format(Math.round(days / 30), 'month');
  return relativeFormatter.format(Math.round(days / 365), 'year');
}

/** Percentage clamped to 0-100, rounded to a whole number. */
export function percent(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((part / whole) * 100)));
}
