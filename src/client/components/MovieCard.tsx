import type { ArchiveMovieListItem } from '../../shared/types/archive';
import { formatCompactCount, formatCurrency, formatDisplayDate, formatFilmType, formatImdbRating } from '../lib/formatters';

interface MovieCardProps {
  movie: ArchiveMovieListItem;
  selected: boolean;
  onSelect: (movie: ArchiveMovieListItem) => void;
}

export function MovieCard({ movie, selected, onSelect }: MovieCardProps) {
  const directors = movie.directors.join(', ');
  const mainCast = movie.mainCast.join(', ');
  const boxOffice = movie.boxOffice != null ? formatCurrency(movie.boxOffice) : null;
  const imdbRating = movie.imdbRating != null ? formatImdbRating(movie.imdbRating) : null;
  const imdbVoteCount = movie.imdbVoteCount != null ? formatCompactCount(movie.imdbVoteCount) : null;

  return (
    <article
      className={selected
        ? 'neo-card neo-card-selected cursor-pointer rounded-xl border p-4 transition-colors sm:p-5'
        : 'neo-card neo-card-hover cursor-pointer rounded-xl border p-4 transition-colors sm:p-5'}
      onClick={() => onSelect(movie)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h3 className="font-headline text-xl font-semibold text-slate-900 sm:text-2xl">{movie.title}</h3>
            <span className="text-sm text-slate-500">{movie.releaseYear}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500 sm:gap-3">
            <span>{formatDisplayDate(movie.releaseDate)}</span>
            {movie.genres.length > 0 ? <span>•</span> : null}
            <span>{movie.genres.join(', ')}</span>
          </div>
        </div>

        <span className={selected ? 'neo-badge-selected rounded-full px-2.5 py-1 text-xs font-medium text-white' : 'neo-badge-muted rounded-full px-2.5 py-1 text-xs font-medium text-slate-600'}>
          {formatFilmType(movie.filmType)}
        </span>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <span className="block text-xs font-medium text-slate-400">Director</span>
          <span className="block truncate text-slate-800">{directors || 'Unknown'}</span>
        </div>
        <div className="min-w-0">
          <span className="block text-xs font-medium text-slate-400">Cast</span>
          <span className="block truncate text-slate-800">{mainCast || 'Unknown'}</span>
        </div>
      </div>

      {boxOffice || imdbRating ? (
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
          {boxOffice ? (
            <div>
              <span className="mr-2 text-xs font-medium text-slate-400">Box office</span>
              <span className="font-medium text-slate-800">{boxOffice}</span>
            </div>
          ) : null}
          {imdbRating ? (
            <div>
              <span className="mr-2 text-xs font-medium text-slate-400">IMDb</span>
              <span className="font-medium text-slate-800">{imdbRating}</span>
              {imdbVoteCount ? <span className="ml-2 text-xs text-slate-500">({imdbVoteCount} votes)</span> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
