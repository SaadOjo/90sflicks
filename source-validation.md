# Source validation for current fields

## Validated sources

### 1) Wikidata
- Works without API key
- APIs validated:
  - `https://www.wikidata.org/w/api.php?action=wbsearchentities...`
  - `https://query.wikidata.org/sparql`
- Strong for: US filter, release year/date, genre, director, some writer/cast, some producer/company/distributor, sparse budget/box office
- Weak for: exact US release date, keywords, detailed box office splits, release type

### 2) IMDb datasets
- Works without API key
- Files validated:
  - `https://datasets.imdbws.com/title.basics.tsv.gz`
  - `https://datasets.imdbws.com/title.crew.tsv.gz`
  - `https://datasets.imdbws.com/title.principals.tsv.gz`
  - `https://datasets.imdbws.com/name.basics.tsv.gz`
  - `https://datasets.imdbws.com/title.ratings.tsv.gz`
- Strong for: title, year, film type, genres, directors, writers, cast, optional audience rating
- Weak for: US filter, production companies, distributor, budget, box office

### 3) Wikipedia API
- Works without API key
- API validated:
  - `https://en.wikipedia.org/w/api.php?action=parse&page=Toy_Story&prop=wikitext&format=json`
- Can expose infobox fields like production companies, distributor, released, budget, gross
- Problem: parsing is brittle and inconsistent. Good fallback, bad primary source.

### 4) OMDb / TMDb
- Validated that both require API keys
- Not suitable as primary sources if we want open / no-key ingestion

## Coverage from Wikidata for US 1990s films
Base set used in SPARQL: films with country of origin = United States and release year 1990-1999

- total films: 7473
- genre: 6578
- director: 7006
- writer: 3461
- cast: 5569
- producer: 3051
- production company: 2083
- distributor: 3880
- budget: 561
- box office: 515
- main subject / keyword-like field: 1148
- exact day-level release date: 2435
- IMDb ID available for join: 7226

## Field-by-field verdict

- title: YES
  - source: Wikidata + IMDb

- release year: YES
  - source: Wikidata + IMDb

- release date: PARTIAL
  - source: Wikidata
  - problem: only 2435 / 7473 have day-level precision; multiple release dates also need cleanup

- genre: YES
  - source: Wikidata + IMDb

- subgenre: PARTIAL
  - source: mostly Wikidata genres
  - problem: not standardized cleanly enough

- tags / keywords: WEAK
  - source: Wikidata main subject is too sparse
  - verdict: drop unless we accept manual tagging or non-open sources

- film type: YES-ISH
  - source: IMDb `titleType` + genres
  - good enough for movie / tvMovie / video and documentary / animation signals

- director(s): YES
  - source: Wikidata + IMDb

- writer(s): YES
  - source: IMDb is better; Wikidata is too sparse

- main cast: YES
  - source: IMDb principals is better; Wikidata is partial

- producer(s): PARTIAL
  - source: Wikidata

- production company / companies: PARTIAL
  - source: Wikidata, Wikipedia fallback
  - problem: only 2083 / 7473 in Wikidata

- distributor: PARTIAL
  - source: Wikidata, Wikipedia fallback
  - problem: only 3880 / 7473 in Wikidata

- budget: WEAK
  - source: Wikidata, Wikipedia fallback
  - problem: only 561 / 7473 in Wikidata

- domestic box office: NO reliable open source found
  - Wikipedia pages may mention it, but not as a clean stable field
  - verdict: drop

- international box office: NO reliable open source found
  - verdict: drop

- worldwide box office: PARTIAL
  - source: Wikidata generic `box office`, Wikipedia fallback via `gross`
  - problem: only 515 / 7473 in Wikidata

- opening weekend box office: NO reliable open source found
  - usually appears in article body, not as a clean structured field
  - verdict: drop

- release type: NO reliable structured open source found
  - IMDb can tell `movie` / `tvMovie` / `video`, but not limited / wide / festival cleanly
  - verdict: drop or simplify

## Recommended source stack

### Best practical stack
1. Wikidata as the base catalog and US 1990s filter
2. IMDb datasets joined through IMDb ID for title / type / genres / director / writer / cast
3. Optional Wikipedia infobox parsing only for backfilling company / distributor / budget / gross on selected titles

## Recommended field cuts
If we want fields that are actually supportable from open/free sources, cut these now:
- tags / keywords
- domestic box office
- international box office
- opening weekend box office
- release type

Also consider simplifying these:
- subgenre -> keep only if manually curated later
- budget -> optional / sparse
- worldwide box office -> rename to `box office` unless we can verify worldwide specifically
- production company / companies -> keep, but expect missing data
- distributor -> keep, but expect missing data
