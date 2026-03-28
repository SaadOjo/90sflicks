interface YearOption {
  year: number;
  count: number;
}

interface FilterSidebarProps {
  search: string;
  selectedYears: number[];
  selectedGenres: string[];
  selectedFilmTypes: string[];
  years: YearOption[];
  genres: string[];
  filmTypes: string[];
  creditSearch: string;
  onSearchChange: (value: string) => void;
  onYearToggle: (year: number) => void;
  onGenreToggle: (genre: string) => void;
  onFilmTypeToggle: (filmType: string) => void;
  onCreditSearchChange: (value: string) => void;
  onClearAll: () => void;
}

export function FilterSidebar({
  search,
  selectedYears,
  selectedGenres,
  selectedFilmTypes,
  years,
  genres,
  filmTypes,
  creditSearch,
  onSearchChange,
  onYearToggle,
  onGenreToggle,
  onFilmTypeToggle,
  onCreditSearchChange,
  onClearAll,
}: FilterSidebarProps) {
  return (
    <aside className="fixed left-0 top-16 bottom-0 flex w-64 flex-col overflow-y-auto border-r border-slate-200 bg-slate-100 px-6 py-6">
      <div className="mb-8">
        <div className="mb-1 flex items-center gap-3">
          <span className="text-lg font-black tracking-tighter text-slate-900">Filters</span>
          <span className="material-symbols-outlined text-sm text-primary">tune</span>
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <label className="mb-3 block font-label text-[11px] font-bold uppercase tracking-widest text-slate-900">Search</label>
          <div className="relative">
            <input
              className="w-full rounded-none border border-outline-variant bg-white px-3 py-2 font-mono text-xs focus:border-primary focus:ring-0"
              placeholder="Search titles..."
              type="text"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
            <span className="material-symbols-outlined absolute right-2 top-2 text-sm text-slate-400">search</span>
          </div>
        </section>

        <section>
          <label className="mb-3 block font-label text-[11px] font-bold uppercase tracking-widest text-slate-900">Years</label>
          <div className="grid grid-cols-2 gap-2">
            {years.map((item) => {
              const checked = selectedYears.includes(item.year);
              return (
                <label key={item.year} className="group flex cursor-pointer items-center gap-2">
                  <input
                    checked={checked}
                    className="h-3 w-3 rounded-none border-outline text-primary focus:ring-0"
                    type="checkbox"
                    onChange={() => onYearToggle(item.year)}
                  />
                  <span
                    className={checked
                      ? 'font-body text-[11px] font-bold text-slate-900'
                      : 'font-body text-[11px] text-slate-500 transition-colors group-hover:text-slate-900'}
                  >
                    {item.year} ({item.count})
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        <section>
          <label className="mb-3 block font-label text-[11px] font-bold uppercase tracking-widest text-slate-900">Genres</label>
          <div className="flex flex-wrap gap-1.5">
            {genres.map((genre) => {
              const active = selectedGenres.includes(genre);
              return (
                <button
                  key={genre}
                  className={active
                    ? 'bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-white'
                    : 'border border-outline-variant bg-white px-2 py-0.5 text-[10px] font-medium uppercase text-slate-500 transition-colors hover:bg-slate-200'}
                  onClick={() => onGenreToggle(genre)}
                  type="button"
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <label className="mb-3 block font-label text-[11px] font-bold uppercase tracking-widest text-slate-900">Format</label>
          <div className="space-y-1">
            {filmTypes.map((filmType) => {
              const checked = selectedFilmTypes.includes(filmType);
              return (
                <label key={filmType} className="flex items-center gap-2 font-body text-[11px] font-medium uppercase text-slate-500">
                  <input
                    checked={checked}
                    className="h-3 w-3 rounded-none border-outline text-primary focus:ring-0"
                    type="checkbox"
                    onChange={() => onFilmTypeToggle(filmType)}
                  />
                  {filmType}
                </label>
              );
            })}
          </div>
        </section>

        <section>
          <label className="mb-3 block font-label text-[11px] font-bold uppercase tracking-widest text-slate-900">People</label>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1 border border-outline-variant bg-white px-3 py-2">
              {creditSearch ? (
                <span className="flex items-center gap-1 bg-slate-200 px-1 py-0.5 text-[9px] text-slate-700">
                  {creditSearch}
                  <button className="material-symbols-outlined text-[10px]" onClick={() => onCreditSearchChange('')} type="button">
                    close
                  </button>
                </span>
              ) : null}
              <input
                className="w-24 border-none p-0 text-xs focus:ring-0"
                placeholder="Director, cast..."
                type="text"
                value={creditSearch}
                onChange={(event) => onCreditSearchChange(event.target.value)}
              />
            </div>
          </div>
        </section>
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-8">
        <button
          className="w-full border border-outline bg-transparent py-3 font-label text-[11px] font-bold uppercase tracking-widest text-primary transition-colors hover:bg-slate-200 active:opacity-70"
          onClick={onClearAll}
          type="button"
        >
          Clear All
        </button>
      </div>
    </aside>
  );
}
