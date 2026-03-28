import { useEffect, useMemo, useState } from 'react';
import type { CompanySuggestion, NumericRangeFilter, PersonSuggestion } from '../../shared/types/archive';
import { DetailsPanel } from '../components/DetailsPanel';
import { FilterSidebar } from '../components/FilterSidebar';
import { MovieCard } from '../components/MovieCard';
import { Pagination } from '../components/Pagination';
import { TopBar } from '../components/TopBar';
import { useAutocompleteSuggestions } from '../hooks/useAutocompleteSuggestions';
import {
  buildGenreOptions,
  buildTypeOptions,
  buildYearOptions,
  filterArchiveMovies,
  normalize,
  type SortOption,
} from '../lib/archiveFilters';
import { ARCHIVE_INDEXED_COUNT, archiveMovies } from '../lib/mockData';
import { formatCompactNumber } from '../lib/formatters';
import { searchCompanies } from '../lib/companySearch';
import { searchPeople } from '../lib/peopleSearch';

const DEFAULT_YEARS: number[] = [];
const DEFAULT_GENRES: string[] = [];
const DEFAULT_FILM_TYPES: string[] = [];
const EMPTY_RANGE_FILTER: NumericRangeFilter = { knownOnly: false };
const FULL_DECADE_YEARS = Array.from({ length: 10 }, (_, index) => 1990 + index);

const BUDGET_PRESETS = {
  'Under $10M': { max: 10_000_000 },
  '$10M–$50M': { min: 10_000_000, max: 50_000_000 },
  '$50M+': { min: 50_000_000 },
} as const;

const BOX_OFFICE_PRESETS = {
  'Under $50M': { max: 50_000_000 },
  '$50M–$200M': { min: 50_000_000, max: 200_000_000 },
  '$200M+': { min: 200_000_000 },
} as const;

type BudgetPresetLabel = keyof typeof BUDGET_PRESETS;
type BoxOfficePresetLabel = keyof typeof BOX_OFFICE_PRESETS;

export function ArchivePage() {
  const [selectedYears, setSelectedYears] = useState<number[]>(DEFAULT_YEARS);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(DEFAULT_GENRES);
  const [selectedFilmTypes, setSelectedFilmTypes] = useState<string[]>(DEFAULT_FILM_TYPES);

  const [peopleQuery, setPeopleQuery] = useState('');
  const [selectedPeople, setSelectedPeople] = useState<PersonSuggestion[]>([]);

  const [companyQuery, setCompanyQuery] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState<CompanySuggestion[]>([]);

  const [budgetFilter, setBudgetFilter] = useState<NumericRangeFilter>(EMPTY_RANGE_FILTER);
  const [boxOfficeFilter, setBoxOfficeFilter] = useState<NumericRangeFilter>(EMPTY_RANGE_FILTER);
  const [selectedBudgetPreset, setSelectedBudgetPreset] = useState<BudgetPresetLabel | null>(null);
  const [selectedBoxOfficePreset, setSelectedBoxOfficePreset] = useState<BoxOfficePresetLabel | null>(null);

  const [sortValue, setSortValue] = useState<SortOption>('releaseDate');
  const [selectedMovieId, setSelectedMovieId] = useState<number>(2);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const years = useMemo(() => buildYearOptions(archiveMovies, FULL_DECADE_YEARS), []);
  const genreOptions = useMemo(() => buildGenreOptions(archiveMovies), []);
  const typeOptions = useMemo(() => buildTypeOptions(archiveMovies), []);

  const { suggestions: peopleSuggestions, isLoading: isPeopleLoading } = useAutocompleteSuggestions({
    query: peopleQuery,
    search: searchPeople,
    selectedItems: selectedPeople,
  });

  const { suggestions: companySuggestions, isLoading: isCompanyLoading } = useAutocompleteSuggestions({
    query: companyQuery,
    search: searchCompanies,
    selectedItems: selectedCompanies,
  });

  const selectedPeopleNames = useMemo(() => selectedPeople.map((person) => normalize(person.name)), [selectedPeople]);
  const selectedCompanyNames = useMemo(() => selectedCompanies.map((company) => normalize(company.name)), [selectedCompanies]);

  const filteredMovies = useMemo(
    () =>
      filterArchiveMovies(archiveMovies, {
        selectedYears,
        selectedGenres,
        selectedFilmTypes,
        selectedPeopleNames,
        selectedCompanyNames,
        budgetFilter,
        boxOfficeFilter,
        sortValue,
      }),
    [
      boxOfficeFilter,
      budgetFilter,
      selectedCompanyNames,
      selectedFilmTypes,
      selectedGenres,
      selectedPeopleNames,
      selectedYears,
      sortValue,
    ],
  );

  const totalPages = Math.max(1, Math.ceil(filteredMovies.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYears, selectedGenres, selectedFilmTypes, selectedPeople, selectedCompanies, budgetFilter, boxOfficeFilter, sortValue, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedMovies = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMovies.slice(start, start + pageSize);
  }, [currentPage, filteredMovies, pageSize]);

  const selectedMovie = paginatedMovies.find((movie) => movie.id === selectedMovieId) ?? paginatedMovies[0] ?? null;

  const toggleNumber = (values: number[], value: number) =>
    values.includes(value) ? values.filter((item) => item !== value) : [...values, value];

  const toggleString = (values: string[], value: string) =>
    values.includes(value) ? values.filter((item) => item !== value) : [...values, value];

  const clearAll = () => {
    setSelectedYears([]);
    setSelectedGenres([]);
    setSelectedFilmTypes([]);
    setPeopleQuery('');
    setSelectedPeople([]);
    setCompanyQuery('');
    setSelectedCompanies([]);
    setBudgetFilter(EMPTY_RANGE_FILTER);
    setBoxOfficeFilter(EMPTY_RANGE_FILTER);
    setSelectedBudgetPreset(null);
    setSelectedBoxOfficePreset(null);
    setSortValue('releaseDate');
  };

  const handleSelectPerson = (person: PersonSuggestion) => {
    setSelectedPeople((current) => [...current, person]);
    setPeopleQuery('');
  };

  const handleRemovePerson = (personId: string) => {
    setSelectedPeople((current) => current.filter((person) => person.id !== personId));
  };

  const handleSelectCompany = (company: CompanySuggestion) => {
    setSelectedCompanies((current) => [...current, company]);
    setCompanyQuery('');
  };

  const handleRemoveCompany = (companyId: string) => {
    setSelectedCompanies((current) => current.filter((company) => company.id !== companyId));
  };

  const handleBudgetPresetSelect = (presetLabel: string | null) => {
    if (!presetLabel) {
      setSelectedBudgetPreset(null);
      setBudgetFilter((current) => ({ knownOnly: current.knownOnly }));
      return;
    }

    const preset = BUDGET_PRESETS[presetLabel as BudgetPresetLabel];
    setSelectedBudgetPreset(presetLabel as BudgetPresetLabel);
    setBudgetFilter((current) => ({ ...preset, knownOnly: current.knownOnly }));
  };

  const handleBoxOfficePresetSelect = (presetLabel: string | null) => {
    if (!presetLabel) {
      setSelectedBoxOfficePreset(null);
      setBoxOfficeFilter((current) => ({ knownOnly: current.knownOnly }));
      return;
    }

    const preset = BOX_OFFICE_PRESETS[presetLabel as BoxOfficePresetLabel];
    setSelectedBoxOfficePreset(presetLabel as BoxOfficePresetLabel);
    setBoxOfficeFilter((current) => ({ ...preset, knownOnly: current.knownOnly }));
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface selection:bg-tertiary-container selection:text-on-tertiary-container">
      <TopBar />

      <FilterSidebar
        boxOfficeFilter={boxOfficeFilter}
        budgetFilter={budgetFilter}
        companyQuery={companyQuery}
        companySuggestions={companySuggestions}
        genreOptions={genreOptions}
        isCompanyLoading={isCompanyLoading}
        isPeopleLoading={isPeopleLoading}
        peopleQuery={peopleQuery}
        peopleSuggestions={peopleSuggestions}
        selectedBoxOfficePreset={selectedBoxOfficePreset}
        selectedBudgetPreset={selectedBudgetPreset}
        selectedCompanies={selectedCompanies}
        selectedFilmTypes={selectedFilmTypes}
        selectedGenres={selectedGenres}
        selectedPeople={selectedPeople}
        selectedYears={selectedYears}
        typeOptions={typeOptions}
        years={years}
        onBoxOfficeFilterChange={setBoxOfficeFilter}
        onBoxOfficePresetSelect={handleBoxOfficePresetSelect}
        onBudgetFilterChange={setBudgetFilter}
        onBudgetPresetSelect={handleBudgetPresetSelect}
        onClearAll={clearAll}
        onCompanyQueryChange={setCompanyQuery}
        onFilmTypeToggle={(value) => setSelectedFilmTypes((current) => toggleString(current, value))}
        onGenreToggle={(value) => setSelectedGenres((current) => toggleString(current, value))}
        onPeopleQueryChange={setPeopleQuery}
        onRemoveCompany={handleRemoveCompany}
        onRemovePerson={handleRemovePerson}
        onSelectCompany={handleSelectCompany}
        onSelectPerson={handleSelectPerson}
        onYearToggle={(value) => setSelectedYears((current) => toggleNumber(current, value))}
      />

      <main
        className={`mt-16 min-h-screen px-6 py-6 transition-[margin] duration-200 ease-out lg:ml-72 ${
          isDetailsPanelOpen ? 'lg:mr-[380px]' : 'lg:mr-0'
        }`}
      >
        <div className={`mx-auto transition-[max-width] duration-200 ease-out ${isDetailsPanelOpen ? 'max-w-4xl' : 'max-w-6xl'}`}>
          <div className="mb-8">
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">
                <span className="font-medium text-slate-900">{formatCompactNumber(filteredMovies.length)}</span> results
                <span className="mx-2 text-slate-300">/</span>
                <span>{formatCompactNumber(ARCHIVE_INDEXED_COUNT)} indexed</span>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-500" htmlFor="results-sort-order">
                  Sort by
                </label>
                <select
                  id="results-sort-order"
                  className="cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-primary"
                  value={sortValue}
                  onChange={(event) => setSortValue(event.target.value as SortOption)}
                >
                  <option value="releaseDate">Release date</option>
                  <option value="title">Title</option>
                  <option value="boxOffice">Box office</option>
                  <option value="budget">Budget</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {paginatedMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                selected={selectedMovie?.id === movie.id}
                onSelect={(nextMovie) => {
                  setSelectedMovieId(nextMovie.id);
                  setIsDetailsPanelOpen(true);
                }}
              />
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={filteredMovies.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </main>

      <DetailsPanel movie={selectedMovie} isOpen={isDetailsPanelOpen} onToggle={() => setIsDetailsPanelOpen((current) => !current)} />
    </div>
  );
}
