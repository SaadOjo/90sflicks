interface SuggestionLike {
  id: string;
  name: string;
  roles: string[];
  movieCount: number;
}

interface AutocompleteFilterSectionProps<TSuggestion extends SuggestionLike> {
  title: string;
  placeholder: string;
  query: string;
  selectedItems: TSuggestion[];
  suggestions: TSuggestion[];
  isLoading: boolean;
  onQueryChange: (value: string) => void;
  onSelect: (item: TSuggestion) => void;
  onRemove: (itemId: string) => void;
  formatRole: (role: string) => string;
}

export function AutocompleteFilterSection<TSuggestion extends SuggestionLike>({
  title,
  placeholder,
  query,
  selectedItems,
  suggestions,
  isLoading,
  onQueryChange,
  onSelect,
  onRemove,
  formatRole,
}: AutocompleteFilterSectionProps<TSuggestion>) {
  return (
    <section>
      <label className="mb-2 block text-xs font-medium text-slate-600">{title}</label>
      {selectedItems.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-2">
          {selectedItems.map((item) => (
            <span key={item.id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
              {item.name}
              <button className="material-symbols-outlined text-xs text-slate-500" onClick={() => onRemove(item.id)} type="button">
                close
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="relative rounded-md border border-slate-200 bg-white px-3 py-2">
        <input
          className="w-full border-none p-0 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:ring-0"
          placeholder={placeholder}
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />

        {(isLoading || suggestions.length > 0) && query.trim().length >= 2 ? (
          <div className="absolute inset-x-0 top-full z-20 mt-2 rounded-md border border-slate-200 bg-white shadow-lg">
            {isLoading ? (
              <div className="px-3 py-3 text-xs text-slate-500">Searching…</div>
            ) : (
              <ul className="max-h-64 overflow-y-auto py-1">
                {suggestions.map((item) => (
                  <li key={item.id}>
                    <button
                      className="flex w-full flex-col gap-2 px-3 py-3 text-left hover:bg-slate-50"
                      onClick={() => onSelect(item)}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-xs font-medium text-slate-900">{item.name}</span>
                        <span className="text-xs text-slate-400">{item.movieCount} titles</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {item.roles.map((role) => (
                          <span key={role} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                            {formatRole(role)}
                          </span>
                        ))}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
