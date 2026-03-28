export function formatCurrency(value?: number): string {
  if (value == null) return 'N/A';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
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
