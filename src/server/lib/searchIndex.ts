/// <reference types="@cloudflare/workers-types" />

import type { CompanySuggestion, MovieCompanyRole, MoviePersonRole, PersonSuggestion } from '../../shared/types/archive';

interface SearchIndexRow<TRole extends string> {
  id: number;
  name: string;
  roleType: TRole;
  movieId: number;
}

function sqlAll<T>(db: D1Database, sql: string, params: unknown[] = []): Promise<D1Result<T>> {
  const statement = params.length > 0 ? db.prepare(sql).bind(...params) : db.prepare(sql);
  return statement.all<T>();
}

function aggregateSearchIndexEntry<TRole extends string, TItem extends { id: string; name: string; roles: TRole[]; movieCount: number }>(
  rows: SearchIndexRow<TRole>[],
  roleOrder: TRole[],
): TItem[] {
  const byId = new Map<string, { item: TItem; movieIds: Set<number> }>();

  for (const row of rows) {
    const key = String(row.id);
    const current = byId.get(key) ?? {
      item: {
        id: key,
        name: row.name,
        roles: [],
        movieCount: 0,
      } as unknown as TItem,
      movieIds: new Set<number>(),
    };

    if (!current.item.roles.includes(row.roleType)) {
      current.item.roles.push(row.roleType);
    }

    current.movieIds.add(row.movieId);
    current.item.movieCount = current.movieIds.size;
    byId.set(key, current);
  }

  return Array.from(byId.values())
    .map((entry) => {
      entry.item.roles.sort((left, right) => roleOrder.indexOf(left) - roleOrder.indexOf(right));
      return entry.item;
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

const COMPANY_ROLE_ORDER: MovieCompanyRole[] = ['production', 'distribution'];
const PERSON_ROLE_ORDER: MoviePersonRole[] = ['director', 'writer', 'producer', 'cast'];

export async function getCompanySearchIndex(db: D1Database): Promise<CompanySuggestion[]> {
  const result = await sqlAll<SearchIndexRow<MovieCompanyRole>>(
    db,
    `
      SELECT c.id AS id, c.name AS name, mc.role_type AS roleType, mc.movie_id AS movieId
      FROM company c
      JOIN movie_company mc ON mc.company_id = c.id
      ORDER BY c.name ASC, mc.movie_id ASC
    `,
  );

  return aggregateSearchIndexEntry<MovieCompanyRole, CompanySuggestion>(result.results ?? [], COMPANY_ROLE_ORDER);
}

export async function getPeopleSearchIndexShard(db: D1Database, prefix: string): Promise<PersonSuggestion[]> {
  const normalizedPrefix = prefix.trim().toLowerCase().slice(0, 2);
  if (normalizedPrefix.length < 2) {
    return [];
  }

  const result = await sqlAll<SearchIndexRow<MoviePersonRole>>(
    db,
    `
      SELECT p.id AS id, p.name AS name, mp.role_type AS roleType, mp.movie_id AS movieId
      FROM person p
      JOIN movie_person mp ON mp.person_id = p.id
      WHERE lower(trim(p.name)) LIKE ?
      ORDER BY p.name ASC, mp.movie_id ASC
    `,
    [`${normalizedPrefix}%`],
  );

  return aggregateSearchIndexEntry<MoviePersonRole, PersonSuggestion>(result.results ?? [], PERSON_ROLE_ORDER);
}
