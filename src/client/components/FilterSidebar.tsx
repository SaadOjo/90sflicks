import type { CompanySuggestion, MovieCompanyRole, MoviePersonRole, NumericRangeFilter, PersonSuggestion } from '../../shared/types/archive';
import type { SelectOption, YearOption } from '../lib/archiveFilters';
import { AutocompleteFilterSection } from './filters/AutocompleteFilterSection';
import { FinancialFilterSection } from './filters/FinancialFilterSection';
import { SelectFilterSection } from './filters/SelectFilterSection';
import { YearFilterSection } from './filters/YearFilterSection';

interface FilterSidebarProps {
  selectedYears: number[];
  selectedGenres: string[];
  selectedFilmTypes: string[];
  years: YearOption[];
  genreOptions: SelectOption[];
  typeOptions: SelectOption[];
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

const BUDGET_PRESETS = [
  { label: 'Under $10M', max: 10_000_000 },
  { label: '$10M–$50M', min: 10_000_000, max: 50_000_000 },
  { label: '$50M+', min: 50_000_000 },
];

const BOX_OFFICE_PRESETS = [
  { label: 'Under $50M', max: 50_000_000 },
  { label: '$50M–$200M', min: 50_000_000, max: 200_000_000 },
  { label: '$200M+', min: 200_000_000 },
];

function formatPersonRole(role: string): string {
  switch (role as MoviePersonRole) {
    case 'director':
      return 'Director';
    case 'writer':
      return 'Writer';
    case 'producer':
      return 'Producer';
    case 'cast':
      return 'Cast';
    default:
      return role;
  }
}

function formatCompanyRole(role: string): string {
  switch (role as MovieCompanyRole) {
    case 'production':
      return 'Production';
    case 'distribution':
      return 'Distribution';
    default:
      return role;
  }
}

export function FilterSidebar({
  selectedYears,
  selectedGenres,
  selectedFilmTypes,
  years,
  genreOptions,
  typeOptions,
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

      <div className="divide-y divide-slate-200 [&>section]:py-6 [&>section:first-child]:pt-0 [&>section:last-child]:pb-0">
        <YearFilterSection selectedYears={selectedYears} years={years} onYearToggle={onYearToggle} />

        <SelectFilterSection
          emptyLabel="All genres"
          options={genreOptions}
          selectedValues={selectedGenres}
          title="Genres"
          onToggle={onGenreToggle}
        />

        <SelectFilterSection
          emptyLabel="All types"
          options={typeOptions}
          selectedValues={selectedFilmTypes}
          title="Type"
          onToggle={onFilmTypeToggle}
        />

        <AutocompleteFilterSection
          formatRole={formatPersonRole}
          isLoading={isPeopleLoading}
          placeholder="Search people"
          query={peopleQuery}
          selectedItems={selectedPeople}
          suggestions={peopleSuggestions}
          title="People"
          onQueryChange={onPeopleQueryChange}
          onRemove={onRemovePerson}
          onSelect={onSelectPerson}
        />

        <AutocompleteFilterSection
          formatRole={formatCompanyRole}
          isLoading={isCompanyLoading}
          placeholder="Search companies"
          query={companyQuery}
          selectedItems={selectedCompanies}
          suggestions={companySuggestions}
          title="Companies"
          onQueryChange={onCompanyQueryChange}
          onRemove={onRemoveCompany}
          onSelect={onSelectCompany}
        />

        <FinancialFilterSection
          boxOfficeFilter={boxOfficeFilter}
          boxOfficePresets={BOX_OFFICE_PRESETS}
          budgetFilter={budgetFilter}
          budgetPresets={BUDGET_PRESETS}
          selectedBoxOfficePreset={selectedBoxOfficePreset}
          selectedBudgetPreset={selectedBudgetPreset}
          onBoxOfficeKnownOnlyChange={(checked) => onBoxOfficeFilterChange({ ...boxOfficeFilter, knownOnly: checked })}
          onBoxOfficePresetSelect={onBoxOfficePresetSelect}
          onBudgetKnownOnlyChange={(checked) => onBudgetFilterChange({ ...budgetFilter, knownOnly: checked })}
          onBudgetPresetSelect={onBudgetPresetSelect}
        />
      </div>

      <div className="mt-auto pt-6">
        <button
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
          onClick={onClearAll}
          type="button"
        >
          Clear all
        </button>
      </div>
    </aside>
  );
}
