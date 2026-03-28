import type { CompanySuggestion } from '../../shared/types/archive';
import type { CompanySearchIndexResponse } from '../../shared/types/api';
import { searchEntityIndex } from './entitySearch';

let companyIndexPromise: Promise<CompanySuggestion[]> | null = null;

async function loadCompanyIndex(): Promise<CompanySuggestion[]> {
  if (companyIndexPromise) {
    return companyIndexPromise;
  }

  companyIndexPromise = fetch('/api/search-index/companies', {
    headers: {
      Accept: 'application/json',
    },
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to load company index: ${response.status}`);
      }

      const payload = (await response.json()) as CompanySearchIndexResponse;
      return payload.items;
    })
    .catch((error) => {
      companyIndexPromise = null;
      throw error;
    });

  return companyIndexPromise;
}

export async function searchCompanies(query: string, limit = 8): Promise<CompanySuggestion[]> {
  const index = await loadCompanyIndex();
  return searchEntityIndex(index, query, limit);
}
