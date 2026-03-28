#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${1:-movie_filter}"
PG_BIN="/opt/homebrew/opt/postgresql@17/bin"

if ! command -v brew >/dev/null 2>&1; then
  echo "brew is required" >&2
  exit 1
fi

if [ ! -x "$PG_BIN/psql" ]; then
  HOMEBREW_NO_AUTO_UPDATE=1 brew install postgresql@17
fi

brew services start postgresql@17 >/dev/null

if ! "$PG_BIN/pg_isready" >/dev/null 2>&1; then
  echo "postgres is not accepting connections" >&2
  exit 1
fi

if ! "$PG_BIN/psql" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1; then
  createdb "$DB_NAME"
fi

echo "postgres ready"
echo "database: $DB_NAME"
echo "psql: $PG_BIN/psql -d $DB_NAME"
