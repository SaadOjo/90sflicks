import type { ArchiveMovie, CompanySuggestion, MovieCompanyRole } from '../../shared/types/archive';
import { archiveMovies } from './mockData';

const ROLE_ORDER: MovieCompanyRole[] = ['production', 'distribution'];

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

function buildCompanyIndex(movies: ArchiveMovie[]): CompanySuggestion[] {
  const byName = new Map<string, CompanySuggestion>();

  movies.forEach((movie) => {
    const seenInMovie = new Set<string>();

    movie.companies.forEach((company) => {
      const key = normalize(company.name);
      const current = byName.get(key) ?? {
        id: key,
        name: company.name,
        roles: [],
        movieCount: 0,
      };

      if (!current.roles.includes(company.roleType)) {
        current.roles.push(company.roleType);
        current.roles.sort((left, right) => ROLE_ORDER.indexOf(left) - ROLE_ORDER.indexOf(right));
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

const COMPANY_INDEX = buildCompanyIndex(archiveMovies);

export async function searchCompanies(query: string, limit = 8): Promise<CompanySuggestion[]> {
  const normalizedQuery = normalize(query);
  if (normalizedQuery.length < 2) {
    return [];
  }

  const results = COMPANY_INDEX.map((company) => ({
    company,
    score: scoreMatch(normalizedQuery, normalize(company.name)),
  }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      if (right.company.movieCount !== left.company.movieCount) return right.company.movieCount - left.company.movieCount;
      return left.company.name.localeCompare(right.company.name);
    })
    .slice(0, limit)
    .map((entry) => entry.company);

  return Promise.resolve(results);
}
