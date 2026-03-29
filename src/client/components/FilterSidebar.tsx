import type { CompanySuggestion, PersonSuggestion } from '../../shared/types/archive';
import type { SelectOption, YearOption } from '../lib/archiveFilters';
import { FilterSidebarContent } from './filters/FilterSidebarContent';

interface FilterSidebarProps {
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

export function FilterSidebar(props: FilterSidebarProps) {
  return (
    <aside className="neo-sidebar fixed left-0 top-16 bottom-0 hidden w-[22rem] flex-col overflow-y-auto border-r px-5 py-5 lg:flex">
      <FilterSidebarContent {...props} />
    </aside>
  );
}
