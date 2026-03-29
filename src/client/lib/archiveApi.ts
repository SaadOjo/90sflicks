import type { ArchiveMovie } from '../../shared/types/archive';
import type { ArchiveFacetsResponse, ArchiveMoviesResponse } from '../../shared/types/api';
import type { SortOption } from './archiveFilters';

const API_BASE = '/api';

export interface ArchiveRequestFilters {
  selectedYears: number[];
  selectedGenres: string[];
  selectedFilmTypes: string[];
  selectedPersonIds: string[];
  selectedCompanyIds: string[];
  selectedBudgetBuckets: string[];
  selectedBoxOfficeBuckets: string[];
  selectedImdbRatingBuckets: string[];
  selectedImdbVoteCountBuckets: string[];
}

interface RequestOptions {
  signal?: AbortSignal;
}

function appendCsv(params: URLSearchParams, key: string, values: Array<string | number>) {
  if (values.length > 0) {
    params.set(key, values.join(','));
  }
}

function buildFilterSearchParams(filters: ArchiveRequestFilters): URLSearchParams {
  const params = new URLSearchParams();

  appendCsv(params, 'years', filters.selectedYears);
  appendCsv(params, 'genres', filters.selectedGenres);
  appendCsv(params, 'filmTypes', filters.selectedFilmTypes);
  appendCsv(params, 'personIds', filters.selectedPersonIds);
  appendCsv(params, 'companyIds', filters.selectedCompanyIds);
  appendCsv(params, 'budgetBuckets', filters.selectedBudgetBuckets);
  appendCsv(params, 'boxOfficeBuckets', filters.selectedBoxOfficeBuckets);
  appendCsv(params, 'imdbRatingBuckets', filters.selectedImdbRatingBuckets);
  appendCsv(params, 'imdbVoteCountBuckets', filters.selectedImdbVoteCountBuckets);

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
