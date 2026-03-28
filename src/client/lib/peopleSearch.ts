import type { PersonSuggestion } from '../../shared/types/archive';
import type { PeopleSearchIndexResponse } from '../../shared/types/api';
import { searchEntityIndex } from './entitySearch';

const PEOPLE_SHARD_CACHE = new Map<string, Promise<PersonSuggestion[]>>();

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

async function loadPeopleShard(prefix: string): Promise<PersonSuggestion[]> {
  const normalizedPrefix = normalize(prefix).slice(0, 2);
  if (normalizedPrefix.length < 2) {
    return [];
  }

  const cached = PEOPLE_SHARD_CACHE.get(normalizedPrefix);
  if (cached) {
    return cached;
  }

  const request = fetch(`/api/search-index/people?prefix=${encodeURIComponent(normalizedPrefix)}`, {
    headers: {
      Accept: 'application/json',
    },
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to load people shard: ${response.status}`);
      }

      const payload = (await response.json()) as PeopleSearchIndexResponse;
      return payload.items;
    })
    .catch((error) => {
      PEOPLE_SHARD_CACHE.delete(normalizedPrefix);
      throw error;
    });

  PEOPLE_SHARD_CACHE.set(normalizedPrefix, request);
  return request;
}

export async function searchPeople(query: string, limit = 8): Promise<PersonSuggestion[]> {
  const normalizedQuery = normalize(query);
  if (normalizedQuery.length < 2) {
    return [];
  }

  const shard = await loadPeopleShard(normalizedQuery.slice(0, 2));
  return searchEntityIndex(shard, normalizedQuery, limit);
}
