import type { ArchiveMovie, NumericRangeFilter } from '../../shared/types/archive';
import type { ArchiveFacetsResponse, ArchiveMoviesResponse } from '../../shared/types/api';
import type { SortOption } from './archiveFilters';

const API_BASE = '/api';

export interface ArchiveRequestFilters {
  selectedYears: number[];
  selectedGenres: string[];
  selectedFilmTypes: string[];
  selectedPersonIds: string[];
  selectedCompanyIds: string[];
  budgetFilter: NumericRangeFilter;
  boxOfficeFilter: NumericRangeFilter;
}

interface RequestOptions {
  signal?: AbortSignal;
}

function appendCsv(params: URLSearchParams, key: string, values: Array<string | number>) {
  if (values.length > 0) {
    params.set(key, values.join(','));
  }
}

function appendRangeParams(params: URLSearchParams, prefix: 'budget' | 'boxOffice', filter: NumericRangeFilter) {
  if (filter.knownOnly) {
    params.set(`${prefix}KnownOnly`, 'true');
  }

  if (filter.min != null) {
    params.set(`${prefix}Min`, String(filter.min));
  }

  if (filter.max != null) {
    params.set(`${prefix}Max`, String(filter.max));
  }
}

function buildFilterSearchParams(filters: ArchiveRequestFilters): URLSearchParams {
  const params = new URLSearchParams();

  appendCsv(params, 'years', filters.selectedYears);
  appendCsv(params, 'genres', filters.selectedGenres);
  appendCsv(params, 'filmTypes', filters.selectedFilmTypes);
  appendCsv(params, 'personIds', filters.selectedPersonIds);
  appendCsv(params, 'companyIds', filters.selectedCompanyIds);
  appendRangeParams(params, 'budget', filters.budgetFilter);
  appendRangeParams(params, 'boxOffice', filters.boxOfficeFilter);

  return params;
}

async function fetchJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      Accept: 'application/json',
    },
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json<T>();
}

export async function fetchArchiveMovies(
  filters: ArchiveRequestFilters,
  sort: SortOption,
  page: number,
  pageSize: number,
  options: RequestOptions = {},
): Promise<ArchiveMoviesResponse> {
  const params = buildFilterSearchParams(filters);
  params.set('sort', sort);
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));

  return fetchJson<ArchiveMoviesResponse>(`/archive/movies?${params.toString()}`, options);
}

export async function fetchArchiveMovieById(movieId: number, options: RequestOptions = {}): Promise<ArchiveMovie> {
  return fetchJson<ArchiveMovie>(`/archive/movies/${movieId}`, options);
}

export async function fetchArchiveFacets(filters: ArchiveRequestFilters, options: RequestOptions = {}): Promise<ArchiveFacetsResponse> {
  const params = buildFilterSearchParams(filters);
  const search = params.toString();
  return fetchJson<ArchiveFacetsResponse>(`/archive/facets${search ? `?${search}` : ''}`, options);
}
