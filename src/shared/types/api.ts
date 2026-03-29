import type { ArchiveMovie, ArchiveMovieListItem, CompanySuggestion, PersonSuggestion } from './archive';

export interface ArchiveYearFacet {
  year: number;
  count: number;
}

export interface ArchiveGenreFacet {
  name: string;
  count: number;
}

export interface ArchiveFilmTypeFacet {
  value: string;
  label: string;
  count: number;
}

export interface ArchiveNumericBucketFacet {
  key: string;
  label: string;
  count: number;
}

export interface ArchiveFacetsResponse {
  indexedCount: number;
  years: ArchiveYearFacet[];
  genres: ArchiveGenreFacet[];
  filmTypes: ArchiveFilmTypeFacet[];
  budgetBuckets: ArchiveNumericBucketFacet[];
  boxOfficeBuckets: ArchiveNumericBucketFacet[];
  imdbRatingBuckets: ArchiveNumericBucketFacet[];
  imdbVoteCountBuckets: ArchiveNumericBucketFacet[];
}

export interface ArchiveMoviesResponse {
  items: ArchiveMovieListItem[];
  totalItems: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

export interface ArchiveMovieResponse extends ArchiveMovie {}

export interface CompanySearchIndexResponse {
  items: CompanySuggestion[];
}

export interface PeopleSearchIndexResponse {
  prefix: string;
  items: PersonSuggestion[];
}
