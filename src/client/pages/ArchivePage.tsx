import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ArchiveMovie, CompanySuggestion, NumericRangeFilter, PersonSuggestion } from '../../shared/types/archive';
import type { ArchiveFacetsResponse, ArchiveMoviesResponse } from '../../shared/types/api';
import { DetailsPanel } from '../components/DetailsPanel';
import { FilterSidebar } from '../components/FilterSidebar';
import { MobileDetailsDrawer } from '../components/MobileDetailsDrawer';
import { MobileFilterDrawer } from '../components/MobileFilterDrawer';
import { MovieCard } from '../components/MovieCard';
import { Pagination } from '../components/Pagination';
import { TopBar } from '../components/TopBar';
import { useAutocompleteSuggestions } from '../hooks/useAutocompleteSuggestions';
import type { SelectOption, SortOption, YearOption } from '../lib/archiveFilters';
import { fetchArchiveFacets, fetchArchiveMovieById, fetchArchiveMovies, type ArchiveRequestFilters } from '../lib/archiveApi';
import { formatCompactNumber } from '../lib/formatters';
import { searchCompanies } from '../lib/companySearch';
import { searchPeople } from '../lib/peopleSearch';

const DEFAULT_YEARS: number[] = [];
const DEFAULT_GENRES: string[] = [];
const DEFAULT_FILM_TYPES: string[] = [];
const EMPTY_RANGE_FILTER: NumericRangeFilter = { knownOnly: false };
const FULL_DECADE_YEARS = Array.from({ length: 10 }, (_, index) => 1990 + index);

const EMPTY_ARCHIVE_RESPONSE: ArchiveMoviesResponse = {
  items: [],
  totalItems: 0,
  totalPages: 1,
  page: 1,
  pageSize: 25,
};

const EMPTY_FACETS_RESPONSE: ArchiveFacetsResponse = {
  indexedCount: 0,
  years: FULL_DECADE_YEARS.map((year) => ({ year, count: 0 })),
  genres: [],
  filmTypes: [],
};

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

const IMDB_RATING_PRESETS = {
  '5.0+': { min: 5 },
  '7.0+': { min: 7 },
  '8.0+': { min: 8 },
} as const;

const IMDB_VOTE_PRESETS = {
  '1K+': { min: 1_000 },
  '10K+': { min: 10_000 },
  '100K+': { min: 100_000 },
} as const;

type BudgetPresetLabel = keyof typeof BUDGET_PRESETS;
type BoxOfficePresetLabel = keyof typeof BOX_OFFICE_PRESETS;
type ImdbRatingPresetLabel = keyof typeof IMDB_RATING_PRESETS;
type ImdbVotePresetLabel = keyof typeof IMDB_VOTE_PRESETS;

function mergeFullDecadeYears(years: ArchiveFacetsResponse['years']): YearOption[] {
  const countByYear = new Map(years.map((item) => [item.year, item.count]));
  return FULL_DECADE_YEARS.map((year) => ({ year, count: countByYear.get(year) ?? 0 }));
}

function mapGenreOptions(facets: ArchiveFacetsResponse): SelectOption[] {
  return facets.genres.map((genre) => ({ value: genre.name, label: genre.name, count: genre.count }));
}

function mapTypeOptions(facets: ArchiveFacetsResponse): SelectOption[] {
  return facets.filmTypes.map((filmType) => ({ value: filmType.value, label: filmType.label, count: filmType.count }));
}

function toggleValue<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function isRangeFilterActive(filter: NumericRangeFilter): boolean {
  return filter.knownOnly || filter.min != null || filter.max != null;
}

function countActiveFilters(filters: ArchiveRequestFilters): number {
  let count = 0;
  if (filters.selectedYears.length > 0) count += 1;
  if (filters.selectedGenres.length > 0) count += 1;
  if (filters.selectedFilmTypes.length > 0) count += 1;
  if (filters.selectedPersonIds.length > 0) count += 1;
  if (filters.selectedCompanyIds.length > 0) count += 1;
  if (isRangeFilterActive(filters.budgetFilter)) count += 1;
  if (isRangeFilterActive(filters.boxOfficeFilter)) count += 1;
  if (isRangeFilterActive(filters.imdbRatingFilter)) count += 1;
  if (isRangeFilterActive(filters.imdbVoteCountFilter)) count += 1;
  return count;
}

function isDesktopViewport(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;
}

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
  const [imdbRatingFilter, setImdbRatingFilter] = useState<NumericRangeFilter>(EMPTY_RANGE_FILTER);
  const [imdbVoteCountFilter, setImdbVoteCountFilter] = useState<NumericRangeFilter>(EMPTY_RANGE_FILTER);
  const [selectedBudgetPreset, setSelectedBudgetPreset] = useState<BudgetPresetLabel | null>(null);
  const [selectedBoxOfficePreset, setSelectedBoxOfficePreset] = useState<BoxOfficePresetLabel | null>(null);
  const [selectedRatingPreset, setSelectedRatingPreset] = useState<ImdbRatingPresetLabel | null>(null);
  const [selectedVotePreset, setSelectedVotePreset] = useState<ImdbVotePresetLabel | null>(null);

  const [sortValue, setSortValue] = useState<SortOption>('releaseDate');
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(true);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [archiveResponse, setArchiveResponse] = useState<ArchiveMoviesResponse>(EMPTY_ARCHIVE_RESPONSE);
  const [facetsResponse, setFacetsResponse] = useState<ArchiveFacetsResponse>(EMPTY_FACETS_RESPONSE);
  const [isArchiveLoading, setIsArchiveLoading] = useState(true);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  const [selectedMovieDetails, setSelectedMovieDetails] = useState<ArchiveMovie | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const movieDetailsCache = useRef(new Map<number, ArchiveMovie>());
  const movieDetailsRequests = useRef(new Map<number, Promise<ArchiveMovie>>());

  const requestFilters = useMemo<ArchiveRequestFilters>(
    () => ({
      selectedYears,
      selectedGenres,
      selectedFilmTypes,
      selectedPersonIds: selectedPeople.map((person) => person.id),
      selectedCompanyIds: selectedCompanies.map((company) => company.id),
      budgetFilter,
      boxOfficeFilter,
      imdbRatingFilter,
      imdbVoteCountFilter,
    }),
    [boxOfficeFilter, budgetFilter, imdbRatingFilter, imdbVoteCountFilter, selectedCompanies, selectedFilmTypes, selectedGenres, selectedPeople, selectedYears],
  );

  const activeFilterCount = useMemo(() => countActiveFilters(requestFilters), [requestFilters]);
  const years = useMemo<YearOption[]>(() => mergeFullDecadeYears(facetsResponse.years), [facetsResponse.years]);
  const genreOptions = useMemo<SelectOption[]>(() => mapGenreOptions(facetsResponse), [facetsResponse]);
  const typeOptions = useMemo<SelectOption[]>(() => mapTypeOptions(facetsResponse), [facetsResponse]);

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

  const loadMovieDetails = useCallback((movieId: number) => {
    const cachedMovie = movieDetailsCache.current.get(movieId);
    if (cachedMovie) {
      return Promise.resolve(cachedMovie);
    }

    const inflightRequest = movieDetailsRequests.current.get(movieId);
    if (inflightRequest) {
      return inflightRequest;
    }

    const request = fetchArchiveMovieById(movieId)
      .then((movie) => {
        movieDetailsCache.current.set(movie.id, movie);
        movieDetailsRequests.current.delete(movieId);
        return movie;
      })
      .catch((error) => {
        movieDetailsRequests.current.delete(movieId);
        throw error;
      });

    movieDetailsRequests.current.set(movieId, request);
    return request;
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setIsMobileDetailsOpen(false);
  }, [selectedYears, selectedGenres, selectedFilmTypes, selectedPeople, selectedCompanies, budgetFilter, boxOfficeFilter, imdbRatingFilter, imdbVoteCountFilter, sortValue, pageSize]);

  useEffect(() => {
    if (!isMobileFiltersOpen && !isMobileDetailsOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileDetailsOpen, isMobileFiltersOpen]);

  useEffect(() => {
    const abortController = new AbortController();

    setIsArchiveLoading(true);
    setArchiveError(null);

    Promise.all([
      fetchArchiveMovies(requestFilters, sortValue, currentPage, pageSize, { signal: abortController.signal }),
      fetchArchiveFacets(requestFilters, { signal: abortController.signal }),
    ])
      .then(([movies, facets]) => {
        if (abortController.signal.aborted) {
          return;
        }

        setArchiveResponse(movies);
        setFacetsResponse(facets);
        setIsArchiveLoading(false);

        const firstMovieId = movies.items[0]?.id;
        if (firstMovieId != null) {
          void loadMovieDetails(firstMovieId).catch(() => undefined);
        }
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        console.error(error);
        setArchiveError('Failed to load archive data.');
        setIsArchiveLoading(false);
      });

    return () => abortController.abort();
  }, [currentPage, loadMovieDetails, pageSize, requestFilters, sortValue]);

  useEffect(() => {
    const availableMovieIds = new Set(archiveResponse.items.map((movie) => movie.id));

    if (selectedMovieId != null && availableMovieIds.has(selectedMovieId)) {
      return;
    }

    if (selectedMovieId != null && !availableMovieIds.has(selectedMovieId)) {
      setIsMobileDetailsOpen(false);
    }

    setSelectedMovieId(archiveResponse.items[0]?.id ?? null);
  }, [archiveResponse.items, selectedMovieId]);

  useEffect(() => {
    let cancelled = false;

    if (selectedMovieId == null) {
      setSelectedMovieDetails(null);
      setDetailsError(null);
      setIsDetailsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const cachedMovie = movieDetailsCache.current.get(selectedMovieId);
    if (cachedMovie) {
      setSelectedMovieDetails(cachedMovie);
      setDetailsError(null);
      setIsDetailsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setSelectedMovieDetails(null);
    setDetailsError(null);
    setIsDetailsLoading(true);

    loadMovieDetails(selectedMovieId)
      .then((movie) => {
        if (cancelled) {
          return;
        }

        setSelectedMovieDetails(movie);
        setIsDetailsLoading(false);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        console.error(error);
        setDetailsError('Failed to load movie details.');
        setIsDetailsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loadMovieDetails, selectedMovieId]);

  const selectedMovieSummary = useMemo(
    () => archiveResponse.items.find((movie) => movie.id === selectedMovieId) ?? archiveResponse.items[0] ?? null,
    [archiveResponse.items, selectedMovieId],
  );

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
    setImdbRatingFilter(EMPTY_RANGE_FILTER);
    setImdbVoteCountFilter(EMPTY_RANGE_FILTER);
    setSelectedBudgetPreset(null);
    setSelectedBoxOfficePreset(null);
    setSelectedRatingPreset(null);
    setSelectedVotePreset(null);
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

  const handleRatingPresetSelect = (presetLabel: string | null) => {
    if (!presetLabel) {
      setSelectedRatingPreset(null);
      setImdbRatingFilter((current) => ({ knownOnly: current.knownOnly }));
      return;
    }

    const preset = IMDB_RATING_PRESETS[presetLabel as ImdbRatingPresetLabel];
    setSelectedRatingPreset(presetLabel as ImdbRatingPresetLabel);
    setImdbRatingFilter((current) => ({ ...preset, knownOnly: current.knownOnly }));
  };

  const handleVotePresetSelect = (presetLabel: string | null) => {
    if (!presetLabel) {
      setSelectedVotePreset(null);
      setImdbVoteCountFilter((current) => ({ knownOnly: current.knownOnly }));
      return;
    }

    const preset = IMDB_VOTE_PRESETS[presetLabel as ImdbVotePresetLabel];
    setSelectedVotePreset(presetLabel as ImdbVotePresetLabel);
    setImdbVoteCountFilter((current) => ({ ...preset, knownOnly: current.knownOnly }));
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
        imdbRatingFilter={imdbRatingFilter}
        imdbVoteCountFilter={imdbVoteCountFilter}
        isCompanyLoading={isCompanyLoading}
        isPeopleLoading={isPeopleLoading}
        peopleQuery={peopleQuery}
        peopleSuggestions={peopleSuggestions}
        selectedBoxOfficePreset={selectedBoxOfficePreset}
        selectedBudgetPreset={selectedBudgetPreset}
        selectedCompanies={selectedCompanies}
        selectedRatingPreset={selectedRatingPreset}
        selectedVotePreset={selectedVotePreset}
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
        onImdbRatingFilterChange={setImdbRatingFilter}
        onImdbVoteCountFilterChange={setImdbVoteCountFilter}
        onRatingPresetSelect={handleRatingPresetSelect}
        onVotePresetSelect={handleVotePresetSelect}
        onFilmTypeToggle={(value) => setSelectedFilmTypes((current) => toggleValue(current, value))}
        onGenreToggle={(value) => setSelectedGenres((current) => toggleValue(current, value))}
        onPeopleQueryChange={setPeopleQuery}
        onRemoveCompany={handleRemoveCompany}
        onRemovePerson={handleRemovePerson}
        onSelectCompany={handleSelectCompany}
        onSelectPerson={handleSelectPerson}
        onYearToggle={(value) => setSelectedYears((current) => toggleValue(current, value))}
      />

      <MobileFilterDrawer
        boxOfficeFilter={boxOfficeFilter}
        budgetFilter={budgetFilter}
        companyQuery={companyQuery}
        companySuggestions={companySuggestions}
        genreOptions={genreOptions}
        imdbRatingFilter={imdbRatingFilter}
        imdbVoteCountFilter={imdbVoteCountFilter}
        isCompanyLoading={isCompanyLoading}
        isOpen={isMobileFiltersOpen}
        isPeopleLoading={isPeopleLoading}
        peopleQuery={peopleQuery}
        peopleSuggestions={peopleSuggestions}
        selectedBoxOfficePreset={selectedBoxOfficePreset}
        selectedBudgetPreset={selectedBudgetPreset}
        selectedCompanies={selectedCompanies}
        selectedRatingPreset={selectedRatingPreset}
        selectedVotePreset={selectedVotePreset}
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
        onClose={() => setIsMobileFiltersOpen(false)}
        onCompanyQueryChange={setCompanyQuery}
        onImdbRatingFilterChange={setImdbRatingFilter}
        onImdbVoteCountFilterChange={setImdbVoteCountFilter}
        onRatingPresetSelect={handleRatingPresetSelect}
        onVotePresetSelect={handleVotePresetSelect}
        onFilmTypeToggle={(value) => setSelectedFilmTypes((current) => toggleValue(current, value))}
        onGenreToggle={(value) => setSelectedGenres((current) => toggleValue(current, value))}
        onPeopleQueryChange={setPeopleQuery}
        onRemoveCompany={handleRemoveCompany}
        onRemovePerson={handleRemovePerson}
        onSelectCompany={handleSelectCompany}
        onSelectPerson={handleSelectPerson}
        onYearToggle={(value) => setSelectedYears((current) => toggleValue(current, value))}
      />

      <main
        className={`mt-16 min-h-screen px-4 py-4 transition-[margin] duration-200 ease-out sm:px-6 sm:py-6 lg:ml-80 ${
          isDetailsPanelOpen ? 'lg:mr-[380px]' : 'lg:mr-0'
        }`}
      >
        <div className={`mx-auto transition-[max-width] duration-200 ease-out ${isDetailsPanelOpen ? 'max-w-4xl' : 'max-w-6xl'}`}>
          <div className="mb-4 flex gap-3 lg:hidden">
            <button
              className="neo-panel flex-1 rounded-xl border px-4 py-3 text-sm font-medium text-slate-700"
              onClick={() => setIsMobileFiltersOpen(true)}
              type="button"
            >
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </button>
            <button
              className="neo-panel flex-1 rounded-xl border px-4 py-3 text-sm font-medium text-slate-700 disabled:opacity-40"
              disabled={selectedMovieSummary == null}
              onClick={() => setIsMobileDetailsOpen(true)}
              type="button"
            >
              Details
            </button>
          </div>

          <div className="mb-8">
            <div className="neo-toolbar flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">
                <span className="font-medium text-slate-900">{formatCompactNumber(archiveResponse.totalItems)}</span> results
                <span className="mx-2 text-slate-300">/</span>
                <span>{formatCompactNumber(facetsResponse.indexedCount)} indexed</span>
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
                  <option value="imdbRating">IMDb rating</option>
                </select>
              </div>
            </div>
          </div>

          {archiveError ? (
            <div className="neo-panel rounded-xl border px-4 py-8 text-center text-sm text-slate-600">{archiveError}</div>
          ) : archiveResponse.items.length === 0 && !isArchiveLoading ? (
            <div className="neo-panel rounded-xl border px-4 py-8 text-center text-sm text-slate-600">No movies match the current filters.</div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {archiveResponse.items.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  selected={selectedMovieSummary?.id === movie.id}
                  onSelect={(nextMovie) => {
                    setSelectedMovieId(nextMovie.id);
                    if (isDesktopViewport()) {
                      setIsDetailsPanelOpen(true);
                      return;
                    }
                    setIsMobileDetailsOpen(true);
                  }}
                />
              ))}
            </div>
          )}

          <div className="mt-4 text-xs text-slate-400">{isArchiveLoading ? 'Loading archive…' : null}</div>

          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={archiveResponse.totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </main>

      <DetailsPanel
        error={detailsError}
        isLoading={isDetailsLoading}
        isOpen={isDetailsPanelOpen}
        movie={selectedMovieDetails}
        onToggle={() => setIsDetailsPanelOpen((current) => !current)}
      />

      <MobileDetailsDrawer
        error={detailsError}
        isLoading={isDetailsLoading}
        isOpen={isMobileDetailsOpen}
        movie={selectedMovieDetails}
        onClose={() => setIsMobileDetailsOpen(false)}
      />
    </div>
  );
}
