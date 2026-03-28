import type {
  CompanySuggestion,
  MovieCompanyRole,
  MoviePersonRole,
  NumericRangeFilter,
  PersonSuggestion,
} from '../../shared/types/archive';

interface YearOption {
  year: number;
  count: number;
}

interface NumericRangeSectionProps {
  label: string;
  value: NumericRangeFilter;
  minInput: string;
  maxInput: string;
  onKnownOnlyChange: (checked: boolean) => void;
  onMinInputChange: (value: string) => void;
  onMaxInputChange: (value: string) => void;
}

interface FilterSidebarProps {
  search: string;
  selectedYears: number[];
  selectedGenres: string[];
  selectedFilmTypes: string[];
  years: YearOption[];
  genres: string[];
  filmTypes: string[];
  peopleQuery: string;
  selectedPeople: PersonSuggestion[];
  peopleSuggestions: PersonSuggestion[];
  isPeopleLoading: boolean;
  companyQuery: string;
  selectedCompanies: CompanySuggestion[];
  companySuggestions: CompanySuggestion[];
  isCompanyLoading: boolean;
  budgetFilter: NumericRangeFilter;
  budgetMinInput: string;
  budgetMaxInput: string;
  boxOfficeFilter: NumericRangeFilter;
  boxOfficeMinInput: string;
  boxOfficeMaxInput: string;
  onSearchChange: (value: string) => void;
  onYearToggle: (year: number) => void;
  onGenreToggle: (genre: string) => void;
  onFilmTypeToggle: (filmType: string) => void;
  onPeopleQueryChange: (value: string) => void;
  onSelectPerson: (person: PersonSuggestion) => void;
  onRemovePerson: (personId: string) => void;
  onCompanyQueryChange: (value: string) => void;
  onSelectCompany: (company: CompanySuggestion) => void;
  onRemoveCompany: (companyId: string) => void;
  onBudgetFilterChange: (next: NumericRangeFilter) => void;
  onBudgetMinInputChange: (value: string) => void;
  onBudgetMaxInputChange: (value: string) => void;
  onBoxOfficeFilterChange: (next: NumericRangeFilter) => void;
  onBoxOfficeMinInputChange: (value: string) => void;
  onBoxOfficeMaxInputChange: (value: string) => void;
  onClearAll: () => void;
}

function formatPersonRole(role: MoviePersonRole): string {
  switch (role) {
    case 'director':
      return 'Director';
    case 'writer':
      return 'Writer';
    case 'producer':
      return 'Producer';
    case 'cast':
      return 'Cast';
  }
}

function formatCompanyRole(role: MovieCompanyRole): string {
  switch (role) {
    case 'production':
      return 'Production';
    case 'distribution':
      return 'Distribution';
  }
}

function NumericRangeSection({
  label,
  value,
  minInput,
  maxInput,
  onKnownOnlyChange,
  onMinInputChange,
  onMaxInputChange,
}: NumericRangeSectionProps) {
  return (
    <section>
      <label className="mb-2 block text-xs font-medium text-slate-600">{label}</label>
      <div className="space-y-3 rounded-md border border-slate-200 bg-white p-3">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            checked={value.knownOnly}
            className="h-3.5 w-3.5 rounded-sm border-slate-300 text-primary focus:ring-0"
            type="checkbox"
            onChange={(event) => onKnownOnlyChange(event.target.checked)}
          />
          Known only
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-primary"
            placeholder="Min (e.g. 5M)"
            type="text"
            value={minInput}
            onChange={(event) => onMinInputChange(event.target.value)}
          />
          <input
            className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-primary"
            placeholder="Max (e.g. 100M)"
            type="text"
            value={maxInput}
            onChange={(event) => onMaxInputChange(event.target.value)}
          />
        </div>
      </div>
    </section>
  );
}

export function FilterSidebar({
  search,
  selectedYears,
  selectedGenres,
  selectedFilmTypes,
  years,
  genres,
  filmTypes,
  peopleQuery,
  selectedPeople,
  peopleSuggestions,
  isPeopleLoading,
  companyQuery,
  selectedCompanies,
  companySuggestions,
  isCompanyLoading,
  budgetFilter,
  budgetMinInput,
  budgetMaxInput,
  boxOfficeFilter,
  boxOfficeMinInput,
  boxOfficeMaxInput,
  onSearchChange,
  onYearToggle,
  onGenreToggle,
  onFilmTypeToggle,
  onPeopleQueryChange,
  onSelectPerson,
  onRemovePerson,
  onCompanyQueryChange,
  onSelectCompany,
  onRemoveCompany,
  onBudgetFilterChange,
  onBudgetMinInputChange,
  onBudgetMaxInputChange,
  onBoxOfficeFilterChange,
  onBoxOfficeMinInputChange,
  onBoxOfficeMaxInputChange,
  onClearAll,
}: FilterSidebarProps) {
  return (
    <aside className="fixed left-0 top-16 bottom-0 flex w-72 flex-col overflow-y-auto border-r border-slate-200/80 bg-slate-50 px-5 py-5">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Filters</h2>
          <p className="mt-1 text-xs text-slate-500">Refine the movie list</p>
        </div>
        <span className="material-symbols-outlined text-base text-slate-400">tune</span>
      </div>

      <div className="space-y-6">
        <section>
          <label className="mb-2 block text-xs font-medium text-slate-600">Search</label>
          <div className="relative">
            <input
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-primary"
              placeholder="Search titles"
              type="text"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
            <span className="material-symbols-outlined absolute top-2.5 right-2 text-base text-slate-400">search</span>
          </div>
        </section>

        <section>
          <label className="mb-2 block text-xs font-medium text-slate-600">Years</label>
          <div className="grid grid-cols-2 gap-2">
            {years.map((item) => {
              const checked = selectedYears.includes(item.year);
              return (
                <label key={item.year} className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm text-slate-600 hover:bg-slate-100">
                  <input
                    checked={checked}
                    className="h-3.5 w-3.5 rounded-sm border-slate-300 text-primary focus:ring-0"
                    type="checkbox"
                    onChange={() => onYearToggle(item.year)}
                  />
                  <span className={checked ? 'font-medium text-slate-900' : ''}>
                    {item.year} <span className="text-slate-400">({item.count})</span>
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        <section>
          <label className="mb-2 block text-xs font-medium text-slate-600">Genres</label>
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => {
              const active = selectedGenres.includes(genre);
              return (
                <button
                  key={genre}
                  className={
                    active
                      ? 'rounded-full bg-primary px-3 py-1 text-xs font-medium text-white'
                      : 'rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100'
                  }
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
          <label className="mb-2 block text-xs font-medium text-slate-600">Format</label>
          <div className="space-y-1">
            {filmTypes.map((filmType) => {
              const checked = selectedFilmTypes.includes(filmType);
              return (
                <label key={filmType} className="flex items-center gap-2 rounded-md px-1 py-1 text-sm text-slate-600 hover:bg-slate-100">
                  <input
                    checked={checked}
                    className="h-3.5 w-3.5 rounded-sm border-slate-300 text-primary focus:ring-0"
                    type="checkbox"
                    onChange={() => onFilmTypeToggle(filmType)}
                  />
                  <span className={checked ? 'font-medium text-slate-900' : ''}>{filmType}</span>
                </label>
              );
            })}
          </div>
        </section>

        <section>
          <label className="mb-2 block text-xs font-medium text-slate-600">People</label>
          <div className="relative rounded-md border border-slate-200 bg-white px-3 py-2">
            {selectedPeople.length > 0 ? (
              <div className="mb-2 flex flex-wrap gap-2">
                {selectedPeople.map((person) => (
                  <span key={person.id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                    {person.name}
                    <button className="material-symbols-outlined text-sm text-slate-500" onClick={() => onRemovePerson(person.id)} type="button">
                      close
                    </button>
                  </span>
                ))}
              </div>
            ) : null}

            <input
              className="w-full border-none p-0 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:ring-0"
              placeholder="Search people"
              type="text"
              value={peopleQuery}
              onChange={(event) => onPeopleQueryChange(event.target.value)}
            />

            {(isPeopleLoading || peopleSuggestions.length > 0) && peopleQuery.trim().length >= 2 ? (
              <div className="absolute inset-x-0 top-full z-20 mt-2 rounded-md border border-slate-200 bg-white shadow-lg">
                {isPeopleLoading ? (
                  <div className="px-3 py-3 text-sm text-slate-500">Searching…</div>
                ) : (
                  <ul className="max-h-64 overflow-y-auto py-1">
                    {peopleSuggestions.map((person) => (
                      <li key={person.id}>
                        <button
                          className="flex w-full flex-col gap-2 px-3 py-3 text-left hover:bg-slate-50"
                          onClick={() => onSelectPerson(person)}
                          type="button"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-sm font-medium text-slate-900">{person.name}</span>
                            <span className="text-xs text-slate-400">{person.movieCount} titles</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {person.roles.map((role) => (
                              <span key={role} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                                {formatPersonRole(role)}
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

        <section>
          <label className="mb-2 block text-xs font-medium text-slate-600">Companies</label>
          <div className="relative rounded-md border border-slate-200 bg-white px-3 py-2">
            {selectedCompanies.length > 0 ? (
              <div className="mb-2 flex flex-wrap gap-2">
                {selectedCompanies.map((company) => (
                  <span key={company.id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                    {company.name}
                    <button className="material-symbols-outlined text-sm text-slate-500" onClick={() => onRemoveCompany(company.id)} type="button">
                      close
                    </button>
                  </span>
                ))}
              </div>
            ) : null}

            <input
              className="w-full border-none p-0 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:ring-0"
              placeholder="Search companies"
              type="text"
              value={companyQuery}
              onChange={(event) => onCompanyQueryChange(event.target.value)}
            />

            {(isCompanyLoading || companySuggestions.length > 0) && companyQuery.trim().length >= 2 ? (
              <div className="absolute inset-x-0 top-full z-20 mt-2 rounded-md border border-slate-200 bg-white shadow-lg">
                {isCompanyLoading ? (
                  <div className="px-3 py-3 text-sm text-slate-500">Searching…</div>
                ) : (
                  <ul className="max-h-64 overflow-y-auto py-1">
                    {companySuggestions.map((company) => (
                      <li key={company.id}>
                        <button
                          className="flex w-full flex-col gap-2 px-3 py-3 text-left hover:bg-slate-50"
                          onClick={() => onSelectCompany(company)}
                          type="button"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-sm font-medium text-slate-900">{company.name}</span>
                            <span className="text-xs text-slate-400">{company.movieCount} titles</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {company.roles.map((role) => (
                              <span key={role} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                                {formatCompanyRole(role)}
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

        <NumericRangeSection
          label="Budget"
          value={budgetFilter}
          minInput={budgetMinInput}
          maxInput={budgetMaxInput}
          onKnownOnlyChange={(checked) => onBudgetFilterChange({ ...budgetFilter, knownOnly: checked })}
          onMinInputChange={onBudgetMinInputChange}
          onMaxInputChange={onBudgetMaxInputChange}
        />

        <NumericRangeSection
          label="Box office"
          value={boxOfficeFilter}
          minInput={boxOfficeMinInput}
          maxInput={boxOfficeMaxInput}
          onKnownOnlyChange={(checked) => onBoxOfficeFilterChange({ ...boxOfficeFilter, knownOnly: checked })}
          onMinInputChange={onBoxOfficeMinInputChange}
          onMaxInputChange={onBoxOfficeMaxInputChange}
        />
      </div>

      <div className="mt-auto pt-6">
        <button
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
          onClick={onClearAll}
          type="button"
        >
          Clear all
        </button>
      </div>
    </aside>
  );
}
