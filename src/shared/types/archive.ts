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
