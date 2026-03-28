import type { CompanySuggestion, NumericRangeFilter, PersonSuggestion } from '../../shared/types/archive';
import type { SelectOption, YearOption } from '../lib/archiveFilters';
import { FilterSidebarContent } from './filters/FilterSidebarContent';

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

export function FilterSidebar(props: FilterSidebarProps) {
  return (
    <aside className="neo-sidebar fixed left-0 top-16 bottom-0 hidden w-80 flex-col overflow-y-auto border-r px-5 py-5 lg:flex">
      <FilterSidebarContent {...props} />
    </aside>
  );
}
