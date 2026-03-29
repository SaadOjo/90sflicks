import type { CompanySuggestion, MovieCompanyRole, MoviePersonRole, PersonSuggestion } from '../../../shared/types/archive';
import type { SelectOption, YearOption } from '../../lib/archiveFilters';
import { formatFilmType } from '../../lib/formatters';
import { AutocompleteFilterSection } from './AutocompleteFilterSection';
import { SelectFilterSection } from './SelectFilterSection';
import { YearFilterSection } from './YearFilterSection';

interface FilterSidebarContentProps {
  selectedYears: number[];
  selectedGenres: string[];
  selectedFilmTypes: string[];
  selectedBudgetBuckets: string[];
  selectedBoxOfficeBuckets: string[];
  selectedImdbRatingBuckets: string[];
  selectedImdbVoteCountBuckets: string[];
  years: YearOption[];
  genreOptions: SelectOption[];
  typeOptions: SelectOption[];
  budgetBucketOptions: SelectOption[];
  boxOfficeBucketOptions: SelectOption[];
  imdbRatingBucketOptions: SelectOption[];
  imdbVoteCountBucketOptions: SelectOption[];
  peopleQuery: string;
  selectedPeople: PersonSuggestion[];
  peopleSuggestions: PersonSuggestion[];
  isPeopleLoading: boolean;
  companyQuery: string;
  selectedCompanies: CompanySuggestion[];
  companySuggestions: CompanySuggestion[];
  isCompanyLoading: boolean;
  onYearToggle: (year: number) => void;
  onGenreToggle: (genre: string) => void;
  onFilmTypeToggle: (filmType: string) => void;
  onBudgetBucketToggle: (bucket: string) => void;
  onBoxOfficeBucketToggle: (bucket: string) => void;
  onImdbRatingBucketToggle: (bucket: string) => void;
  onImdbVoteCountBucketToggle: (bucket: string) => void;
  onPeopleQueryChange: (value: string) => void;
  onSelectPerson: (person: PersonSuggestion) => void;
  onRemovePerson: (personId: string) => void;
  onCompanyQueryChange: (value: string) => void;
  onSelectCompany: (company: CompanySuggestion) => void;
  onRemoveCompany: (companyId: string) => void;
  onClearAll: () => void;
}

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
  selectedBudgetBuckets,
  selectedBoxOfficeBuckets,
  selectedImdbRatingBuckets,
  selectedImdbVoteCountBuckets,
  years,
  genreOptions,
  typeOptions,
  budgetBucketOptions,
  boxOfficeBucketOptions,
  imdbRatingBucketOptions,
  imdbVoteCountBucketOptions,
  peopleQuery,
  selectedPeople,
  peopleSuggestions,
  isPeopleLoading,
  companyQuery,
  selectedCompanies,
  companySuggestions,
  isCompanyLoading,
  onYearToggle,
  onGenreToggle,
  onFilmTypeToggle,
  onBudgetBucketToggle,
  onBoxOfficeBucketToggle,
  onImdbRatingBucketToggle,
  onImdbVoteCountBucketToggle,
  onPeopleQueryChange,
  onSelectPerson,
  onRemovePerson,
  onCompanyQueryChange,
  onSelectCompany,
  onRemoveCompany,
  onClearAll,
}: FilterSidebarContentProps) {
  return (
    <>
      <div className="mb-2 flex justify-end">
        <span className="material-symbols-outlined text-base text-slate-400">tune</span>
      </div>

      <div className="divide-y divide-slate-200 [&>section]:py-6 [&>section:first-child]:pt-0 [&>section:last-child]:pb-0">
        <YearFilterSection selectedYears={selectedYears} years={years} onYearToggle={onYearToggle} />

        <SelectFilterSection emptyLabel="All genres" options={genreOptions} selectedValues={selectedGenres} title="Genres" onToggle={onGenreToggle} />

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

        <SelectFilterSection
          emptyLabel="All budgets"
          options={budgetBucketOptions}
          selectedValues={selectedBudgetBuckets}
          title="Budget"
          onToggle={onBudgetBucketToggle}
        />

        <SelectFilterSection
          emptyLabel="All box office"
          options={boxOfficeBucketOptions}
          selectedValues={selectedBoxOfficeBuckets}
          title="Box office"
          onToggle={onBoxOfficeBucketToggle}
        />

        <SelectFilterSection
          emptyLabel="All ratings"
          options={imdbRatingBucketOptions}
          selectedValues={selectedImdbRatingBuckets}
          title="IMDb rating"
          onToggle={onImdbRatingBucketToggle}
        />

        <SelectFilterSection
          emptyLabel="All vote counts"
          options={imdbVoteCountBucketOptions}
          selectedValues={selectedImdbVoteCountBuckets}
          title="IMDb votes"
          onToggle={onImdbVoteCountBucketToggle}
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
