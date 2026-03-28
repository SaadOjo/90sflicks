#!/usr/bin/env python3
import argparse
import csv
import json
import os
import subprocess
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

RAW_DIR = Path("raw")
BUILD_DIR = Path("build/app_load")
PSQL = os.environ.get("PSQL", "/opt/homebrew/opt/postgresql@17/bin/psql")
DB_NAME = os.environ.get("MOVIE_FILTER_DB", "movie_filter")
CAST_CATEGORIES = {"actor", "actress", "self"}


def read_tsv(path: Path):
    with path.open("r", encoding="utf-8", newline="") as f:
        yield from csv.DictReader(f, delimiter="\t")


def nullify(value):
    if value in (None, "", "\\N"):
        return None
    return value


def parse_int(value):
    value = nullify(value)
    if value is None:
        return None
    try:
        return int(float(value))
    except ValueError:
        return None


def parse_date(value):
    value = nullify(value)
    if value is None:
        return None
    return value[:10]


def split_csv(value):
    value = nullify(value)
    if value is None:
        return []
    return [part.strip() for part in value.split(",") if part.strip()]


def normalize_key(value: str):
    return " ".join(value.strip().split()).casefold()


def load_wikidata_movies():
    movies = {}
    by_imdb = defaultdict(list)
    path = RAW_DIR / "wikidata" / "us_90s_movies.ndjson"
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            movie = json.loads(line)
            movies[movie["wikidata_id"]] = movie
            imdb_id = movie.get("imdb_id")
            if imdb_id:
                by_imdb[imdb_id].append(movie)
    return movies, by_imdb


def load_imdb_basics():
    out = {}
    for row in read_tsv(RAW_DIR / "imdb" / "title.basics.us_90s.tsv"):
        out[row["tconst"]] = row
    return out


def load_imdb_crew():
    out = {}
    for row in read_tsv(RAW_DIR / "imdb" / "title.crew.us_90s.tsv"):
        out[row["tconst"]] = row
    return out


def load_imdb_names():
    out = {}
    for row in read_tsv(RAW_DIR / "imdb" / "name.basics.us_90s.tsv"):
        out[row["nconst"]] = row
    return out


def load_imdb_cast():
    out = defaultdict(list)
    for row in read_tsv(RAW_DIR / "imdb" / "title.principals.us_90s.tsv"):
        category = nullify(row.get("category"))
        if category not in CAST_CATEGORIES:
            continue
        nconst = nullify(row.get("nconst"))
        if not nconst:
            continue
        out[row["tconst"]].append({
            "nconst": nconst,
            "ordering": parse_int(row.get("ordering")),
        })
    for tconst in out:
        out[tconst].sort(key=lambda item: (item["ordering"] is None, item["ordering"] or 10**9, item["nconst"]))
    return out


class IdMap:
    def __init__(self, start=1):
        self.next_id = start
        self.by_key = {}

    def get_or_create(self, key):
        current = self.by_key.get(key)
        if current is not None:
            return current
        current = self.next_id
        self.by_key[key] = current
        self.next_id += 1
        return current


def earliest_date(movies):
    dates = []
    for movie in movies:
        for release_date in movie.get("release_dates", []):
            parsed = parse_date(release_date)
            if parsed:
                dates.append(parsed)
    return min(dates) if dates else None


def first_non_null(movies, field):
    for movie in movies:
        value = movie.get(field)
        if nullify(value) is not None:
            return value
    return None


def unique_preserve_order(values):
    seen = set()
    out = []
    for value in values:
        if not value:
            continue
        key = normalize_key(value)
        if key in seen:
            continue
        seen.add(key)
        out.append(value)
    return out


def build_app_rows():
    wikidata_movies, wikidata_by_imdb = load_wikidata_movies()
    imdb_basics = load_imdb_basics()
    imdb_crew = load_imdb_crew()
    imdb_names = load_imdb_names()
    imdb_cast = load_imdb_cast()

    movie_ids = IdMap()
    genre_ids = IdMap()
    people_ids = IdMap()
    company_ids = IdMap()

    now = datetime.now(timezone.utc).isoformat()

    movie_rows = []
    genre_rows = []
    movie_genre_rows = []
    person_rows = []
    movie_person_rows = []
    company_rows = []
    movie_company_rows = []

    inserted_genres = set()
    inserted_people = set()
    inserted_companies = set()

    processed_wikidata_ids = set()

    def ensure_genre(name):
        key = normalize_key(name)
        genre_id = genre_ids.get_or_create(key)
        if genre_id not in inserted_genres:
            genre_rows.append({"id": genre_id, "name": name})
            inserted_genres.add(genre_id)
        return genre_id

    def ensure_person(person_key, name):
        person_id = people_ids.get_or_create(person_key)
        if person_id not in inserted_people:
            person_rows.append({"id": person_id, "name": name, "created_at": now, "updated_at": now})
            inserted_people.add(person_id)
        return person_id

    def ensure_company(name):
        key = normalize_key(name)
        company_id = company_ids.get_or_create(key)
        if company_id not in inserted_companies:
            company_rows.append({"id": company_id, "name": name, "created_at": now, "updated_at": now})
            inserted_companies.add(company_id)
        return company_id

    def add_movie_person(movie_id, person_id, role_type, credit_order=None):
        movie_person_rows.append({
            "movie_id": movie_id,
            "person_id": person_id,
            "role_type": role_type,
            "credit_order": credit_order,
        })

    def add_movie(imdb_id=None, wikidata_group=None, wikidata_movie=None):
        if imdb_id:
            movie_key = f"imdb:{imdb_id}"
            basics = imdb_basics.get(imdb_id)
            wd_movies = sorted(wikidata_group or [], key=lambda m: m["wikidata_id"])
            for wd in wd_movies:
                processed_wikidata_ids.add(wd["wikidata_id"])
            title = nullify(basics.get("primaryTitle")) if basics else None
            if not title:
                title = wd_movies[0]["title"] if wd_movies else None
            release_year = parse_int(basics.get("startYear")) if basics else None
            if release_year is None and wd_movies:
                release_year = wd_movies[0].get("release_year")
            release_date = earliest_date(wd_movies)
            film_type = nullify(basics.get("titleType")) if basics else None
            budget = parse_int(first_non_null(wd_movies, "budget"))
            box_office = parse_int(first_non_null(wd_movies, "box_office"))
            genre_names = split_csv(basics.get("genres")) if basics and nullify(basics.get("genres")) else []
            if not genre_names:
                genre_names = unique_preserve_order(
                    genre
                    for wd in wd_movies
                    for genre in wd.get("genres", [])
                )
            producers = unique_preserve_order(
                producer
                for wd in wd_movies
                for producer in wd.get("producers", [])
            )
            production_companies = unique_preserve_order(
                company
                for wd in wd_movies
                for company in wd.get("production_companies", [])
            )
            distributors = unique_preserve_order(
                company
                for wd in wd_movies
                for company in wd.get("distributors", [])
            )
            crew = imdb_crew.get(imdb_id, {})
            directors = split_csv(crew.get("directors"))
            writers = split_csv(crew.get("writers"))
            cast = imdb_cast.get(imdb_id, [])
        else:
            wd = wikidata_movie
            movie_key = f"wikidata:{wd['wikidata_id']}"
            processed_wikidata_ids.add(wd["wikidata_id"])
            title = wd["title"]
            release_year = wd.get("release_year")
            release_date = min(wd.get("release_dates", [])) if wd.get("release_dates") else None
            film_type = None
            budget = parse_int(wd.get("budget"))
            box_office = parse_int(wd.get("box_office"))
            genre_names = unique_preserve_order(wd.get("genres", []))
            producers = unique_preserve_order(wd.get("producers", []))
            production_companies = unique_preserve_order(wd.get("production_companies", []))
            distributors = unique_preserve_order(wd.get("distributors", []))
            directors = []
            writers = []
            cast = []

        if not title or release_year is None:
            return

        movie_id = movie_ids.get_or_create(movie_key)
        movie_rows.append({
            "id": movie_id,
            "title": title,
            "release_year": release_year,
            "release_date": release_date,
            "film_type": film_type,
            "budget": budget,
            "box_office": box_office,
            "created_at": now,
            "updated_at": now,
        })

        seen_movie_genres = set()
        for genre_name in genre_names:
            genre_id = ensure_genre(genre_name)
            pair = (movie_id, genre_id)
            if pair not in seen_movie_genres:
                movie_genre_rows.append({"movie_id": movie_id, "genre_id": genre_id})
                seen_movie_genres.add(pair)

        for index, nconst in enumerate(directors, start=1):
            name = imdb_names.get(nconst, {}).get("primaryName") or nconst
            person_id = ensure_person(f"imdb:{nconst}", name)
            add_movie_person(movie_id, person_id, "director", index)

        for index, nconst in enumerate(writers, start=1):
            name = imdb_names.get(nconst, {}).get("primaryName") or nconst
            person_id = ensure_person(f"imdb:{nconst}", name)
            add_movie_person(movie_id, person_id, "writer", index)

        seen_cast_people = set()
        for cast_row in cast:
            nconst = cast_row["nconst"]
            if nconst in seen_cast_people:
                continue
            seen_cast_people.add(nconst)
            name = imdb_names.get(nconst, {}).get("primaryName") or nconst
            person_id = ensure_person(f"imdb:{nconst}", name)
            add_movie_person(movie_id, person_id, "cast", cast_row.get("ordering"))

        for index, producer_name in enumerate(producers, start=1):
            person_id = ensure_person(f"producer-label:{normalize_key(producer_name)}", producer_name)
            add_movie_person(movie_id, person_id, "producer", index)

        seen_companies = set()
        for company_name in production_companies:
            company_id = ensure_company(company_name)
            pair = (movie_id, company_id, "production")
            if pair not in seen_companies:
                movie_company_rows.append({"movie_id": movie_id, "company_id": company_id, "role_type": "production"})
                seen_companies.add(pair)

        for company_name in distributors:
            company_id = ensure_company(company_name)
            pair = (movie_id, company_id, "distribution")
            if pair not in seen_companies:
                movie_company_rows.append({"movie_id": movie_id, "company_id": company_id, "role_type": "distribution"})
                seen_companies.add(pair)

    for imdb_id in sorted(imdb_basics.keys()):
        add_movie(imdb_id=imdb_id, wikidata_group=wikidata_by_imdb.get(imdb_id, []))

    for wikidata_id in sorted(wikidata_movies.keys()):
        if wikidata_id in processed_wikidata_ids:
            continue
        add_movie(wikidata_movie=wikidata_movies[wikidata_id])

    movie_person_rows = list({
        (row["movie_id"], row["person_id"], row["role_type"]): row
        for row in movie_person_rows
    }.values())

    movie_company_rows = list({
        (row["movie_id"], row["company_id"], row["role_type"]): row
        for row in movie_company_rows
    }.values())

    return {
        "movie": sorted(movie_rows, key=lambda row: row["id"]),
        "genre": sorted(genre_rows, key=lambda row: row["id"]),
        "movie_genre": sorted(movie_genre_rows, key=lambda row: (row["movie_id"], row["genre_id"])),
        "person": sorted(person_rows, key=lambda row: row["id"]),
        "movie_person": sorted(movie_person_rows, key=lambda row: (row["movie_id"], row["role_type"], row["credit_order"] or 10**9, row["person_id"])),
        "company": sorted(company_rows, key=lambda row: row["id"]),
        "movie_company": sorted(movie_company_rows, key=lambda row: (row["movie_id"], row["role_type"], row["company_id"])),
    }


def write_csv(path: Path, rows, fieldnames):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def write_output(rows_by_table, output_dir: Path):
    fieldnames = {
        "movie": ["id", "title", "release_year", "release_date", "film_type", "budget", "box_office", "created_at", "updated_at"],
        "genre": ["id", "name"],
        "movie_genre": ["movie_id", "genre_id"],
        "person": ["id", "name", "created_at", "updated_at"],
        "movie_person": ["movie_id", "person_id", "role_type", "credit_order"],
        "company": ["id", "name", "created_at", "updated_at"],
        "movie_company": ["movie_id", "company_id", "role_type"],
    }
    for table, rows in rows_by_table.items():
        write_csv(output_dir / f"{table}.csv", rows, fieldnames[table])

    manifest = {table: len(rows) for table, rows in rows_by_table.items()}
    with (output_dir / "manifest.json").open("w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    return manifest


def run_psql(sql: str):
    subprocess.run([PSQL, "-d", DB_NAME, "-v", "ON_ERROR_STOP=1", "-c", sql], check=True)


def copy_csv(table: str, columns, path: Path, schema: str):
    columns_sql = ", ".join(columns)
    sql = f"\\copy {schema}.{table}({columns_sql}) FROM '{path.resolve()}' WITH (FORMAT csv, HEADER true)"
    run_psql(sql)


def reset_sequences(schema: str):
    statements = [
        f"SELECT setval(pg_get_serial_sequence('{schema}.movie', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM {schema}.movie;",
        f"SELECT setval(pg_get_serial_sequence('{schema}.genre', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM {schema}.genre;",
        f"SELECT setval(pg_get_serial_sequence('{schema}.person', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM {schema}.person;",
        f"SELECT setval(pg_get_serial_sequence('{schema}.company', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM {schema}.company;",
    ]
    for statement in statements:
        run_psql(statement)


def load_to_postgres(output_dir: Path, schema: str, truncate: bool):
    if truncate:
        run_psql(
            f"TRUNCATE {schema}.movie_company, {schema}.movie_person, {schema}.movie_genre, {schema}.company, {schema}.person, {schema}.genre, {schema}.movie RESTART IDENTITY CASCADE"
        )

    copy_csv("movie", ["id", "title", "release_year", "release_date", "film_type", "budget", "box_office", "created_at", "updated_at"], output_dir / "movie.csv", schema)
    copy_csv("genre", ["id", "name"], output_dir / "genre.csv", schema)
    copy_csv("person", ["id", "name", "created_at", "updated_at"], output_dir / "person.csv", schema)
    copy_csv("company", ["id", "name", "created_at", "updated_at"], output_dir / "company.csv", schema)
    copy_csv("movie_genre", ["movie_id", "genre_id"], output_dir / "movie_genre.csv", schema)
    copy_csv("movie_person", ["movie_id", "person_id", "role_type", "credit_order"], output_dir / "movie_person.csv", schema)
    copy_csv("movie_company", ["movie_id", "company_id", "role_type"], output_dir / "movie_company.csv", schema)
    reset_sequences(schema)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", default=str(BUILD_DIR))
    parser.add_argument("--load", action="store_true", help="load generated CSV files into Postgres")
    parser.add_argument("--schema", default="public", help="target Postgres schema for app tables")
    parser.add_argument("--truncate", action="store_true", help="truncate target tables before load")
    args = parser.parse_args()

    rows_by_table = build_app_rows()
    output_dir = Path(args.output_dir)
    manifest = write_output(rows_by_table, output_dir)
    print(json.dumps(manifest, indent=2))

    if args.load:
        load_to_postgres(output_dir, args.schema, args.truncate)


if __name__ == "__main__":
    main()
