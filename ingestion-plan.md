# Ingestion plan

## Best plan

1. Use Wikidata to define the scope: US films with release year 1990-1999
2. Use the Wikidata IMDb ID to pull matching rows from IMDb datasets
3. Save filtered source snapshots as raw files on disk
4. Keep raw files as the source for ingestion and internal processing
5. Use Postgres only for the application schema and app operations

## Why this is the right split

- raw files are reusable if the database schema changes
- the app database can be rebuilt without redownloading
- we can count the import before loading into the final schema
- we keep source-specific quirks out of the app database

## Raw files to keep

- `raw/wikidata/us_90s_movies.ndjson`
- `raw/imdb/title.basics.us_90s.tsv`
- `raw/imdb/title.crew.us_90s.tsv`
- `raw/imdb/title.principals.us_90s.tsv`
- `raw/imdb/name.basics.us_90s.tsv`
- `raw/imdb/title.ratings.us_90s.tsv`
- `raw/manifest.json`

## What we can know before import

Yes. We can know counts before importing into the final schema.

There are two levels:

1. Scope counts from Wikidata
   - total US 1990s films in scope
   - how many have IMDb IDs

2. Exact raw counts after extraction
   - number of movie rows
   - number of filtered IMDb title rows
   - number of principal rows
   - number of unique people rows
   - title type distribution
   - principal role distribution

These are written to `raw/manifest.json` before any app-schema load.

## Current validated scope counts

- total scoped films from Wikidata: 7473
- scoped films with IMDb ID: 7226
- scoped films without IMDb ID: 247

## Current raw extraction counts

- filtered IMDb title basics rows: 7198
- filtered IMDb title crew rows: 7198
- filtered IMDb title principals rows: 136554
- filtered IMDb title ratings rows: 7128
- filtered IMDb name basics rows: 51623

## Current title type distribution from filtered IMDb data

- movie: 4550
- tvMovie: 1614
- video: 577
- short: 292
- tvMiniSeries: 76
- tvEpisode: 61
- tvSpecial: 12
- tvShort: 10
- tvSeries: 5
- videoGame: 1

## Current scope decision

We are keeping all imported title types in the raw data and future app database.
Application-level filtering will decide what is shown or excluded.

This means the data currently includes:
- TV episodes
- TV series
- TV specials
- one video game

Relevant counts:
- strict feature films only: `titleType = 'movie'` -> 4550 titles
- broader movie scope: `titleType IN ('movie', 'tvMovie', 'video')` -> 6741 titles
- broader scope plus shorts: add `short` -> 7033 titles
- full imported raw scope: 7198 IMDb title rows + 247 Wikidata-only rows

## Database setup

Local Postgres installed with Homebrew:
- formula: `postgresql@17`
- service: `brew services start postgresql@17`
- database: `movie_filter`

## Scripts and schema files

- `scripts/setup_postgres.sh`
  - installs Postgres if missing
  - starts the service
  - creates the `movie_filter` database

- `scripts/download_raw_90s.py`
  - downloads the scoped Wikidata movie list
  - filters IMDb datasets down to matching titles and people
  - writes raw files and `raw/manifest.json`
  - `--dry-run` mode fetches scope counts without pulling IMDb data

- `scripts/load_app_from_raw.py`
  - builds canonical app-table CSV files directly from `raw/`
  - can also load those CSV files into Postgres `public`
  - currently targets the singular table names from `postgres-schema.md`

- `postgres-schema.md`
  - documents the planned application schema
  - this markdown file is the schema source of truth until Prisma is introduced

## Current canonical output counts

Current canonical app-load output from `scripts/load_app_from_raw.py`:
- movies: 7472
- genres: 74
- movie_genres: 15885
- people: 40377
- movie_people: 93234
- companies: 786
- movie_companies: 9120

## Current status

Completed:
1. Postgres installed and running locally
2. Raw files downloaded to `raw/`
3. Planned app schema documented in `postgres-schema.md`
4. Canonical app-load script written
5. Old custom schema removed
6. Data loaded into PostgreSQL `public`

Next:
1. Translate the schema into Prisma models later
2. Reconcile Prisma migrations with the existing `public` tables
3. Add app-level filters for allowed title types
