/// <reference types="@cloudflare/workers-types" />

import type { ArchiveMovie, ArchiveMovieListItem, MovieCompanyCredit, MovieCredit } from '../../shared/types/archive';
import type { ArchiveFacetsResponse, ArchiveFilmTypeFacet, ArchiveMoviesResponse } from '../../shared/types/api';
import {
  BOX_OFFICE_BUCKETS,
  BUDGET_BUCKETS,
  IMDB_RATING_BUCKETS,
  IMDB_VOTE_COUNT_BUCKETS,
  buildNumericBucketClause,
  countNumericBuckets,
} from './numericBuckets';

export type SortOption = 'releaseDate' | 'title' | 'boxOffice' | 'budget' | 'imdbRating';

export interface ArchiveQueryFilters {
  years: number[];
  genres: string[];
  filmTypes: string[];
  personIds: number[];
  companyIds: number[];
  budgetBuckets: string[];
  boxOfficeBuckets: string[];
  imdbRatingBuckets: string[];
  imdbVoteCountBuckets: string[];
  sort: SortOption;
  page: number;
  pageSize: number;
}

interface MovieSummaryRow {
  id: number;
  title: string;
  release_year: number;
  release_date: string | null;
  film_type: string | null;
  box_office: number | null;
  imdb_rating: number | null;
  imdb_vote_count: number | null;
}

interface MovieDetailRow extends MovieSummaryRow {
  budget: number | null;
}

interface GenreRow {
  movieId: number;
  genreName: string;
}

interface CreditRow {
  movieId: number;
  name: string;
  roleType: MovieCredit['roleType'];
  creditOrder: number | null;
}

interface ListCreditRow {
  movieId: number;
  name: string;
  roleType: 'director' | 'cast';
  creditOrder: number | null;
}

interface CompanyRow {
  movieId: number;
  name: string;
  roleType: MovieCompanyCredit['roleType'];
}

const FULL_DECADE_YEARS = Array.from({ length: 10 }, (_, index) => 1990 + index);

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function formatFilmType(value?: string | null): string {
  if (!value) return 'Unknown';

  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function sqlAll<T>(db: D1Database, sql: string, params: unknown[] = []): Promise<D1Result<T>> {
  const statement = params.length > 0 ? db.prepare(sql).bind(...params) : db.prepare(sql);
  return statement.all<T>();
}

function sqlFirst<T>(db: D1Database, sql: string, params: unknown[] = []): Promise<T | null> {
  const statement = params.length > 0 ? db.prepare(sql).bind(...params) : db.prepare(sql);
  return statement.first<T>();
}

function inClause(values: unknown[]): string {
  return values.map(() => '?').join(', ');
}

function parseFilmTypeFilter(values: string[]): { rawValues: string[]; includeUnknown: boolean } {
  const rawValues: string[] = [];
  let includeUnknown = false;

  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    if (normalize(trimmed) === 'unknown') {
      includeUnknown = true;
      continue;
    }
    rawValues.push(trimmed);
  }

  return { rawValues: Array.from(new Set(rawValues)), includeUnknown };
}

function buildMovieWhereClause(
  filters: ArchiveQueryFilters,
  excludedFacet:
    | 'years'
    | 'genres'
    | 'filmTypes'
    | 'budgetBuckets'
    | 'boxOfficeBuckets'
    | 'imdbRatingBuckets'
    | 'imdbVoteCountBuckets'
    | null = null,
): { sql: string; params: unknown[] } {
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (excludedFacet !== 'years' && filters.years.length > 0) {
    clauses.push(`m.release_year IN (${inClause(filters.years)})`);
    params.push(...filters.years);
  }

  if (excludedFacet !== 'genres' && filters.genres.length > 0) {
    clauses.push(`
      EXISTS (
        SELECT 1
        FROM movie_genre mg
        JOIN genre g ON g.id = mg.genre_id
        WHERE mg.movie_id = m.id
          AND g.name IN (${inClause(filters.genres)})
      )
    `.trim());
    params.push(...filters.genres);
  }

  if (excludedFacet !== 'filmTypes' && filters.filmTypes.length > 0) {
    const { rawValues, includeUnknown } = parseFilmTypeFilter(filters.filmTypes);
    const typeClauses: string[] = [];

    if (rawValues.length > 0) {
      typeClauses.push(`m.film_type IN (${inClause(rawValues)})`);
      params.push(...rawValues);
    }

    if (includeUnknown) {
      typeClauses.push('m.film_type IS NULL');
    }

    if (typeClauses.length > 0) {
      clauses.push(`(${typeClauses.join(' OR ')})`);
    }
  }

  if (filters.personIds.length > 0) {
    clauses.push(`
      EXISTS (
        SELECT 1
        FROM movie_person mp
        WHERE mp.movie_id = m.id
          AND mp.person_id IN (${inClause(filters.personIds)})
      )
    `.trim());
    params.push(...filters.personIds);
  }

  if (filters.companyIds.length > 0) {
    clauses.push(`
      EXISTS (
        SELECT 1
        FROM movie_company mc
        WHERE mc.movie_id = m.id
          AND mc.company_id IN (${inClause(filters.companyIds)})
      )
    `.trim());
    params.push(...filters.companyIds);
  }

  if (excludedFacet !== 'budgetBuckets') {
    const budgetClause = buildNumericBucketClause('m', 'budget', filters.budgetBuckets, BUDGET_BUCKETS, params);
    if (budgetClause) {
      clauses.push(budgetClause);
    }
  }

  if (excludedFacet !== 'boxOfficeBuckets') {
    const boxOfficeClause = buildNumericBucketClause('m', 'box_office', filters.boxOfficeBuckets, BOX_OFFICE_BUCKETS, params);
    if (boxOfficeClause) {
      clauses.push(boxOfficeClause);
    }
  }

  if (excludedFacet !== 'imdbRatingBuckets') {
    const imdbRatingClause = buildNumericBucketClause('m', 'imdb_rating', filters.imdbRatingBuckets, IMDB_RATING_BUCKETS, params);
    if (imdbRatingClause) {
      clauses.push(imdbRatingClause);
    }
  }

  if (excludedFacet !== 'imdbVoteCountBuckets') {
    const imdbVoteCountClause = buildNumericBucketClause('m', 'imdb_vote_count', filters.imdbVoteCountBuckets, IMDB_VOTE_COUNT_BUCKETS, params);
    if (imdbVoteCountClause) {
      clauses.push(imdbVoteCountClause);
    }
  }

  return {
    sql: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
    params,
  };
}

function sortClause(sort: SortOption): string {
  switch (sort) {
    case 'title':
      return 'ORDER BY m.title ASC, m.id ASC';
    case 'boxOffice':
      return 'ORDER BY m.box_office IS NULL ASC, m.box_office DESC, m.title ASC';
    case 'budget':
      return 'ORDER BY m.budget IS NULL ASC, m.budget DESC, m.title ASC';
    case 'imdbRating':
      return 'ORDER BY m.imdb_rating IS NULL ASC, m.imdb_rating DESC, m.imdb_vote_count IS NULL ASC, m.imdb_vote_count DESC, m.title ASC';
    case 'releaseDate':
    default:
      return 'ORDER BY m.release_date IS NULL ASC, m.release_date DESC, m.title ASC';
  }
}

function toArchiveMovieListItem(row: MovieSummaryRow): ArchiveMovieListItem {
  return {
    id: row.id,
    title: row.title,
    releaseYear: row.release_year,
    ...(row.release_date ? { releaseDate: row.release_date } : {}),
    ...(row.film_type ? { filmType: row.film_type } : {}),
    ...(row.box_office != null ? { boxOffice: row.box_office } : {}),
    ...(row.imdb_rating != null ? { imdbRating: row.imdb_rating } : {}),
    ...(row.imdb_vote_count != null ? { imdbVoteCount: row.imdb_vote_count } : {}),
    genres: [],
    directors: [],
    mainCast: [],
  };
}

function toArchiveMovie(row: MovieDetailRow): ArchiveMovie {
  return {
    id: row.id,
    title: row.title,
    releaseYear: row.release_year,
    ...(row.release_date ? { releaseDate: row.release_date } : {}),
    ...(row.film_type ? { filmType: row.film_type } : {}),
    ...(row.budget != null ? { budget: row.budget } : {}),
    ...(row.box_office != null ? { boxOffice: row.box_office } : {}),
    ...(row.imdb_rating != null ? { imdbRating: row.imdb_rating } : {}),
    ...(row.imdb_vote_count != null ? { imdbVoteCount: row.imdb_vote_count } : {}),
    genres: [],
    credits: [],
    companies: [],
  };
}

async function hydrateMovieSummaries(db: D1Database, movieIds: number[]): Promise<ArchiveMovieListItem[]> {
  if (movieIds.length === 0) {
    return [];
  }

  const placeholders = inClause(movieIds);

  const [movieRowsResult, genreRowsResult, creditRowsResult] = await Promise.all([
    sqlAll<MovieSummaryRow>(
      db,
      `SELECT id, title, release_year, release_date, film_type, box_office, imdb_rating, imdb_vote_count FROM movie WHERE id IN (${placeholders})`,
      movieIds,
    ),
    sqlAll<GenreRow>(
      db,
      `
        SELECT mg.movie_id AS movieId, g.name AS genreName
        FROM movie_genre mg
        JOIN genre g ON g.id = mg.genre_id
        WHERE mg.movie_id IN (${placeholders})
        ORDER BY g.name ASC
      `,
      movieIds,
    ),
    sqlAll<ListCreditRow>(
      db,
      `
        SELECT mp.movie_id AS movieId, p.name AS name, mp.role_type AS roleType, mp.credit_order AS creditOrder
        FROM movie_person mp
        JOIN person p ON p.id = mp.person_id
        WHERE mp.movie_id IN (${placeholders})
          AND mp.role_type IN ('director', 'cast')
        ORDER BY mp.movie_id ASC,
          CASE mp.role_type
            WHEN 'director' THEN 1
            WHEN 'cast' THEN 2
            ELSE 3
          END ASC,
          COALESCE(mp.credit_order, 999999) ASC,
          p.name ASC
      `,
      movieIds,
    ),
  ]);

  const moviesById = new Map<number, ArchiveMovieListItem>();
  for (const row of movieRowsResult.results ?? []) {
    moviesById.set(row.id, toArchiveMovieListItem(row));
  }

  for (const row of genreRowsResult.results ?? []) {
    moviesById.get(row.movieId)?.genres.push(row.genreName);
  }

  for (const row of creditRowsResult.results ?? []) {
    const movie = moviesById.get(row.movieId);
    if (!movie) continue;

    if (row.roleType === 'director') {
      movie.directors.push(row.name);
      continue;
    }

    if (row.roleType === 'cast' && movie.mainCast.length < 4) {
      movie.mainCast.push(row.name);
    }
  }

  return movieIds.map((movieId) => moviesById.get(movieId)).filter((movie): movie is ArchiveMovieListItem => movie != null);
}

async function hydrateMovieDetails(db: D1Database, movieIds: number[]): Promise<ArchiveMovie[]> {
  if (movieIds.length === 0) {
    return [];
  }

  const placeholders = inClause(movieIds);

  const [movieRowsResult, genreRowsResult, creditRowsResult, companyRowsResult] = await Promise.all([
    sqlAll<MovieDetailRow>(
      db,
      `SELECT id, title, release_year, release_date, film_type, budget, box_office, imdb_rating, imdb_vote_count FROM movie WHERE id IN (${placeholders})`,
      movieIds,
    ),
    sqlAll<GenreRow>(
      db,
      `
        SELECT mg.movie_id AS movieId, g.name AS genreName
        FROM movie_genre mg
        JOIN genre g ON g.id = mg.genre_id
        WHERE mg.movie_id IN (${placeholders})
        ORDER BY g.name ASC
      `,
      movieIds,
    ),
    sqlAll<CreditRow>(
      db,
      `
        SELECT mp.movie_id AS movieId, p.name AS name, mp.role_type AS roleType, mp.credit_order AS creditOrder
        FROM movie_person mp
        JOIN person p ON p.id = mp.person_id
        WHERE mp.movie_id IN (${placeholders})
        ORDER BY mp.movie_id ASC,
          CASE mp.role_type
            WHEN 'director' THEN 1
            WHEN 'writer' THEN 2
            WHEN 'producer' THEN 3
            WHEN 'cast' THEN 4
            ELSE 5
          END ASC,
          COALESCE(mp.credit_order, 999999) ASC,
          p.name ASC
      `,
      movieIds,
    ),
    sqlAll<CompanyRow>(
      db,
      `
        SELECT mc.movie_id AS movieId, c.name AS name, mc.role_type AS roleType
        FROM movie_company mc
        JOIN company c ON c.id = mc.company_id
        WHERE mc.movie_id IN (${placeholders})
        ORDER BY mc.movie_id ASC,
          CASE mc.role_type
            WHEN 'distribution' THEN 1
            WHEN 'production' THEN 2
            ELSE 3
          END ASC,
          c.name ASC
      `,
      movieIds,
    ),
  ]);

  const moviesById = new Map<number, ArchiveMovie>();
  for (const row of movieRowsResult.results ?? []) {
    moviesById.set(row.id, toArchiveMovie(row));
  }

  for (const row of genreRowsResult.results ?? []) {
    moviesById.get(row.movieId)?.genres.push(row.genreName);
  }

  for (const row of creditRowsResult.results ?? []) {
    moviesById.get(row.movieId)?.credits.push({
      name: row.name,
      roleType: row.roleType,
      ...(row.creditOrder != null ? { creditOrder: row.creditOrder } : {}),
    });
  }

  for (const row of companyRowsResult.results ?? []) {
    moviesById.get(row.movieId)?.companies.push({
      name: row.name,
      roleType: row.roleType,
    });
  }

  return movieIds.map((movieId) => moviesById.get(movieId)).filter((movie): movie is ArchiveMovie => movie != null);
}

export function parseArchiveFilters(url: URL): ArchiveQueryFilters {
  const parseCsvNumbers = (key: string) =>
    (url.searchParams.get(key) ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value));

  const parseCsvStrings = (key: string) =>
    (url.searchParams.get(key) ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

  const parseBooleanParam = (key: string) => url.searchParams.get(key) === 'true';

  const sortValue = (url.searchParams.get('sort') ?? 'releaseDate') as SortOption;
  const allowedSortValues: SortOption[] = ['releaseDate', 'title', 'boxOffice', 'budget', 'imdbRating'];
  const sort = allowedSortValues.includes(sortValue) ? sortValue : 'releaseDate';

  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') ?? '25') || 25));

  return {
    years: parseCsvNumbers('years'),
    genres: parseCsvStrings('genres'),
    filmTypes: parseCsvStrings('filmTypes'),
    personIds: parseCsvNumbers('personIds'),
    companyIds: parseCsvNumbers('companyIds'),
    budgetBuckets: parseCsvStrings('budgetBuckets'),
    boxOfficeBuckets: parseCsvStrings('boxOfficeBuckets'),
    imdbRatingBuckets: parseCsvStrings('imdbRatingBuckets'),
    imdbVoteCountBuckets: parseCsvStrings('imdbVoteCountBuckets'),
    sort,
    page,
    pageSize,
  };
}

export async function getArchiveMovies(db: D1Database, filters: ArchiveQueryFilters): Promise<ArchiveMoviesResponse> {
  const { sql, params } = buildMovieWhereClause(filters);
  const totalRow = await sqlFirst<{ totalItems: number }>(db, `SELECT COUNT(*) AS totalItems FROM movie m ${sql}`, params);
  const totalItems = totalRow?.totalItems ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / filters.pageSize));
  const offset = (filters.page - 1) * filters.pageSize;

  const idRows = await sqlAll<{ id: number }>(
    db,
    `SELECT m.id FROM movie m ${sql} ${sortClause(filters.sort)} LIMIT ? OFFSET ?`,
    [...params, filters.pageSize, offset],
  );

  const movieIds = (idRows.results ?? []).map((row) => row.id);
  const items = await hydrateMovieSummaries(db, movieIds);

  return {
    items,
    totalItems,
    totalPages,
    page: filters.page,
    pageSize: filters.pageSize,
  };
}

export async function getArchiveMovieById(db: D1Database, movieId: number): Promise<ArchiveMovie | null> {
  const movies = await hydrateMovieDetails(db, [movieId]);
  return movies[0] ?? null;
}

export async function getArchiveFacets(db: D1Database, filters: ArchiveQueryFilters): Promise<ArchiveFacetsResponse> {
  const [indexedRow, yearsResult, genresResult, filmTypesResult, budgetRowsResult, boxOfficeRowsResult, imdbRatingRowsResult, imdbVoteCountRowsResult] = await Promise.all([
    sqlFirst<{ indexedCount: number }>(db, 'SELECT COUNT(*) AS indexedCount FROM movie'),
    (async () => {
      const built = buildMovieWhereClause(filters, 'years');
      return sqlAll<{ year: number; count: number }>(
        db,
        `SELECT m.release_year AS year, COUNT(*) AS count FROM movie m ${built.sql} GROUP BY m.release_year ORDER BY m.release_year ASC`,
        built.params,
      );
    })(),
    (async () => {
      const built = buildMovieWhereClause(filters, 'genres');
      return sqlAll<{ name: string; count: number }>(
        db,
        `
          SELECT g.name AS name, COUNT(DISTINCT m.id) AS count
          FROM movie m
          JOIN movie_genre mg ON mg.movie_id = m.id
          JOIN genre g ON g.id = mg.genre_id
          ${built.sql}
          GROUP BY g.name
          ORDER BY g.name ASC
        `,
        built.params,
      );
    })(),
    (async () => {
      const built = buildMovieWhereClause(filters, 'filmTypes');
      return sqlAll<{ value: string | null; count: number }>(
        db,
        `SELECT m.film_type AS value, COUNT(*) AS count FROM movie m ${built.sql} GROUP BY m.film_type ORDER BY m.film_type ASC`,
        built.params,
      );
    })(),
    (async () => {
      const built = buildMovieWhereClause(filters, 'budgetBuckets');
      return sqlAll<{ value: number | null }>(db, `SELECT m.budget AS value FROM movie m ${built.sql}`, built.params);
    })(),
    (async () => {
      const built = buildMovieWhereClause(filters, 'boxOfficeBuckets');
      return sqlAll<{ value: number | null }>(db, `SELECT m.box_office AS value FROM movie m ${built.sql}`, built.params);
    })(),
    (async () => {
      const built = buildMovieWhereClause(filters, 'imdbRatingBuckets');
      return sqlAll<{ value: number | null }>(db, `SELECT m.imdb_rating AS value FROM movie m ${built.sql}`, built.params);
    })(),
    (async () => {
      const built = buildMovieWhereClause(filters, 'imdbVoteCountBuckets');
      return sqlAll<{ value: number | null }>(db, `SELECT m.imdb_vote_count AS value FROM movie m ${built.sql}`, built.params);
    })(),
  ]);

  const yearCounts = new Map<number, number>();
  for (const row of yearsResult.results ?? []) {
    yearCounts.set(row.year, row.count);
  }

  const filmTypes: ArchiveFilmTypeFacet[] = (filmTypesResult.results ?? []).map((row) => ({
    value: row.value ?? 'unknown',
    label: formatFilmType(row.value),
    count: row.count,
  }));

  return {
    indexedCount: indexedRow?.indexedCount ?? 0,
    years: FULL_DECADE_YEARS.map((year) => ({ year, count: yearCounts.get(year) ?? 0 })),
    genres: (genresResult.results ?? []).map((row) => ({ name: row.name, count: row.count })),
    filmTypes,
    budgetBuckets: countNumericBuckets((budgetRowsResult.results ?? []).map((row) => row.value), BUDGET_BUCKETS),
    boxOfficeBuckets: countNumericBuckets((boxOfficeRowsResult.results ?? []).map((row) => row.value), BOX_OFFICE_BUCKETS),
    imdbRatingBuckets: countNumericBuckets((imdbRatingRowsResult.results ?? []).map((row) => row.value), IMDB_RATING_BUCKETS),
    imdbVoteCountBuckets: countNumericBuckets((imdbVoteCountRowsResult.results ?? []).map((row) => row.value), IMDB_VOTE_COUNT_BUCKETS),
  };
}
