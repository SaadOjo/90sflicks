import { useState } from 'react';
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

interface RangePreset {
  label: string;
  min?: number;
  max?: number;
}

interface FinancialFilterSectionProps {
  budgetFilter: NumericRangeFilter;
  boxOfficeFilter: NumericRangeFilter;
  selectedBudgetPreset: string | null;
  selectedBoxOfficePreset: string | null;
  budgetPresets: RangePreset[];
  boxOfficePresets: RangePreset[];
  onBudgetKnownOnlyChange: (checked: boolean) => void;
  onBoxOfficeKnownOnlyChange: (checked: boolean) => void;
  onBudgetPresetSelect: (presetLabel: string | null) => void;
  onBoxOfficePresetSelect: (presetLabel: string | null) => void;
}

interface FilterSidebarProps {
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
  boxOfficeFilter: NumericRangeFilter;
  selectedBudgetPreset: string | null;
  selectedBoxOfficePreset: string | null;
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
  onBoxOfficeFilterChange: (next: NumericRangeFilter) => void;
  onBudgetPresetSelect: (presetLabel: string | null) => void;
  onBoxOfficePresetSelect: (presetLabel: string | null) => void;
  onClearAll: () => void;
}

const BUDGET_PRESETS: RangePreset[] = [
  { label: 'Under $10M', max: 10_000_000 },
  { label: '$10M–$50M', min: 10_000_000, max: 50_000_000 },
  { label: '$50M+', min: 50_000_000 },
];

const BOX_OFFICE_PRESETS: RangePreset[] = [
  { label: 'Under $50M', max: 50_000_000 },
  { label: '$50M–$200M', min: 50_000_000, max: 200_000_000 },
  { label: '$200M+', min: 200_000_000 },
];

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

function PresetChips({
  presets,
  selectedLabel,
  onSelect,
}: {
  presets: RangePreset[];
  selectedLabel: string | null;
  onSelect: (label: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((preset) => {
        const active = selectedLabel === preset.label;
        return (
          <button
            key={preset.label}
            className={
              active
                ? 'rounded-full bg-primary px-3 py-1 text-xs font-medium text-white'
                : 'rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100'
            }
            onClick={() => onSelect(active ? null : preset.label)}
            type="button"
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}

function FinancialFilterSection({
  budgetFilter,
  boxOfficeFilter,
  selectedBudgetPreset,
  selectedBoxOfficePreset,
  budgetPresets,
  boxOfficePresets,
  onBudgetKnownOnlyChange,
  onBoxOfficeKnownOnlyChange,
  onBudgetPresetSelect,
  onBoxOfficePresetSelect,
}: FinancialFilterSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section>
      <button
        className="flex w-full items-center justify-between border-b border-slate-200 pb-2 text-left text-xs font-medium text-slate-600"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span>Financials</span>
        <span className="material-symbols-outlined text-base text-slate-400">{isOpen ? 'expand_less' : 'expand_more'}</span>
      </button>

      {isOpen ? (
        <div className="mt-3 space-y-4 rounded-md border border-slate-200 bg-white p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Budget</span>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  checked={budgetFilter.knownOnly}
                  className="h-3.5 w-3.5 rounded-sm border-slate-300 text-primary focus:ring-0"
                  type="checkbox"
                  onChange={(event) => onBudgetKnownOnlyChange(event.target.checked)}
                />
                Known only
              </label>
            </div>
            <PresetChips presets={budgetPresets} selectedLabel={selectedBudgetPreset} onSelect={onBudgetPresetSelect} />
          </div>

          <div className="space-y-2 border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Box office</span>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  checked={boxOfficeFilter.knownOnly}
                  className="h-3.5 w-3.5 rounded-sm border-slate-300 text-primary focus:ring-0"
                  type="checkbox"
                  onChange={(event) => onBoxOfficeKnownOnlyChange(event.target.checked)}
                />
                Known only
              </label>
            </div>
            <PresetChips presets={boxOfficePresets} selectedLabel={selectedBoxOfficePreset} onSelect={onBoxOfficePresetSelect} />
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function FilterSidebar({
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
  boxOfficeFilter,
  selectedBudgetPreset,
  selectedBoxOfficePreset,
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
  onBoxOfficeFilterChange,
  onBudgetPresetSelect,
  onBoxOfficePresetSelect,
  onClearAll,
}: FilterSidebarProps) {
  return (
    <aside className="fixed left-0 top-16 bottom-0 flex w-72 flex-col overflow-y-auto border-r border-slate-200/80 bg-slate-50 px-5 py-5">
      <div className="mb-2 flex justify-end">
        <span className="material-symbols-outlined text-base text-slate-400">tune</span>
      </div>

      <div className="space-y-6">
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
          <label className="mb-2 block text-xs font-medium text-slate-600">Type</label>
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

        <FinancialFilterSection
          boxOfficeFilter={boxOfficeFilter}
          budgetFilter={budgetFilter}
          selectedBudgetPreset={selectedBudgetPreset}
          selectedBoxOfficePreset={selectedBoxOfficePreset}
          budgetPresets={BUDGET_PRESETS}
          boxOfficePresets={BOX_OFFICE_PRESETS}
          onBudgetKnownOnlyChange={(checked) => onBudgetFilterChange({ ...budgetFilter, knownOnly: checked })}
          onBoxOfficeKnownOnlyChange={(checked) => onBoxOfficeFilterChange({ ...boxOfficeFilter, knownOnly: checked })}
          onBudgetPresetSelect={onBudgetPresetSelect}
          onBoxOfficePresetSelect={onBoxOfficePresetSelect}
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
