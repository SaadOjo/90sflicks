import { useEffect, useState } from 'react';

interface UseAutocompleteSuggestionsArgs<TItem extends { id: string }> {
  query: string;
  selectedItems: TItem[];
  search: (query: string, limit?: number) => Promise<TItem[]>;
  minLength?: number;
  delayMs?: number;
  limit?: number;
}

export function useAutocompleteSuggestions<TItem extends { id: string }>({
  query,
  selectedItems,
  search,
  minLength = 2,
  delayMs = 200,
  limit = 8,
}: UseAutocompleteSuggestionsArgs<TItem>) {
  const [suggestions, setSuggestions] = useState<TItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < minLength) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const results = await search(trimmedQuery, limit);
        if (!cancelled) {
          const selectedIds = new Set(selectedItems.map((item) => item.id));
          setSuggestions(results.filter((item) => !selectedIds.has(item.id)));
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setSuggestions([]);
          setIsLoading(false);
        }
      }
    }, delayMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [delayMs, limit, minLength, query, search, selectedItems]);

  return { suggestions, isLoading };
}
