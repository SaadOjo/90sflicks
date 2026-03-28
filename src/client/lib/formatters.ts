export function formatCurrency(value?: number): string {
  if (value == null) return 'N/A';

  const absolute = Math.abs(value);

  if (absolute >= 1_000_000_000) {
    return `$${trimDecimal(value / 1_000_000_000)}B`;
  }

  if (absolute >= 1_000_000) {
    return `$${trimDecimal(value / 1_000_000)}M`;
  }

  if (absolute >= 1_000) {
    return `$${trimDecimal(value / 1_000)}K`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function trimDecimal(value: number): string {
  const fixed = value.toFixed(1);
  return fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
}

export function parseAmountInput(value: string): number | undefined {
  const normalized = value.trim().toLowerCase().replace(/[$,\s]/g, '');
  if (!normalized) return undefined;

  const match = normalized.match(/^(-?\d+(?:\.\d+)?)([kmb])?$/);
  if (!match) return undefined;

  const amount = Number(match[1]);
  if (Number.isNaN(amount)) return undefined;

  const suffix = match[2];
  if (suffix === 'k') return Math.round(amount * 1_000);
  if (suffix === 'm') return Math.round(amount * 1_000_000);
  if (suffix === 'b') return Math.round(amount * 1_000_000_000);
  return Math.round(amount);
}

export function formatDisplayDate(value?: string): string {
  if (!value) return 'Unknown';

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatFilmType(value?: string): string {
  if (!value) return 'Unknown';

  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}
