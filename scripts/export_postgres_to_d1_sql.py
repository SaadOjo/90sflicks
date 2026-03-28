#!/usr/bin/env python3
import csv
import io
import json
import subprocess
from pathlib import Path

DB_NAME = 'movie_filter'
PSQL = '/opt/homebrew/opt/postgresql@17/bin/psql'
OUT_DIR = Path('build/d1')
SCHEMA_SQL_PATH = Path('drizzle/0000_initial.sql')
LOAD_SQL_PATH = OUT_DIR / 'load.sql'
MANIFEST_PATH = OUT_DIR / 'manifest.json'

TABLES = [
    ('movie', ['id', 'title', 'release_year', 'release_date', 'film_type', 'budget', 'box_office', 'created_at', 'updated_at']),
    ('genre', ['id', 'name']),
    ('person', ['id', 'name', 'created_at', 'updated_at']),
    ('company', ['id', 'name', 'created_at', 'updated_at']),
    ('movie_genre', ['movie_id', 'genre_id']),
    ('movie_person', ['movie_id', 'person_id', 'role_type', 'credit_order']),
    ('movie_company', ['movie_id', 'company_id', 'role_type']),
]


def copy_table(table: str, columns: list[str]) -> list[dict[str, str]]:
    query = f"COPY (SELECT {', '.join(columns)} FROM public.{table} ORDER BY 1) TO STDOUT WITH CSV HEADER"
    output = subprocess.check_output([PSQL, '-d', DB_NAME, '-At', '-c', query], text=True)
    return list(csv.DictReader(io.StringIO(output)))


def sql_value(value: str | None) -> str:
    if value in (None, ''):
        return 'NULL'
    escaped = value.replace("'", "''")
    return f"'{escaped}'"


def row_to_sql(columns: list[str], row: dict[str, str]) -> str:
    values = [sql_value(row.get(column)) for column in columns]
    return f"({', '.join(values)})"


def batched(items: list[dict[str, str]], size: int):
    for index in range(0, len(items), size):
        yield items[index:index + size]


def write_load_sql(rows_by_table: dict[str, list[dict[str, str]]]):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    schema_sql = SCHEMA_SQL_PATH.read_text(encoding='utf-8').strip()

    with LOAD_SQL_PATH.open('w', encoding='utf-8') as f:
        f.write(schema_sql)
        f.write('\n\nBEGIN TRANSACTION;\n')
        f.write('PRAGMA foreign_keys = OFF;\n')
        for table, _ in reversed(TABLES):
            f.write(f'DELETE FROM {table};\n')
        f.write('PRAGMA foreign_keys = ON;\n')

        for table, columns in TABLES:
            rows = rows_by_table[table]
            if not rows:
                continue
            for chunk in batched(rows, 500):
                f.write(f'\nINSERT INTO {table} ({", ".join(columns)}) VALUES\n')
                f.write(',\n'.join(row_to_sql(columns, row) for row in chunk))
                f.write(';\n')

        f.write('\nCOMMIT;\n')


def main():
    rows_by_table: dict[str, list[dict[str, str]]] = {}
    manifest: dict[str, int] = {}
    for table, columns in TABLES:
        rows = copy_table(table, columns)
        rows_by_table[table] = rows
        manifest[table] = len(rows)

    write_load_sql(rows_by_table)
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    print(json.dumps(manifest, indent=2))
    print(f'Wrote {LOAD_SQL_PATH}')


if __name__ == '__main__':
    main()
