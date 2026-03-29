export interface NumericBucketDefinition {
  key: string;
  label: string;
  min?: number;
  maxExclusive?: number;
  includeUnknown?: boolean;
}

export const BUDGET_BUCKETS: NumericBucketDefinition[] = [
  { key: 'unknown', label: 'Unknown', includeUnknown: true },
  { key: 'under_1m', label: 'Under $1M', maxExclusive: 1_000_000 },
  { key: '1m_4_9m', label: '$1M–$4.9M', min: 1_000_000, maxExclusive: 5_000_000 },
  { key: '5m_9_9m', label: '$5M–$9.9M', min: 5_000_000, maxExclusive: 10_000_000 },
  { key: '10m_24_9m', label: '$10M–$24.9M', min: 10_000_000, maxExclusive: 25_000_000 },
  { key: '25m_49_9m', label: '$25M–$49.9M', min: 25_000_000, maxExclusive: 50_000_000 },
  { key: '50m_99_9m', label: '$50M–$99.9M', min: 50_000_000, maxExclusive: 100_000_000 },
  { key: '100m_plus', label: '$100M+', min: 100_000_000 },
];

export const BOX_OFFICE_BUCKETS: NumericBucketDefinition[] = [
  { key: 'unknown', label: 'Unknown', includeUnknown: true },
  { key: 'under_1m', label: 'Under $1M', maxExclusive: 1_000_000 },
  { key: '1m_9_9m', label: '$1M–$9.9M', min: 1_000_000, maxExclusive: 10_000_000 },
  { key: '10m_24_9m', label: '$10M–$24.9M', min: 10_000_000, maxExclusive: 25_000_000 },
  { key: '25m_49_9m', label: '$25M–$49.9M', min: 25_000_000, maxExclusive: 50_000_000 },
  { key: '50m_99_9m', label: '$50M–$99.9M', min: 50_000_000, maxExclusive: 100_000_000 },
  { key: '100m_249_9m', label: '$100M–$249.9M', min: 100_000_000, maxExclusive: 250_000_000 },
  { key: '250m_plus', label: '$250M+', min: 250_000_000 },
];

export const IMDB_RATING_BUCKETS: NumericBucketDefinition[] = [
  { key: 'unknown', label: 'Unknown', includeUnknown: true },
  { key: 'under_5', label: 'Under 5.0', maxExclusive: 5 },
  { key: '5_5_9', label: '5.0–5.9', min: 5, maxExclusive: 6 },
  { key: '6_6_9', label: '6.0–6.9', min: 6, maxExclusive: 7 },
  { key: '7_7_9', label: '7.0–7.9', min: 7, maxExclusive: 8 },
  { key: '8_plus', label: '8.0+', min: 8 },
];

export const IMDB_VOTE_COUNT_BUCKETS: NumericBucketDefinition[] = [
  { key: 'unknown', label: 'Unknown', includeUnknown: true },
  { key: 'under_100', label: 'Under 100', maxExclusive: 100 },
  { key: '100_999', label: '100–999', min: 100, maxExclusive: 1_000 },
  { key: '1k_9_9k', label: '1K–9.9K', min: 1_000, maxExclusive: 10_000 },
  { key: '10k_99_9k', label: '10K–99.9K', min: 10_000, maxExclusive: 100_000 },
  { key: '100k_999_9k', label: '100K–999.9K', min: 100_000, maxExclusive: 1_000_000 },
  { key: '1m_plus', label: '1M+', min: 1_000_000 },
];

export function buildNumericBucketClause(
  alias: string,
  column: string,
  selectedKeys: string[],
  definitions: NumericBucketDefinition[],
  params: unknown[],
): string | null {
  if (selectedKeys.length === 0) {
    return null;
  }

  const selectedSet = new Set(selectedKeys);
  const clauses: string[] = [];
  const qualifiedColumn = `${alias}.${column}`;

  for (const definition of definitions) {
    if (!selectedSet.has(definition.key)) {
      continue;
    }

    if (definition.includeUnknown) {
      clauses.push(`${qualifiedColumn} IS NULL`);
      continue;
    }

    const parts: string[] = [`${qualifiedColumn} IS NOT NULL`];

    if (definition.min != null) {
      parts.push(`${qualifiedColumn} >= ?`);
      params.push(definition.min);
    }

    if (definition.maxExclusive != null) {
      parts.push(`${qualifiedColumn} < ?`);
      params.push(definition.maxExclusive);
    }

    clauses.push(`(${parts.join(' AND ')})`);
  }

  if (clauses.length === 0) {
    return null;
  }

  return `(${clauses.join(' OR ')})`;
}

export function countNumericBuckets(values: Array<number | null>, definitions: NumericBucketDefinition[]) {
  const counts = new Map<string, number>(definitions.map((definition) => [definition.key, 0]));
  const unknownBucket = definitions.find((definition) => definition.includeUnknown);

  for (const value of values) {
    if (value == null) {
      if (unknownBucket) {
        counts.set(unknownBucket.key, (counts.get(unknownBucket.key) ?? 0) + 1);
      }
      continue;
    }

    const matchingBucket = definitions.find(
      (definition) =>
        !definition.includeUnknown &&
        (definition.min == null || value >= definition.min) &&
        (definition.maxExclusive == null || value < definition.maxExclusive),
    );

    if (!matchingBucket) {
      continue;
    }

    counts.set(matchingBucket.key, (counts.get(matchingBucket.key) ?? 0) + 1);
  }

  return definitions.map((definition) => ({
    key: definition.key,
    label: definition.label,
    count: counts.get(definition.key) ?? 0,
  }));
}
