import { formatCompactNumber } from '../lib/formatters';

interface TopBarProps {
  indexedCount: number;
  sortValue: string;
  onSortChange: (value: string) => void;
}

export function TopBar({ indexedCount, sortValue, onSortChange }: TopBarProps) {
  return (
    <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-8">
        <span className="text-xl font-bold tracking-tighter text-slate-900 uppercase">90s Archive</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="font-headline text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
          {formatCompactNumber(indexedCount)} indexed
        </span>
        <div className="h-4 w-px bg-outline-variant/30" />
        <select
          className="cursor-pointer border-none bg-transparent font-label text-[11px] font-bold uppercase tracking-wider focus:ring-0"
          value={sortValue}
          onChange={(event) => onSortChange(event.target.value)}
        >
          <option value="releaseDate">Sort: Release Date</option>
          <option value="title">Sort: A-Z Title</option>
          <option value="boxOffice">Sort: Box Office</option>
          <option value="budget">Sort: Budget</option>
        </select>
      </div>
    </header>
  );
}
