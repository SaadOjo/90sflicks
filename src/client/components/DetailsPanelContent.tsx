import type { ReactNode } from 'react';
import type { ArchiveMovie } from '../../shared/types/archive';
import { formatCompactNumber, formatCurrency, formatDisplayDate, formatFilmType, formatImdbRating } from '../lib/formatters';
import { getCompaniesByRole, getCreditsByRole, getMainCast } from '../lib/movieSelectors';

interface DetailsPanelContentProps {
  movie: ArchiveMovie | null;
  isLoading?: boolean;
  error?: string | null;
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

export function DetailsPanelContent({ movie, isLoading = false, error = null }: DetailsPanelContentProps) {
  const directors = movie ? getCreditsByRole(movie, 'director') : [];
  const writers = movie ? getCreditsByRole(movie, 'writer') : [];
  const producers = movie ? getCreditsByRole(movie, 'producer') : [];
  const cast = movie ? getMainCast(movie, 8) : [];
  const productionCompanies = movie ? getCompaniesByRole(movie, 'production') : [];
  const distributionCompanies = movie ? getCompaniesByRole(movie, 'distribution') : [];
  const hasFinancials = movie && (movie.budget != null || movie.boxOffice != null);
  const hasRatings = movie && (movie.imdbRating != null || movie.imdbVoteCount != null);

  if (error) {
    return <p className="text-sm text-slate-500">{error}</p>;
  }

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading details…</p>;
  }

  if (!movie) {
    return <p className="text-sm text-slate-500">No movie selected.</p>;
  }

  return (
    <>
      <div>
        <h2 className="font-headline text-2xl font-semibold text-slate-900 sm:text-3xl">{movie.title}</h2>
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
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {movie.budget != null ? <MetaRow label="Budget" value={formatCurrency(movie.budget)} /> : null}
            {movie.boxOffice != null ? <MetaRow label="Box office" value={formatCurrency(movie.boxOffice)} /> : null}
          </dl>
        </Section>
      ) : null}

      {hasRatings ? (
        <Section title="Ratings">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {movie.imdbRating != null ? <MetaRow label="IMDb rating" value={formatImdbRating(movie.imdbRating)} /> : null}
            {movie.imdbVoteCount != null ? <MetaRow label="IMDb votes" value={formatCompactNumber(movie.imdbVoteCount)} /> : null}
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
  );
}
