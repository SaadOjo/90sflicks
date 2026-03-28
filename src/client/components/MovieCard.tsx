import type { ArchiveMovie } from '../../shared/types/archive';
import { formatCurrency, formatDisplayDate, formatFilmType } from '../lib/formatters';
import { getCreditsByRole, getMainCast } from '../lib/movieSelectors';

interface MovieCardProps {
  movie: ArchiveMovie;
  selected: boolean;
  onSelect: (movie: ArchiveMovie) => void;
}

export function MovieCard({ movie, selected, onSelect }: MovieCardProps) {
  const directors = getCreditsByRole(movie, 'director').map((credit) => credit.name).join(', ');
  const mainCast = getMainCast(movie).map((credit) => credit.name).join(', ');
  const boxOffice = movie.boxOffice != null ? formatCurrency(movie.boxOffice) : null;

  return (
    <article
      className={selected
        ? 'cursor-pointer rounded-xl border border-primary/20 bg-white p-5 shadow-sm ring-1 ring-primary/10 transition-colors'
        : 'cursor-pointer rounded-xl border border-slate-200/80 bg-white p-5 transition-colors hover:border-slate-300 hover:bg-slate-50'}
      onClick={() => onSelect(movie)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-headline text-2xl font-semibold text-slate-900">{movie.title}</h3>
            <span className="text-sm text-slate-500">{movie.releaseYear}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span>{formatDisplayDate(movie.releaseDate)}</span>
            {movie.genres.length > 0 ? <span>•</span> : null}
            <span>{movie.genres.join(', ')}</span>
          </div>
        </div>

        <span className={selected ? 'rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-white' : 'rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600'}>
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

      {boxOffice ? (
        <div className="mt-4 text-sm text-slate-600">
          <span className="mr-2 text-xs font-medium text-slate-400">Box office</span>
          <span className="font-medium text-slate-800">{boxOffice}</span>
        </div>
      ) : null}
    </article>
  );
}
