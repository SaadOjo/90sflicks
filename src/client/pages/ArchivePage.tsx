import { useEffect, useMemo, useState } from 'react';
import { DetailsPanel } from '../components/DetailsPanel';
import { FilterSidebar } from '../components/FilterSidebar';
import { MovieCard } from '../components/MovieCard';
import { Pagination } from '../components/Pagination';
import { TopBar } from '../components/TopBar';
import { ARCHIVE_INDEXED_COUNT, archiveMovies } from '../lib/mockData';
import { formatCompactNumber } from '../lib/formatters';

const DEFAULT_YEARS: number[] = [];
const DEFAULT_GENRES: string[] = [];
const DEFAULT_FILM_TYPES: string[] = [];

type SortOption = 'releaseDate' | 'title' | 'boxOffice' | 'budget';

function toFilmTypeLabel(value?: string): string {
  if (!value) return 'Unknown';
  return value === 'movie' ? 'Movie' : value.charAt(0).toUpperCase() + value.slice(1);
}

export function ArchivePage() {
  const [search, setSearch] = useState('');
  const [selectedYears, setSelectedYears] = useState<number[]>(DEFAULT_YEARS);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(DEFAULT_GENRES);
  const [selectedFilmTypes, setSelectedFilmTypes] = useState<string[]>(DEFAULT_FILM_TYPES);
  const [creditSearch, setCreditSearch] = useState('');
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

  const filteredMovies = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const normalizedCreditSearch = creditSearch.trim().toLowerCase();

    const filtered = archiveMovies.filter((movie) => {
      const titleMatch = !normalizedSearch || movie.title.toLowerCase().includes(normalizedSearch);
      const yearMatch = selectedYears.length === 0 || selectedYears.includes(movie.releaseYear);
      const genreMatch = selectedGenres.length === 0 || selectedGenres.some((genre) => movie.genres.includes(genre));
      const filmTypeLabel = toFilmTypeLabel(movie.filmType);
      const filmTypeMatch = selectedFilmTypes.length === 0 || selectedFilmTypes.includes(filmTypeLabel);
      const creditMatch =
        !normalizedCreditSearch ||
        movie.credits.some((credit) => credit.name.toLowerCase().includes(normalizedCreditSearch));

      return titleMatch && yearMatch && genreMatch && filmTypeMatch && creditMatch;
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
  }, [creditSearch, search, selectedFilmTypes, selectedGenres, selectedYears, sortValue]);

  const totalPages = Math.max(1, Math.ceil(filteredMovies.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedYears, selectedGenres, selectedFilmTypes, creditSearch, sortValue, pageSize]);

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
    setCreditSearch('');
    setSortValue('releaseDate');
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface selection:bg-tertiary-container selection:text-on-tertiary-container">
      <TopBar indexedCount={ARCHIVE_INDEXED_COUNT} sortValue={sortValue} onSortChange={(value) => setSortValue(value as SortOption)} />

      <FilterSidebar
        creditSearch={creditSearch}
        filmTypes={filmTypes}
        genres={genres}
        search={search}
        selectedFilmTypes={selectedFilmTypes}
        selectedGenres={selectedGenres}
        selectedYears={selectedYears}
        years={years}
        onClearAll={clearAll}
        onCreditSearchChange={setCreditSearch}
        onFilmTypeToggle={(value) => setSelectedFilmTypes((current) => toggleString(current, value))}
        onGenreToggle={(value) => setSelectedGenres((current) => toggleString(current, value))}
        onSearchChange={setSearch}
        onYearToggle={(value) => setSelectedYears((current) => toggleNumber(current, value))}
      />

      <main className={`mt-16 min-h-screen px-8 py-8 lg:ml-64 ${isDetailsPanelOpen ? 'lg:mr-[400px]' : 'lg:mr-0'}`}>
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 flex items-end justify-between gap-8">
            <div>
              <h1 className="font-headline text-6xl leading-[0.9] font-black tracking-tighter text-slate-900 uppercase">
                Browse
                <br />
                Results
              </h1>
            </div>
            <div className="text-right">
              <span className="mb-1 block font-headline text-[10px] uppercase tracking-widest text-slate-400">Results</span>
              <span className="font-headline text-2xl font-bold text-slate-900">
                {formatCompactNumber(filteredMovies.length)} / {formatCompactNumber(ARCHIVE_INDEXED_COUNT)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
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
