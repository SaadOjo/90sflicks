import { index, integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const movie = sqliteTable(
  'movie',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    releaseYear: integer('release_year').notNull(),
    releaseDate: text('release_date'),
    filmType: text('film_type'),
    budget: integer('budget'),
    boxOffice: integer('box_office'),
    imdbRating: real('imdb_rating'),
    imdbVoteCount: integer('imdb_vote_count'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('movie_release_year_idx').on(table.releaseYear),
    index('movie_film_type_idx').on(table.filmType),
    index('movie_imdb_rating_idx').on(table.imdbRating),
  ],
);

export const genre = sqliteTable('genre', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
});

export const person = sqliteTable(
  'person',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [index('person_name_idx').on(table.name)],
);

export const company = sqliteTable(
  'company',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull().unique(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [index('company_name_idx').on(table.name)],
);

export const movieGenre = sqliteTable(
  'movie_genre',
  {
    movieId: integer('movie_id')
      .notNull()
      .references(() => movie.id, { onDelete: 'cascade' }),
    genreId: integer('genre_id')
      .notNull()
      .references(() => genre.id, { onDelete: 'restrict' }),
  },
  (table) => [primaryKey({ columns: [table.movieId, table.genreId] }), index('movie_genre_genre_id_idx').on(table.genreId)],
);

export const moviePerson = sqliteTable(
  'movie_person',
  {
    movieId: integer('movie_id')
      .notNull()
      .references(() => movie.id, { onDelete: 'cascade' }),
    personId: integer('person_id')
      .notNull()
      .references(() => person.id, { onDelete: 'restrict' }),
    roleType: text('role_type', { enum: ['director', 'writer', 'producer', 'cast'] }).notNull(),
    creditOrder: integer('credit_order'),
  },
  (table) => [
    primaryKey({ columns: [table.movieId, table.personId, table.roleType] }),
    index('movie_person_person_id_role_type_idx').on(table.personId, table.roleType),
    index('movie_person_movie_id_role_type_idx').on(table.movieId, table.roleType),
  ],
);

export const movieCompany = sqliteTable(
  'movie_company',
  {
    movieId: integer('movie_id')
      .notNull()
      .references(() => movie.id, { onDelete: 'cascade' }),
    companyId: integer('company_id')
      .notNull()
      .references(() => company.id, { onDelete: 'restrict' }),
    roleType: text('role_type', { enum: ['production', 'distribution'] }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.movieId, table.companyId, table.roleType] }),
    index('movie_company_company_id_role_type_idx').on(table.companyId, table.roleType),
  ],
);
