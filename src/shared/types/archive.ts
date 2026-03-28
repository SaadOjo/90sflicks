export type MoviePersonRole = 'director' | 'writer' | 'producer' | 'cast';
export type MovieCompanyRole = 'production' | 'distribution';

export interface MovieCredit {
  name: string;
  roleType: MoviePersonRole;
  creditOrder?: number;
}

export interface MovieCompanyCredit {
  name: string;
  roleType: MovieCompanyRole;
}

export interface PersonSuggestion {
  id: string;
  name: string;
  roles: MoviePersonRole[];
  movieCount: number;
}

export interface CompanySuggestion {
  id: string;
  name: string;
  roles: MovieCompanyRole[];
  movieCount: number;
}

export interface NumericRangeFilter {
  knownOnly: boolean;
  min?: number;
  max?: number;
}

export interface ArchiveMovieListItem {
  id: number;
  title: string;
  releaseYear: number;
  releaseDate?: string;
  filmType?: string;
  boxOffice?: number;
  genres: string[];
  directors: string[];
  mainCast: string[];
}

export interface ArchiveMovie {
  id: number;
  title: string;
  releaseYear: number;
  releaseDate?: string;
  filmType?: string;
  budget?: number;
  boxOffice?: number;
  genres: string[];
  credits: MovieCredit[];
  companies: MovieCompanyCredit[];
}
