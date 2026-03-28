import type { ArchiveMovie } from '../../shared/types/archive';
import { formatCurrency, formatDisplayDate, formatFilmType } from '../lib/formatters';
import { getCompaniesByRole, getCreditsByRole, getMainCast } from '../lib/movieSelectors';

interface DetailsPanelProps {
  movie: ArchiveMovie | null;
  isOpen: boolean;
  onToggle: () => void;
}

export function DetailsPanel({ movie, isOpen, onToggle }: DetailsPanelProps) {
  const directors = movie ? getCreditsByRole(movie, 'director') : [];
  const writers = movie ? getCreditsByRole(movie, 'writer') : [];
  const producers = movie ? getCreditsByRole(movie, 'producer') : [];
  const cast = movie ? getMainCast(movie, 8) : [];
  const productionCompanies = movie ? getCompaniesByRole(movie, 'production') : [];
  const distributionCompanies = movie ? getCompaniesByRole(movie, 'distribution') : [];

  return (
    <>
      <button
        aria-label={isOpen ? 'Hide details panel' : 'Show details panel'}
        className="fixed top-24 right-0 z-40 hidden border border-r-0 border-slate-200 bg-white px-2 py-6 text-slate-500 transition-colors hover:text-slate-900 lg:block"
        onClick={onToggle}
        type="button"
      >
        <span className="material-symbols-outlined text-lg">{isOpen ? 'chevron_right' : 'chevron_left'}</span>
      </button>

      <aside
        className={`fixed right-0 top-16 bottom-0 hidden w-[400px] overflow-y-auto border-l border-slate-200 bg-white transition-transform duration-200 lg:block ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-8">
          {movie ? (
            <>
              <div className="mb-12 flex items-start justify-between">
                <span className="border border-tertiary px-2 py-1 font-label text-[10px] font-bold uppercase tracking-widest text-tertiary">
                  Selected Entry
                </span>
              </div>

              <h2 className="mb-2 font-headline text-5xl font-black tracking-tighter text-slate-900 uppercase">{movie.title}</h2>

              <div className="mb-10 flex items-center gap-2">
                <span className="font-label text-[11px] font-bold uppercase text-slate-500">
                  Format: {formatFilmType(movie.filmType)}
                </span>
                <div className="h-px flex-grow bg-outline-variant/30" />
                <span className="font-label text-[11px] font-bold uppercase text-tertiary">{movie.releaseYear}</span>
              </div>

              <div className="space-y-12">
                <section>
                  <div className="mb-4 flex items-center gap-3">
                    <span className="font-label text-[11px] font-black uppercase tracking-widest text-slate-900">Details</span>
                    <div className="h-px flex-grow bg-slate-900" />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <span className="mb-1 block font-label text-[10px] font-bold uppercase text-slate-400">Release Date</span>
                      <span className="block font-body text-xs font-medium text-slate-900">{formatDisplayDate(movie.releaseDate)}</span>
                    </div>
                    <div>
                      <span className="mb-1 block font-label text-[10px] font-bold uppercase text-slate-400">Genres</span>
                      <span className="block font-body text-xs font-medium text-slate-900">{movie.genres.join(', ') || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="mb-1 block font-label text-[10px] font-bold uppercase text-slate-400">Film Type</span>
                      <span className="block font-body text-xs font-medium text-slate-900">{formatFilmType(movie.filmType)}</span>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="mb-4 flex items-center gap-3">
                    <span className="font-label text-[11px] font-black uppercase tracking-widest text-slate-900">Financials</span>
                    <div className="h-px flex-grow bg-slate-900" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-slate-100 bg-slate-50 p-4">
                      <span className="mb-1 block font-label text-[10px] font-bold uppercase text-slate-400">Budget</span>
                      <span className="block font-headline text-xl font-bold text-slate-900">{formatCurrency(movie.budget)}</span>
                    </div>
                    <div className="border border-slate-100 bg-slate-50 p-4">
                      <span className="mb-1 block font-label text-[10px] font-bold uppercase text-slate-400">Box Office</span>
                      <span className="block font-headline text-xl font-bold text-tertiary">{formatCurrency(movie.boxOffice)}</span>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="mb-4 flex items-center gap-3">
                    <span className="font-label text-[11px] font-black uppercase tracking-widest text-slate-900">Companies</span>
                    <div className="h-px flex-grow bg-slate-900" />
                  </div>
                  <ul className="space-y-3">
                    {[...distributionCompanies, ...productionCompanies].map((company) => (
                      <li key={`${company.roleType}-${company.name}`} className="group flex justify-between items-baseline">
                        <span className="font-body text-xs text-slate-600 transition-colors group-hover:text-slate-900">{company.name}</span>
                        <span className="font-label text-[9px] uppercase text-slate-400">{company.roleType}</span>
                      </li>
                    ))}
                    {distributionCompanies.length === 0 && productionCompanies.length === 0 ? (
                      <li className="font-body text-xs text-slate-500">No company data available.</li>
                    ) : null}
                  </ul>
                </section>

                <section>
                  <div className="mb-4 flex items-center gap-3">
                    <span className="font-label text-[11px] font-black uppercase tracking-widest text-slate-900">Credits</span>
                    <div className="h-px flex-grow bg-slate-900" />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <span className="mb-1 block font-label text-[10px] font-bold uppercase text-slate-400">Directors</span>
                      <span className="block font-body text-xs font-medium text-slate-900">{directors.map((credit) => credit.name).join(', ') || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="mb-1 block font-label text-[10px] font-bold uppercase text-slate-400">Writers</span>
                      <span className="block font-body text-xs font-medium text-slate-900">{writers.map((credit) => credit.name).join(', ') || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="mb-1 block font-label text-[10px] font-bold uppercase text-slate-400">Producers</span>
                      <span className="block font-body text-xs font-medium text-slate-900">{producers.map((credit) => credit.name).join(', ') || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="mb-1 block font-label text-[10px] font-bold uppercase text-slate-400">Cast</span>
                      <span className="block font-body text-xs font-medium text-slate-900">{cast.map((credit) => credit.name).join(', ') || 'Unknown'}</span>
                    </div>
                  </div>
                </section>
              </div>
            </>
          ) : (
            <span className="font-label text-[10px] font-bold uppercase tracking-widest text-slate-400">No selection</span>
          )}
        </div>
      </aside>
    </>
  );
}
