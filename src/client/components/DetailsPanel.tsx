import type { ReactNode } from 'react';
import type { ArchiveMovie } from '../../shared/types/archive';
import { formatCurrency, formatDisplayDate, formatFilmType } from '../lib/formatters';
import { getCompaniesByRole, getCreditsByRole, getMainCast } from '../lib/movieSelectors';

interface DetailsPanelProps {
  movie: ArchiveMovie | null;
  isOpen: boolean;
  onToggle: () => void;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="border-b border-slate-200 pb-2 text-sm font-semibold text-slate-900">{title}</h3>
      {children}
    </section>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm text-slate-800">{value}</dd>
    </div>
  );
}

export function DetailsPanel({ movie, isOpen, onToggle }: DetailsPanelProps) {
  const directors = movie ? getCreditsByRole(movie, 'director') : [];
  const writers = movie ? getCreditsByRole(movie, 'writer') : [];
  const producers = movie ? getCreditsByRole(movie, 'producer') : [];
  const cast = movie ? getMainCast(movie, 8) : [];
  const productionCompanies = movie ? getCompaniesByRole(movie, 'production') : [];
  const distributionCompanies = movie ? getCompaniesByRole(movie, 'distribution') : [];
  const hasFinancials = movie && (movie.budget != null || movie.boxOffice != null);

  return (
    <>
      <button
        aria-label={isOpen ? 'Hide details panel' : 'Show details panel'}
        className="fixed top-24 right-0 z-40 hidden rounded-l-md border border-r-0 border-slate-200 bg-white px-2 py-5 text-slate-500 shadow-sm transition-colors hover:text-slate-900 lg:block"
        onClick={onToggle}
        type="button"
      >
        <span className="material-symbols-outlined text-lg">{isOpen ? 'chevron_right' : 'chevron_left'}</span>
      </button>

      <aside
        className={`fixed right-0 top-16 bottom-0 hidden w-[380px] overflow-y-auto border-l border-slate-200/80 bg-white transition-transform duration-200 lg:block ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="space-y-8 p-6">
          {movie ? (
            <>
              <div>
                <h2 className="font-headline text-3xl font-semibold text-slate-900">{movie.title}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  <span>{movie.releaseYear}</span>
                  <span>•</span>
                  <span>{formatFilmType(movie.filmType)}</span>
                </div>
              </div>

              <Section title="Details">
                <dl className="space-y-4">
                  <MetaRow label="Release date" value={formatDisplayDate(movie.releaseDate)} />
                  <MetaRow label="Genres" value={movie.genres.join(', ') || 'Unknown'} />
                  <MetaRow label="Film type" value={formatFilmType(movie.filmType)} />
                </dl>
              </Section>

              {hasFinancials ? (
                <Section title="Financials">
                  <dl className="grid grid-cols-2 gap-4">
                    {movie.budget != null ? <MetaRow label="Budget" value={formatCurrency(movie.budget)} /> : null}
                    {movie.boxOffice != null ? <MetaRow label="Box office" value={formatCurrency(movie.boxOffice)} /> : null}
                  </dl>
                </Section>
              ) : null}

              <Section title="Companies">
                {distributionCompanies.length === 0 && productionCompanies.length === 0 ? (
                  <p className="text-sm text-slate-500">No company data available.</p>
                ) : (
                  <ul className="space-y-3 text-sm text-slate-700">
                    {distributionCompanies.map((company) => (
                      <li key={`distribution-${company.name}`} className="flex items-center justify-between gap-3">
                        <span>{company.name}</span>
                        <span className="text-xs text-slate-400">Distribution</span>
                      </li>
                    ))}
                    {productionCompanies.map((company) => (
                      <li key={`production-${company.name}`} className="flex items-center justify-between gap-3">
                        <span>{company.name}</span>
                        <span className="text-xs text-slate-400">Production</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              <Section title="Credits">
                <dl className="space-y-4">
                  <MetaRow label="Directors" value={directors.map((credit) => credit.name).join(', ') || 'Unknown'} />
                  <MetaRow label="Writers" value={writers.map((credit) => credit.name).join(', ') || 'Unknown'} />
                  <MetaRow label="Producers" value={producers.map((credit) => credit.name).join(', ') || 'Unknown'} />
                  <MetaRow label="Cast" value={cast.map((credit) => credit.name).join(', ') || 'Unknown'} />
                </dl>
              </Section>
            </>
          ) : (
            <p className="text-sm text-slate-500">No movie selected.</p>
          )}
        </div>
      </aside>
    </>
  );
}
