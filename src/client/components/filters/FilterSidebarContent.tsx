import type { CompanySuggestion, MovieCompanyRole, MoviePersonRole, NumericRangeFilter, PersonSuggestion } from '../../../shared/types/archive';
import type { SelectOption, YearOption } from '../../lib/archiveFilters';
import { formatFilmType } from '../../lib/formatters';
import { AutocompleteFilterSection } from './AutocompleteFilterSection';
import { FinancialFilterSection } from './FinancialFilterSection';
import { RatingFilterSection } from './RatingFilterSection';
import { SelectFilterSection } from './SelectFilterSection';
import { VoteCountFilterSection } from './VoteCountFilterSection';
import { YearFilterSection } from './YearFilterSection';

interface FilterSidebarContentProps {
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
  imdbRatingFilter: NumericRangeFilter;
  imdbVoteCountFilter: NumericRangeFilter;
  selectedBudgetPreset: string | null;
  selectedBoxOfficePreset: string | null;
  selectedRatingPreset: string | null;
  selectedVotePreset: string | null;
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
  onImdbRatingFilterChange: (next: NumericRangeFilter) => void;
  onImdbVoteCountFilterChange: (next: NumericRangeFilter) => void;
  onRatingPresetSelect: (presetLabel: string | null) => void;
  onVotePresetSelect: (presetLabel: string | null) => void;
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

const RATING_PRESETS = [
  { label: '5.0+', min: 5 },
  { label: '7.0+', min: 7 },
  { label: '8.0+', min: 8 },
];

const VOTE_PRESETS = [
  { label: '1K+', min: 1_000 },
  { label: '10K+', min: 10_000 },
  { label: '100K+', min: 100_000 },
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

export function FilterSidebarContent({
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
  imdbRatingFilter,
  imdbVoteCountFilter,
  selectedBudgetPreset,
  selectedBoxOfficePreset,
  selectedRatingPreset,
  selectedVotePreset,
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
  onImdbRatingFilterChange,
  onImdbVoteCountFilterChange,
  onRatingPresetSelect,
  onVotePresetSelect,
  onClearAll,
}: FilterSidebarContentProps) {
  return (
    <>
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
          getLabel={formatFilmType}
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

        <RatingFilterSection
          imdbRatingFilter={imdbRatingFilter}
          ratingPresets={RATING_PRESETS}
          selectedRatingPreset={selectedRatingPreset}
          onKnownOnlyChange={(checked) => onImdbRatingFilterChange({ ...imdbRatingFilter, knownOnly: checked })}
          onPresetSelect={onRatingPresetSelect}
        />

        <VoteCountFilterSection
          imdbVoteCountFilter={imdbVoteCountFilter}
          selectedVotePreset={selectedVotePreset}
          votePresets={VOTE_PRESETS}
          onKnownOnlyChange={(checked) => onImdbVoteCountFilterChange({ ...imdbVoteCountFilter, knownOnly: checked })}
          onPresetSelect={onVotePresetSelect}
        />
      </div>

      <div className="mt-auto pt-6">
        <button
          className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-100"
          onClick={onClearAll}
          type="button"
        >
          Clear all
        </button>
      </div>
    </>
  );
}
