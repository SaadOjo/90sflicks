import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ArchiveMovie, CompanySuggestion, PersonSuggestion } from '../../shared/types/archive';
import type { ArchiveFacetsResponse, ArchiveMoviesResponse, ArchiveNumericBucketFacet } from '../../shared/types/api';
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
const DEFAULT_BUCKET_SELECTION: string[] = [];
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
  budgetBuckets: [],
  boxOfficeBuckets: [],
  imdbRatingBuckets: [],
  imdbVoteCountBuckets: [],
};

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

function mapBucketOptions(facets: ArchiveNumericBucketFacet[]): SelectOption[] {
  return facets.map((facet) => ({ value: facet.key, label: facet.label, count: facet.count }));
}

function countActiveFilters(filters: ArchiveRequestFilters): number {
  let count = 0;
  if (filters.selectedYears.length > 0) count += 1;
  if (filters.selectedGenres.length > 0) count += 1;
  if (filters.selectedFilmTypes.length > 0) count += 1;
  if (filters.selectedPersonIds.length > 0) count += 1;
  if (filters.selectedCompanyIds.length > 0) count += 1;
  if (filters.selectedBudgetBuckets.length > 0) count += 1;
  if (filters.selectedBoxOfficeBuckets.length > 0) count += 1;
  if (filters.selectedImdbRatingBuckets.length > 0) count += 1;
  if (filters.selectedImdbVoteCountBuckets.length > 0) count += 1;
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

  const [selectedBudgetBuckets, setSelectedBudgetBuckets] = useState<string[]>(DEFAULT_BUCKET_SELECTION);
  const [selectedBoxOfficeBuckets, setSelectedBoxOfficeBuckets] = useState<string[]>(DEFAULT_BUCKET_SELECTION);
  const [selectedImdbRatingBuckets, setSelectedImdbRatingBuckets] = useState<string[]>(DEFAULT_BUCKET_SELECTION);
  const [selectedImdbVoteCountBuckets, setSelectedImdbVoteCountBuckets] = useState<string[]>(DEFAULT_BUCKET_SELECTION);

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
      selectedBudgetBuckets,
      selectedBoxOfficeBuckets,
      selectedImdbRatingBuckets,
      selectedImdbVoteCountBuckets,
    }),
    [
      selectedBudgetBuckets,
      selectedBoxOfficeBuckets,
      selectedCompanies,
      selectedFilmTypes,
      selectedGenres,
      selectedImdbRatingBuckets,
      selectedImdbVoteCountBuckets,
      selectedPeople,
      selectedYears,
    ],
  );

  const activeFilterCount = useMemo(() => countActiveFilters(requestFilters), [requestFilters]);
  const years = useMemo<YearOption[]>(() => mergeFullDecadeYears(facetsResponse.years), [facetsResponse.years]);
  const genreOptions = useMemo<SelectOption[]>(() => mapGenreOptions(facetsResponse), [facetsResponse]);
  const typeOptions = useMemo<SelectOption[]>(() => mapTypeOptions(facetsResponse), [facetsResponse]);
  const budgetBucketOptions = useMemo<SelectOption[]>(() => mapBucketOptions(facetsResponse.budgetBuckets), [facetsResponse.budgetBuckets]);
  const boxOfficeBucketOptions = useMemo<SelectOption[]>(() => mapBucketOptions(facetsResponse.boxOfficeBuckets), [facetsResponse.boxOfficeBuckets]);
  const imdbRatingBucketOptions = useMemo<SelectOption[]>(() => mapBucketOptions(facetsResponse.imdbRatingBuckets), [facetsResponse.imdbRatingBuckets]);
  const imdbVoteCountBucketOptions = useMemo<SelectOption[]>(() => mapBucketOptions(facetsResponse.imdbVoteCountBuckets), [facetsResponse.imdbVoteCountBuckets]);

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
  }, [
    selectedYears,
    selectedGenres,
    selectedFilmTypes,
    selectedPeople,
    selectedCompanies,
    selectedBudgetBuckets,
    selectedBoxOfficeBuckets,
    selectedImdbRatingBuckets,
    selectedImdbVoteCountBuckets,
    sortValue,
    pageSize,
  ]);

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
    setSelectedBudgetBuckets([]);
    setSelectedBoxOfficeBuckets([]);
    setSelectedImdbRatingBuckets([]);
    setSelectedImdbVoteCountBuckets([]);
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

  return (
    <div className="min-h-screen bg-surface text-on-surface selection:bg-tertiary-container selection:text-on-tertiary-container">
      <TopBar />

      <FilterSidebar
        budgetBucketOptions={budgetBucketOptions}
        boxOfficeBucketOptions={boxOfficeBucketOptions}
        companyQuery={companyQuery}
        companySuggestions={companySuggestions}
        genreOptions={genreOptions}
        imdbRatingBucketOptions={imdbRatingBucketOptions}
        imdbVoteCountBucketOptions={imdbVoteCountBucketOptions}
        isCompanyLoading={isCompanyLoading}
        isPeopleLoading={isPeopleLoading}
        peopleQuery={peopleQuery}
        peopleSuggestions={peopleSuggestions}
        selectedBudgetBuckets={selectedBudgetBuckets}
        selectedBoxOfficeBuckets={selectedBoxOfficeBuckets}
        selectedCompanies={selectedCompanies}
        selectedFilmTypes={selectedFilmTypes}
        selectedGenres={selectedGenres}
        selectedImdbRatingBuckets={selectedImdbRatingBuckets}
        selectedImdbVoteCountBuckets={selectedImdbVoteCountBuckets}
        selectedPeople={selectedPeople}
        selectedYears={selectedYears}
        typeOptions={typeOptions}
        years={years}
        onBoxOfficeBucketToggle={(value) => setSelectedBoxOfficeBuckets((current) => toggleValue(current, value))}
        onBudgetBucketToggle={(value) => setSelectedBudgetBuckets((current) => toggleValue(current, value))}
        onClearAll={clearAll}
        onCompanyQueryChange={setCompanyQuery}
        onFilmTypeToggle={(value) => setSelectedFilmTypes((current) => toggleValue(current, value))}
        onGenreToggle={(value) => setSelectedGenres((current) => toggleValue(current, value))}
        onImdbRatingBucketToggle={(value) => setSelectedImdbRatingBuckets((current) => toggleValue(current, value))}
        onImdbVoteCountBucketToggle={(value) => setSelectedImdbVoteCountBuckets((current) => toggleValue(current, value))}
        onPeopleQueryChange={setPeopleQuery}
        onRemoveCompany={handleRemoveCompany}
        onRemovePerson={handleRemovePerson}
        onSelectCompany={handleSelectCompany}
        onSelectPerson={handleSelectPerson}
        onYearToggle={(value) => setSelectedYears((current) => toggleValue(current, value))}
      />

      <MobileFilterDrawer
        budgetBucketOptions={budgetBucketOptions}
        boxOfficeBucketOptions={boxOfficeBucketOptions}
        companyQuery={companyQuery}
        companySuggestions={companySuggestions}
        genreOptions={genreOptions}
        imdbRatingBucketOptions={imdbRatingBucketOptions}
        imdbVoteCountBucketOptions={imdbVoteCountBucketOptions}
        isCompanyLoading={isCompanyLoading}
        isOpen={isMobileFiltersOpen}
        isPeopleLoading={isPeopleLoading}
        peopleQuery={peopleQuery}
        peopleSuggestions={peopleSuggestions}
        selectedBudgetBuckets={selectedBudgetBuckets}
        selectedBoxOfficeBuckets={selectedBoxOfficeBuckets}
        selectedCompanies={selectedCompanies}
        selectedFilmTypes={selectedFilmTypes}
        selectedGenres={selectedGenres}
        selectedImdbRatingBuckets={selectedImdbRatingBuckets}
        selectedImdbVoteCountBuckets={selectedImdbVoteCountBuckets}
        selectedPeople={selectedPeople}
        selectedYears={selectedYears}
        typeOptions={typeOptions}
        years={years}
        onBoxOfficeBucketToggle={(value) => setSelectedBoxOfficeBuckets((current) => toggleValue(current, value))}
        onBudgetBucketToggle={(value) => setSelectedBudgetBuckets((current) => toggleValue(current, value))}
        onClearAll={clearAll}
        onClose={() => setIsMobileFiltersOpen(false)}
        onCompanyQueryChange={setCompanyQuery}
        onFilmTypeToggle={(value) => setSelectedFilmTypes((current) => toggleValue(current, value))}
        onGenreToggle={(value) => setSelectedGenres((current) => toggleValue(current, value))}
        onImdbRatingBucketToggle={(value) => setSelectedImdbRatingBuckets((current) => toggleValue(current, value))}
        onImdbVoteCountBucketToggle={(value) => setSelectedImdbVoteCountBuckets((current) => toggleValue(current, value))}
        onPeopleQueryChange={setPeopleQuery}
        onRemoveCompany={handleRemoveCompany}
        onRemovePerson={handleRemovePerson}
        onSelectCompany={handleSelectCompany}
        onSelectPerson={handleSelectPerson}
        onYearToggle={(value) => setSelectedYears((current) => toggleValue(current, value))}
      />

      <main
        className={`mt-16 min-h-screen px-4 py-4 transition-[margin] duration-200 ease-out sm:px-6 sm:py-6 lg:ml-[22rem] ${
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
