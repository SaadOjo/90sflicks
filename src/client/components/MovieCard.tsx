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
  const mainCast = getMainCast(movie).map((credit) => credit.name);

  return (
    <article
      className={selected
        ? 'group relative cursor-pointer overflow-hidden border border-transparent border-l-4 border-l-tertiary bg-white p-6 shadow-sm transition-all hover:border-outline-variant'
        : 'group relative cursor-pointer overflow-hidden border border-transparent bg-surface-container-low p-6 transition-all hover:border-outline-variant'}
      onClick={() => onSelect(movie)}
    >
      <div className="absolute top-0 right-0 p-4">
        <span className={`material-symbols-outlined text-tertiary ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {selected ? 'radio_button_checked' : 'arrow_forward_ios'}
        </span>
      </div>

      <div className="mb-4 flex items-start justify-between gap-6">
        <div className="flex flex-wrap items-baseline gap-4">
          <span className="font-headline text-3xl leading-tight font-bold text-slate-900">{movie.title.toUpperCase()}</span>
          <span className="font-headline text-lg font-medium text-tertiary">[ {movie.releaseYear} ]</span>
        </div>
        <span className="bg-primary px-2 py-1 text-[10px] font-bold tracking-widest text-white">
          {formatFilmType(movie.filmType).toUpperCase()}
        </span>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-4">
        <div>
          <span className="mb-1 block font-label text-[10px] font-bold uppercase text-slate-400">Release Date</span>
          <span className="block font-body text-xs font-semibold text-slate-700">{formatDisplayDate(movie.releaseDate).toUpperCase()}</span>
        </div>
        <div>
          <span className="mb-1 block font-label text-[10px] font-bold uppercase text-slate-400">Genres</span>
          <span className="block font-body text-xs font-semibold text-slate-700">{movie.genres.join(', ').toUpperCase()}</span>
        </div>
        <div>
          <span className="mb-1 block font-label text-[10px] font-bold uppercase text-slate-400">Director</span>
          <span className="block font-body text-xs font-semibold text-slate-700">{directors.toUpperCase() || 'UNKNOWN'}</span>
        </div>
        <div>
          <span className="mb-1 block font-label text-[10px] font-bold uppercase text-slate-400">Box Office</span>
          <span className="block font-body text-xs font-semibold text-tertiary">{formatCurrency(movie.boxOffice).toUpperCase()}</span>
        </div>
      </div>

      <div className="border-t border-outline-variant/30 pt-4">
        <span className="mb-2 block font-label text-[10px] font-bold uppercase text-slate-400">Cast</span>
        <div className="flex flex-wrap gap-4">
          {mainCast.map((name) => (
            <span key={name} className="font-body text-[11px] text-slate-600">
              {name.toUpperCase()}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
