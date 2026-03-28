import { useEffect, useMemo, useState } from 'react';
import type { CompanySuggestion, NumericRangeFilter, PersonSuggestion } from '../../shared/types/archive';
import { DetailsPanel } from '../components/DetailsPanel';
import { FilterSidebar } from '../components/FilterSidebar';
import { MovieCard } from '../components/MovieCard';
import { Pagination } from '../components/Pagination';
import { TopBar } from '../components/TopBar';
import { ARCHIVE_INDEXED_COUNT, archiveMovies } from '../lib/mockData';
import { formatCompactNumber, parseAmountInput } from '../lib/formatters';
import { searchCompanies } from '../lib/companySearch';
import { searchPeople } from '../lib/peopleSearch';

const DEFAULT_YEARS: number[] = [];
const DEFAULT_GENRES: string[] = [];
const DEFAULT_FILM_TYPES: string[] = [];
const EMPTY_RANGE_FILTER: NumericRangeFilter = { knownOnly: false };

type SortOption = 'releaseDate' | 'title' | 'boxOffice' | 'budget';

function toFilmTypeLabel(value?: string): string {
  if (!value) return 'Unknown';
  return value === 'movie' ? 'Movie' : value.charAt(0).toUpperCase() + value.slice(1);
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function matchesNumericRange(value: number | undefined, filter: NumericRangeFilter): boolean {
  if (filter.knownOnly && value == null) {
    return false;
  }

  if (filter.min != null || filter.max != null) {
    if (value == null) return false;
    if (filter.min != null && value < filter.min) return false;
    if (filter.max != null && value > filter.max) return false;
  }

  return true;
}

export function ArchivePage() {
  const [search, setSearch] = useState('');
  const [selectedYears, setSelectedYears] = useState<number[]>(DEFAULT_YEARS);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(DEFAULT_GENRES);
  const [selectedFilmTypes, setSelectedFilmTypes] = useState<string[]>(DEFAULT_FILM_TYPES);

  const [peopleQuery, setPeopleQuery] = useState('');
  const [selectedPeople, setSelectedPeople] = useState<PersonSuggestion[]>([]);
  const [peopleSuggestions, setPeopleSuggestions] = useState<PersonSuggestion[]>([]);
  const [isPeopleLoading, setIsPeopleLoading] = useState(false);

  const [companyQuery, setCompanyQuery] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState<CompanySuggestion[]>([]);
  const [companySuggestions, setCompanySuggestions] = useState<CompanySuggestion[]>([]);
  const [isCompanyLoading, setIsCompanyLoading] = useState(false);

  const [budgetMinInput, setBudgetMinInput] = useState('');
  const [budgetMaxInput, setBudgetMaxInput] = useState('');
  const [boxOfficeMinInput, setBoxOfficeMinInput] = useState('');
  const [boxOfficeMaxInput, setBoxOfficeMaxInput] = useState('');
  const [budgetFilter, setBudgetFilter] = useState<NumericRangeFilter>(EMPTY_RANGE_FILTER);
  const [boxOfficeFilter, setBoxOfficeFilter] = useState<NumericRangeFilter>(EMPTY_RANGE_FILTER);

  const [sortValue, setSortValue] = useState<SortOption>('releaseDate');
  const [selectedMovieId, setSelectedMovieId] = useState<number>(2);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const years = useMemo(() => {
    const counts = new Map<number, number>();
    archiveMovies.forEach((movie) => {
      counts.set(movie.releaseYear, (counts.get(movie.releaseYear) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([year, count]) => ({ year, count }));
  }, []);

  const genres = useMemo(
    () => Array.from(new Set(archiveMovies.flatMap((movie) => movie.genres))).sort((a, b) => a.localeCompare(b)),
    [],
  );

  const filmTypes = useMemo(
    () => Array.from(new Set(archiveMovies.map((movie) => toFilmTypeLabel(movie.filmType)))).sort((a, b) => a.localeCompare(b)),
    [],
  );

  useEffect(() => {
    setBudgetFilter((current) => ({ ...current, min: parseAmountInput(budgetMinInput), max: parseAmountInput(budgetMaxInput) }));
  }, [budgetMinInput, budgetMaxInput]);

  useEffect(() => {
    setBoxOfficeFilter((current) => ({
      ...current,
      min: parseAmountInput(boxOfficeMinInput),
      max: parseAmountInput(boxOfficeMaxInput),
    }));
  }, [boxOfficeMinInput, boxOfficeMaxInput]);

  useEffect(() => {
    const query = peopleQuery.trim();
    if (query.length < 2) {
      setPeopleSuggestions([]);
      setIsPeopleLoading(false);
      return;
    }

    let cancelled = false;
    setIsPeopleLoading(true);

    const timeoutId = window.setTimeout(async () => {
      const results = await searchPeople(query);
      if (!cancelled) {
        const selectedIds = new Set(selectedPeople.map((person) => person.id));
        setPeopleSuggestions(results.filter((person) => !selectedIds.has(person.id)));
        setIsPeopleLoading(false);
      }
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [peopleQuery, selectedPeople]);

  useEffect(() => {
    const query = companyQuery.trim();
    if (query.length < 2) {
      setCompanySuggestions([]);
      setIsCompanyLoading(false);
      return;
    }

    let cancelled = false;
    setIsCompanyLoading(true);

    const timeoutId = window.setTimeout(async () => {
      const results = await searchCompanies(query);
      if (!cancelled) {
        const selectedIds = new Set(selectedCompanies.map((company) => company.id));
        setCompanySuggestions(results.filter((company) => !selectedIds.has(company.id)));
        setIsCompanyLoading(false);
      }
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [companyQuery, selectedCompanies]);

  const filteredMovies = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const selectedPeopleNames = selectedPeople.map((person) => normalize(person.name));
    const selectedCompanyNames = selectedCompanies.map((company) => normalize(company.name));

    const filtered = archiveMovies.filter((movie) => {
      const titleMatch = !normalizedSearch || movie.title.toLowerCase().includes(normalizedSearch);
      const yearMatch = selectedYears.length === 0 || selectedYears.includes(movie.releaseYear);
      const genreMatch = selectedGenres.length === 0 || selectedGenres.some((genre) => movie.genres.includes(genre));
      const filmTypeLabel = toFilmTypeLabel(movie.filmType);
      const filmTypeMatch = selectedFilmTypes.length === 0 || selectedFilmTypes.includes(filmTypeLabel);
      const peopleMatch =
        selectedPeopleNames.length === 0 ||
        movie.credits.some((credit) => selectedPeopleNames.includes(normalize(credit.name)));
      const companyMatch =
        selectedCompanyNames.length === 0 ||
        movie.companies.some((company) => selectedCompanyNames.includes(normalize(company.name)));
      const budgetMatch = matchesNumericRange(movie.budget, budgetFilter);
      const boxOfficeMatch = matchesNumericRange(movie.boxOffice, boxOfficeFilter);

      return titleMatch && yearMatch && genreMatch && filmTypeMatch && peopleMatch && companyMatch && budgetMatch && boxOfficeMatch;
    });

    filtered.sort((left, right) => {
      switch (sortValue) {
        case 'title':
          return left.title.localeCompare(right.title);
        case 'boxOffice':
          return (right.boxOffice ?? -1) - (left.boxOffice ?? -1);
        case 'budget':
          return (right.budget ?? -1) - (left.budget ?? -1);
        case 'releaseDate':
        default:
          return (right.releaseDate ?? '').localeCompare(left.releaseDate ?? '');
      }
    });

    return filtered;
  }, [
    search,
    selectedYears,
    selectedGenres,
    selectedFilmTypes,
    selectedPeople,
    selectedCompanies,
    budgetFilter,
    boxOfficeFilter,
    sortValue,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredMovies.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedYears, selectedGenres, selectedFilmTypes, selectedPeople, selectedCompanies, budgetFilter, boxOfficeFilter, sortValue, pageSize]);

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
    setSearch('');
    setSelectedYears([]);
    setSelectedGenres([]);
    setSelectedFilmTypes([]);
    setPeopleQuery('');
    setSelectedPeople([]);
    setPeopleSuggestions([]);
    setCompanyQuery('');
    setSelectedCompanies([]);
    setCompanySuggestions([]);
    setBudgetMinInput('');
    setBudgetMaxInput('');
    setBoxOfficeMinInput('');
    setBoxOfficeMaxInput('');
    setBudgetFilter(EMPTY_RANGE_FILTER);
    setBoxOfficeFilter(EMPTY_RANGE_FILTER);
    setSortValue('releaseDate');
  };

  const handleSelectPerson = (person: PersonSuggestion) => {
    setSelectedPeople((current) => [...current, person]);
    setPeopleQuery('');
    setPeopleSuggestions([]);
  };

  const handleRemovePerson = (personId: string) => {
    setSelectedPeople((current) => current.filter((person) => person.id !== personId));
  };

  const handleSelectCompany = (company: CompanySuggestion) => {
    setSelectedCompanies((current) => [...current, company]);
    setCompanyQuery('');
    setCompanySuggestions([]);
  };

  const handleRemoveCompany = (companyId: string) => {
    setSelectedCompanies((current) => current.filter((company) => company.id !== companyId));
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface selection:bg-tertiary-container selection:text-on-tertiary-container">
      <TopBar />

      <FilterSidebar
        boxOfficeFilter={boxOfficeFilter}
        boxOfficeMaxInput={boxOfficeMaxInput}
        boxOfficeMinInput={boxOfficeMinInput}
        budgetFilter={budgetFilter}
        budgetMaxInput={budgetMaxInput}
        budgetMinInput={budgetMinInput}
        companyQuery={companyQuery}
        companySuggestions={companySuggestions}
        filmTypes={filmTypes}
        genres={genres}
        isCompanyLoading={isCompanyLoading}
        isPeopleLoading={isPeopleLoading}
        peopleQuery={peopleQuery}
        peopleSuggestions={peopleSuggestions}
        search={search}
        selectedCompanies={selectedCompanies}
        selectedFilmTypes={selectedFilmTypes}
        selectedGenres={selectedGenres}
        selectedPeople={selectedPeople}
        selectedYears={selectedYears}
        years={years}
        onBoxOfficeFilterChange={setBoxOfficeFilter}
        onBoxOfficeMaxInputChange={setBoxOfficeMaxInput}
        onBoxOfficeMinInputChange={setBoxOfficeMinInput}
        onBudgetFilterChange={setBudgetFilter}
        onBudgetMaxInputChange={setBudgetMaxInput}
        onBudgetMinInputChange={setBudgetMinInput}
        onClearAll={clearAll}
        onCompanyQueryChange={setCompanyQuery}
        onFilmTypeToggle={(value) => setSelectedFilmTypes((current) => toggleString(current, value))}
        onGenreToggle={(value) => setSelectedGenres((current) => toggleString(current, value))}
        onPeopleQueryChange={setPeopleQuery}
        onRemoveCompany={handleRemoveCompany}
        onRemovePerson={handleRemovePerson}
        onSearchChange={setSearch}
        onSelectCompany={handleSelectCompany}
        onSelectPerson={handleSelectPerson}
        onYearToggle={(value) => setSelectedYears((current) => toggleNumber(current, value))}
      />

      <main className={`mt-16 min-h-screen px-6 py-6 lg:ml-72 ${isDetailsPanelOpen ? 'lg:mr-[380px]' : 'lg:mr-0'}`}>
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex flex-col gap-4">
            <div>
              <h1 className="font-headline text-4xl font-semibold text-slate-900">Browse results</h1>
              <p className="mt-1 text-sm text-slate-500">Filter and inspect titles from the archive.</p>
            </div>

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
