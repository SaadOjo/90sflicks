import type { CompanySuggestion, PersonSuggestion } from '../../shared/types/archive';
import type { SelectOption, YearOption } from '../lib/archiveFilters';
import { FilterSidebarContent } from './filters/FilterSidebarContent';

interface MobileFilterDrawerProps {
  isOpen: boolean;
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
  onClose: () => void;
}

export function MobileFilterDrawer({ isOpen, onClose, ...contentProps }: MobileFilterDrawerProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
      <button className="absolute inset-0 bg-slate-950/35" onClick={onClose} type="button" aria-label="Close filters" />

      <aside className="neo-sidebar absolute inset-x-0 bottom-0 top-16 flex flex-col overflow-y-auto border-t px-5 py-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-headline text-lg font-semibold tracking-[0.06em] text-slate-900">Filters</h2>
          <button className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <FilterSidebarContent {...contentProps} />
      </aside>
    </div>
  );
}
