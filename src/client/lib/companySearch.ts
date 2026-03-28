import type { ArchiveMovie, CompanySuggestion, MovieCompanyRole } from '../../shared/types/archive';
import { archiveMovies } from './mockData';
import { buildEntityIndex, searchEntityIndex } from './entitySearch';

const ROLE_ORDER: MovieCompanyRole[] = ['production', 'distribution'];

function buildCompanyIndex(movies: ArchiveMovie[]): CompanySuggestion[] {
  return buildEntityIndex(
    movies,
    (movie) => movie.companies.map((company) => ({ name: company.name, roleType: company.roleType })),
    ROLE_ORDER,
  );
}

const COMPANY_INDEX = buildCompanyIndex(archiveMovies);

export function searchCompanies(query: string, limit = 8): Promise<CompanySuggestion[]> {
  return searchEntityIndex(COMPANY_INDEX, query, limit);
}
