ALTER TABLE movie ADD COLUMN imdb_rating REAL;
ALTER TABLE movie ADD COLUMN imdb_vote_count INTEGER;
CREATE INDEX IF NOT EXISTS movie_imdb_rating_idx ON movie(imdb_rating);
