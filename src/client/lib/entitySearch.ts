import type { ArchiveMovie } from '../../shared/types/archive';

export interface EntityIndexEntry<TRole extends string> {
  id: string;
  name: string;
  roles: TRole[];
  movieCount: number;
}

interface EntityCredit<TRole extends string> {
  name: string;
  roleType: TRole;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function isSubsequence(query: string, target: string): boolean {
  let queryIndex = 0;

  for (let index = 0; index < target.length && queryIndex < query.length; index += 1) {
    if (target[index] === query[queryIndex]) {
      queryIndex += 1;
    }
  }

  return queryIndex === query.length;
}

function scoreMatch(query: string, candidate: string): number {
  if (candidate === query) return 100;
  if (candidate.startsWith(query)) return 80;
  if (candidate.includes(query)) return 60;

  const candidateTokens = candidate.split(/\s+/);
  if (candidateTokens.some((token) => token.startsWith(query))) return 45;
  if (isSubsequence(query, candidate)) return 25;

  return 0;
}

export function buildEntityIndex<TRole extends string>(
  movies: ArchiveMovie[],
  getCredits: (movie: ArchiveMovie) => EntityCredit<TRole>[],
  roleOrder: TRole[],
): EntityIndexEntry<TRole>[] {
  const byName = new Map<string, EntityIndexEntry<TRole>>();

  movies.forEach((movie) => {
    const seenInMovie = new Set<string>();

    getCredits(movie).forEach((credit) => {
      const key = normalize(credit.name);
      const current = byName.get(key) ?? {
        id: key,
        name: credit.name,
        roles: [],
        movieCount: 0,
      };

      if (!current.roles.includes(credit.roleType)) {
        current.roles.push(credit.roleType);
        current.roles.sort((left, right) => roleOrder.indexOf(left) - roleOrder.indexOf(right));
      }

      if (!seenInMovie.has(key)) {
        current.movieCount += 1;
        seenInMovie.add(key);
      }

      byName.set(key, current);
    });
  });

  return Array.from(byName.values()).sort((left, right) => left.name.localeCompare(right.name));
}

export async function searchEntityIndex<TRole extends string>(
  index: EntityIndexEntry<TRole>[],
  query: string,
  limit = 8,
): Promise<EntityIndexEntry<TRole>[]> {
  const normalizedQuery = normalize(query);
  if (normalizedQuery.length < 2) {
    return [];
  }

  const results = index
    .map((entry) => ({
      entry,
      score: scoreMatch(normalizedQuery, normalize(entry.name)),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      if (right.entry.movieCount !== left.entry.movieCount) return right.entry.movieCount - left.entry.movieCount;
      return left.entry.name.localeCompare(right.entry.name);
    })
    .slice(0, limit)
    .map((item) => item.entry);

  return Promise.resolve(results);
}
