import type { ArchiveMovie } from '../../shared/types/archive';
import { DetailsPanelContent } from './DetailsPanelContent';

interface DetailsPanelProps {
  movie: ArchiveMovie | null;
  isOpen: boolean;
  isLoading?: boolean;
  error?: string | null;
  onToggle: () => void;
}

export function DetailsPanel({ movie, isOpen, isLoading = false, error = null, onToggle }: DetailsPanelProps) {
  return (
    <>
      <button
        aria-label={isOpen ? 'Hide details panel' : 'Show details panel'}
        className={`neo-toggle-tab fixed top-24 z-40 hidden h-16 w-5 items-center justify-center rounded-l-md border text-slate-500 transition-[right,color] duration-200 hover:text-slate-900 lg:flex ${
          isOpen ? 'right-[379px] border-r-0' : 'right-0 border-r-0'
        }`}
        onClick={onToggle}
        type="button"
      >
        <span className="material-symbols-outlined text-sm">{isOpen ? 'chevron_right' : 'chevron_left'}</span>
      </button>

      <aside
        className={`neo-panel fixed right-0 top-16 bottom-0 hidden w-[380px] overflow-y-auto border-l transition-transform duration-200 lg:block ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="space-y-8 py-6 pr-6 pl-10">
          <DetailsPanelContent error={error} isLoading={isLoading} movie={movie} />
        </div>
      </aside>
    </>
  );
}
