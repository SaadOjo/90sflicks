#!/usr/bin/env python3
import argparse
import csv
import gzip
import json
import sys
import time
from collections import defaultdict
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

USER_AGENT = "movie-filter/0.1 (internal raw downloader)"
RAW_DIR = Path("raw")
WIKIDATA_DIR = RAW_DIR / "wikidata"
IMDB_DIR = RAW_DIR / "imdb"
MANIFEST_PATH = RAW_DIR / "manifest.json"

WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql"
IMDB_URLS = {
    "title.basics": "https://datasets.imdbws.com/title.basics.tsv.gz",
    "title.crew": "https://datasets.imdbws.com/title.crew.tsv.gz",
    "title.principals": "https://datasets.imdbws.com/title.principals.tsv.gz",
    "name.basics": "https://datasets.imdbws.com/name.basics.tsv.gz",
    "title.ratings": "https://datasets.imdbws.com/title.ratings.tsv.gz",
}

BASE_QUERY = """
SELECT ?film ?filmLabel ?imdb ?date WHERE {
  ?film wdt:P31/wdt:P279* wd:Q11424 ;
        wdt:P495 wd:Q30 ;
        wdt:P577 ?date .
  FILTER(YEAR(?date) >= 1990 && YEAR(?date) <= 1999)
  OPTIONAL { ?film wdt:P345 ?imdb }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY ?film ?date
LIMIT __LIMIT__
OFFSET __OFFSET__
"""

LABEL_PROP_QUERIES = {
    "genres": "P136",
    "producers": "P162",
    "production_companies": "P272",
    "distributors": "P750",
}

NUMERIC_PROP_QUERIES = {
    "budget": "P2130",
    "box_office": "P2142",
}


def ensure_dirs():
    WIKIDATA_DIR.mkdir(parents=True, exist_ok=True)
    IMDB_DIR.mkdir(parents=True, exist_ok=True)


def fetch_json(url: str, retries: int = 5, sleep_seconds: float = 2.0) -> dict:
    last_error = None
    for attempt in range(1, retries + 1):
        try:
            req = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
            with urlopen(req, timeout=120) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
            last_error = exc
            if attempt == retries:
                raise
            time.sleep(sleep_seconds * attempt)
    raise last_error  # pragma: no cover


def run_sparql(query: str) -> dict:
    url = f"{WIKIDATA_ENDPOINT}?format=json&query={quote(query)}"
    return fetch_json(url)


def binding_value(binding: dict, key: str):
    value = binding.get(key)
    if not value:
        return None
    return value.get("value")


def qid_from_uri(uri: str | None):
    if not uri:
        return None
    return uri.rsplit("/", 1)[-1]


def qid_batches(qids, batch_size: int):
    batch = []
    for qid in qids:
        batch.append(qid)
        if len(batch) >= batch_size:
            yield batch
            batch = []
    if batch:
        yield batch


def values_clause(qids):
    return " ".join(f"wd:{qid}" for qid in qids)


def download_wikidata_movies(page_size: int = 500, delay: float = 1.0):
    movies = {}
    offset = 0
    while True:
        query = BASE_QUERY.replace("__LIMIT__", str(page_size)).replace("__OFFSET__", str(offset))
        data = run_sparql(query)
        bindings = data.get("results", {}).get("bindings", [])
        if not bindings:
            break
        for binding in bindings:
            qid = qid_from_uri(binding_value(binding, "film"))
            movie = movies.setdefault(qid, {
                "wikidata_id": qid,
                "title": binding_value(binding, "filmLabel"),
                "imdb_id": binding_value(binding, "imdb"),
                "release_dates": [],
                "release_year": None,
                "genres": [],
                "producers": [],
                "production_companies": [],
                "distributors": [],
                "budget": None,
                "box_office": None,
            })
            date = binding_value(binding, "date")
            if date:
                short = date[:10]
                if short not in movie["release_dates"]:
                    movie["release_dates"].append(short)
        offset += page_size
        time.sleep(delay)

    for movie in movies.values():
        movie["release_dates"].sort()
        if movie["release_dates"]:
            movie["release_year"] = int(movie["release_dates"][0][:4])

    return movies


def enrich_label_property(movies: dict, field: str, prop: str, batch_size: int = 150, delay: float = 0.5):
    qids = sorted(movies.keys())
    for batch in qid_batches(qids, batch_size):
        query = f'''
SELECT ?film ?valueLabel WHERE {{
  VALUES ?film {{ {values_clause(batch)} }}
  ?film wdt:{prop} ?value .
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
}}
'''
        data = run_sparql(query)
        for binding in data.get("results", {}).get("bindings", []):
            qid = qid_from_uri(binding_value(binding, "film"))
            value = binding_value(binding, "valueLabel")
            if qid and value and value not in movies[qid][field]:
                movies[qid][field].append(value)
        time.sleep(delay)


def enrich_numeric_property(movies: dict, field: str, prop: str, batch_size: int = 150, delay: float = 0.5):
    qids = sorted(movies.keys())
    for batch in qid_batches(qids, batch_size):
        query = f'''
SELECT ?film ?value WHERE {{
  VALUES ?film {{ {values_clause(batch)} }}
  ?film wdt:{prop} ?value .
}}
'''
        data = run_sparql(query)
        for binding in data.get("results", {}).get("bindings", []):
            qid = qid_from_uri(binding_value(binding, "film"))
            value = binding_value(binding, "value")
            if qid and value and movies[qid][field] is None:
                movies[qid][field] = value
        time.sleep(delay)


def write_wikidata_ndjson(movies: dict):
    path = WIKIDATA_DIR / "us_90s_movies.ndjson"
    with path.open("w", encoding="utf-8") as f:
        for qid in sorted(movies.keys()):
            f.write(json.dumps(movies[qid], ensure_ascii=False) + "\n")


def stream_gzip_tsv(url: str):
    req = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(req, timeout=120) as resp:
        with gzip.GzipFile(fileobj=resp) as gz:
            wrapper = (line.decode("utf-8", errors="replace") for line in gz)
            reader = csv.DictReader(wrapper, delimiter="\t")
            for row in reader:
                yield row


def write_tsv(path: Path, rows, fieldnames):
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter="\t", extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def filter_imdb_titles(imdb_ids: set[str]):
    counts = {}

    basics_rows = []
    title_types = defaultdict(int)
    for row in stream_gzip_tsv(IMDB_URLS["title.basics"]):
        if row["tconst"] in imdb_ids:
            basics_rows.append(row)
            title_types[row.get("titleType", "") or ""] += 1
    write_tsv(IMDB_DIR / "title.basics.us_90s.tsv", basics_rows, basics_rows[0].keys() if basics_rows else ["tconst"])
    counts["title.basics"] = len(basics_rows)

    crew_rows = []
    person_ids = set()
    for row in stream_gzip_tsv(IMDB_URLS["title.crew"]):
        if row["tconst"] in imdb_ids:
            crew_rows.append(row)
            for key in ("directors", "writers"):
                value = row.get(key)
                if value and value != "\\N":
                    person_ids.update(part for part in value.split(",") if part and part != "\\N")
    write_tsv(IMDB_DIR / "title.crew.us_90s.tsv", crew_rows, crew_rows[0].keys() if crew_rows else ["tconst"])
    counts["title.crew"] = len(crew_rows)

    principals_rows = []
    principals_by_category = defaultdict(int)
    for row in stream_gzip_tsv(IMDB_URLS["title.principals"]):
        if row["tconst"] in imdb_ids:
            principals_rows.append(row)
            if row.get("nconst") and row["nconst"] != "\\N":
                person_ids.add(row["nconst"])
            principals_by_category[row.get("category", "") or ""] += 1
    write_tsv(IMDB_DIR / "title.principals.us_90s.tsv", principals_rows, principals_rows[0].keys() if principals_rows else ["tconst"])
    counts["title.principals"] = len(principals_rows)

    ratings_rows = []
    for row in stream_gzip_tsv(IMDB_URLS["title.ratings"]):
        if row["tconst"] in imdb_ids:
            ratings_rows.append(row)
    write_tsv(IMDB_DIR / "title.ratings.us_90s.tsv", ratings_rows, ratings_rows[0].keys() if ratings_rows else ["tconst"])
    counts["title.ratings"] = len(ratings_rows)

    names_rows = []
    for row in stream_gzip_tsv(IMDB_URLS["name.basics"]):
        if row["nconst"] in person_ids:
            names_rows.append(row)
    write_tsv(IMDB_DIR / "name.basics.us_90s.tsv", names_rows, names_rows[0].keys() if names_rows else ["nconst"])
    counts["name.basics"] = len(names_rows)

    return counts, dict(title_types), dict(principals_by_category), len(person_ids)


def build_manifest(movies: dict, imdb_counts, title_types, principal_categories, people_count):
    movie_values = list(movies.values())
    with_imdb = [movie for movie in movie_values if movie.get("imdb_id")]
    without_imdb = [movie for movie in movie_values if not movie.get("imdb_id")]
    manifest = {
        "scope": "US films with release year 1990-1999 from Wikidata",
        "movies": {
            "total": len(movie_values),
            "with_imdb_id": len(with_imdb),
            "without_imdb_id": len(without_imdb),
        },
        "wikidata_non_null_counts": {
            "release_date": sum(1 for m in movie_values if m.get("release_dates")),
            "genre": sum(1 for m in movie_values if m.get("genres")),
            "producer": sum(1 for m in movie_values if m.get("producers")),
            "production_company": sum(1 for m in movie_values if m.get("production_companies")),
            "distributor": sum(1 for m in movie_values if m.get("distributors")),
            "budget": sum(1 for m in movie_values if m.get("budget")),
            "box_office": sum(1 for m in movie_values if m.get("box_office")),
        },
        "imdb_filtered_rows": imdb_counts,
        "imdb_title_types": title_types,
        "imdb_principal_categories": principal_categories,
        "imdb_people_total": people_count,
    }
    with MANIFEST_PATH.open("w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    return manifest


def print_manifest(manifest):
    print(json.dumps(manifest, indent=2, ensure_ascii=False))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="only fetch scope counts and write Wikidata raw file")
    parser.add_argument("--page-size", type=int, default=500)
    args = parser.parse_args()

    ensure_dirs()
    movies = download_wikidata_movies(page_size=args.page_size)

    if not args.dry_run:
        for field, prop in LABEL_PROP_QUERIES.items():
            enrich_label_property(movies, field, prop)
        for field, prop in NUMERIC_PROP_QUERIES.items():
            enrich_numeric_property(movies, field, prop)

    write_wikidata_ndjson(movies)
    imdb_ids = {movie["imdb_id"] for movie in movies.values() if movie.get("imdb_id")}

    if args.dry_run:
        manifest = build_manifest(movies, {}, {}, {}, 0)
        print_manifest(manifest)
        return

    imdb_counts, title_types, principal_categories, people_count = filter_imdb_titles(imdb_ids)
    manifest = build_manifest(movies, imdb_counts, title_types, principal_categories, people_count)
    print_manifest(manifest)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(130)
