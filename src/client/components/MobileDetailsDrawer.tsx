import type { ArchiveMovie } from '../../shared/types/archive';
import { DetailsPanelContent } from './DetailsPanelContent';

interface MobileDetailsDrawerProps {
  movie: ArchiveMovie | null;
  isOpen: boolean;
  isLoading?: boolean;
  error?: string | null;
  onClose: () => void;
}

export function MobileDetailsDrawer({ movie, isOpen, isLoading = false, error = null, onClose }: MobileDetailsDrawerProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Movie details">
      <button className="absolute inset-0 bg-slate-950/35" onClick={onClose} type="button" aria-label="Close movie details" />

      <aside className="neo-panel absolute inset-x-0 bottom-0 top-16 overflow-y-auto border-t px-5 py-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">Selected movie</p>
            <p className="truncate text-sm text-slate-700">{movie?.title ?? 'Details'}</p>
          </div>
          <button className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <div className="space-y-8 pb-6">
          <DetailsPanelContent error={error} isLoading={isLoading} movie={movie} />
        </div>
      </aside>
    </div>
  );
}
