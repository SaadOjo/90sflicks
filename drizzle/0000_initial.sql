PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS movie (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  release_year INTEGER NOT NULL,
  release_date TEXT,
  film_type TEXT,
  budget INTEGER,
  box_office INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS genre (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS person (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS company (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS movie_genre (
  movie_id INTEGER NOT NULL,
  genre_id INTEGER NOT NULL,
  PRIMARY KEY (movie_id, genre_id),
  FOREIGN KEY (movie_id) REFERENCES movie(id) ON DELETE CASCADE,
  FOREIGN KEY (genre_id) REFERENCES genre(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS movie_person (
  movie_id INTEGER NOT NULL,
  person_id INTEGER NOT NULL,
  role_type TEXT NOT NULL CHECK (role_type IN ('director', 'writer', 'producer', 'cast')),
  credit_order INTEGER,
  PRIMARY KEY (movie_id, person_id, role_type),
  FOREIGN KEY (movie_id) REFERENCES movie(id) ON DELETE CASCADE,
  FOREIGN KEY (person_id) REFERENCES person(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS movie_company (
  movie_id INTEGER NOT NULL,
  company_id INTEGER NOT NULL,
  role_type TEXT NOT NULL CHECK (role_type IN ('production', 'distribution')),
  PRIMARY KEY (movie_id, company_id, role_type),
  FOREIGN KEY (movie_id) REFERENCES movie(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS movie_release_year_idx ON movie(release_year);
CREATE INDEX IF NOT EXISTS movie_film_type_idx ON movie(film_type);
CREATE INDEX IF NOT EXISTS person_name_idx ON person(name);
CREATE INDEX IF NOT EXISTS company_name_idx ON company(name);
CREATE INDEX IF NOT EXISTS movie_genre_genre_id_idx ON movie_genre(genre_id);
CREATE INDEX IF NOT EXISTS movie_person_person_id_role_type_idx ON movie_person(person_id, role_type);
CREATE INDEX IF NOT EXISTS movie_person_movie_id_role_type_idx ON movie_person(movie_id, role_type);
CREATE INDEX IF NOT EXISTS movie_company_company_id_role_type_idx ON movie_company(company_id, role_type);
