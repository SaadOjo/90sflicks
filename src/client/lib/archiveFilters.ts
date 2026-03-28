import type { ArchiveMovie, NumericRangeFilter } from '../../shared/types/archive';
import { formatFilmType } from './formatters';

export interface YearOption {
  year: number;
  count: number;
}

export interface SelectOption {
  name: string;
  count: number;
}

export type SortOption = 'releaseDate' | 'title' | 'boxOffice' | 'budget';

export interface ArchiveMovieFilters {
  selectedYears: number[];
  selectedGenres: string[];
  selectedFilmTypes: string[];
  selectedPeopleNames: string[];
  selectedCompanyNames: string[];
  budgetFilter: NumericRangeFilter;
  boxOfficeFilter: NumericRangeFilter;
  sortValue: SortOption;
}

export function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function matchesNumericRange(value: number | undefined, filter: NumericRangeFilter): boolean {
  if (filter.knownOnly && value == null) {
    return false;
  }

  if (filter.min != null || filter.max != null) {
    if (value == null) return false;
    if (filter.min != null && value < filter.min) return false;
    if (filter.max != null && value > filter.max) return false;
  }

  return true;
}

export function buildYearOptions(movies: ArchiveMovie[], years: number[]): YearOption[] {
  const counts = new Map<number, number>();

  movies.forEach((movie) => {
    counts.set(movie.releaseYear, (counts.get(movie.releaseYear) ?? 0) + 1);
  });

  return years.map((year) => ({ year, count: counts.get(year) ?? 0 }));
}

export function buildGenreOptions(movies: ArchiveMovie[]): SelectOption[] {
  const counts = new Map<string, number>();

  movies.forEach((movie) => {
    movie.genres.forEach((genre) => {
      counts.set(genre, (counts.get(genre) ?? 0) + 1);
    });
  });

  return Array.from(counts.entries())
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([name, count]) => ({ name, count }));
}

export function buildTypeOptions(movies: ArchiveMovie[]): SelectOption[] {
  const counts = new Map<string, number>();

  movies.forEach((movie) => {
    const typeName = formatFilmType(movie.filmType);
    counts.set(typeName, (counts.get(typeName) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([name, count]) => ({ name, count }));
}

export function filterArchiveMovies(movies: ArchiveMovie[], filters: ArchiveMovieFilters): ArchiveMovie[] {
  const filtered = movies.filter((movie) => {
    const yearMatch = filters.selectedYears.length === 0 || filters.selectedYears.includes(movie.releaseYear);
    const genreMatch = filters.selectedGenres.length === 0 || filters.selectedGenres.some((genre) => movie.genres.includes(genre));
    const filmTypeLabel = formatFilmType(movie.filmType);
    const filmTypeMatch = filters.selectedFilmTypes.length === 0 || filters.selectedFilmTypes.includes(filmTypeLabel);
    const peopleMatch =
      filters.selectedPeopleNames.length === 0 ||
      movie.credits.some((credit) => filters.selectedPeopleNames.includes(normalize(credit.name)));
    const companyMatch =
      filters.selectedCompanyNames.length === 0 ||
      movie.companies.some((company) => filters.selectedCompanyNames.includes(normalize(company.name)));
    const budgetMatch = matchesNumericRange(movie.budget, filters.budgetFilter);
    const boxOfficeMatch = matchesNumericRange(movie.boxOffice, filters.boxOfficeFilter);

    return yearMatch && genreMatch && filmTypeMatch && peopleMatch && companyMatch && budgetMatch && boxOfficeMatch;
  });

  filtered.sort((left, right) => {
    switch (filters.sortValue) {
      case 'title':
        return left.title.localeCompare(right.title);
      case 'boxOffice':
        return (right.boxOffice ?? -1) - (left.boxOffice ?? -1);
      case 'budget':
        return (right.budget ?? -1) - (left.budget ?? -1);
      case 'releaseDate':
      default:
        return (right.releaseDate ?? '').localeCompare(left.releaseDate ?? '');
    }
  });

  return filtered;
}
