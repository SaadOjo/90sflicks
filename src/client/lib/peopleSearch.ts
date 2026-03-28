import type { ArchiveMovie, MoviePersonRole, PersonSuggestion } from '../../shared/types/archive';
import { archiveMovies } from './mockData';
import { buildEntityIndex, searchEntityIndex } from './entitySearch';

const ROLE_ORDER: MoviePersonRole[] = ['director', 'writer', 'producer', 'cast'];

function buildPeopleIndex(movies: ArchiveMovie[]): PersonSuggestion[] {
  return buildEntityIndex(
    movies,
    (movie) => movie.credits.map((credit) => ({ name: credit.name, roleType: credit.roleType })),
    ROLE_ORDER,
  );
}

const PEOPLE_INDEX = buildPeopleIndex(archiveMovies);

export function searchPeople(query: string, limit = 8): Promise<PersonSuggestion[]> {
  return searchEntityIndex(PEOPLE_INDEX, query, limit);
}
