import { useState } from 'react';
import type { YearOption } from '../../lib/archiveFilters';
import { SelectionSummary } from './SelectionSummary';

interface YearFilterSectionProps {
  years: YearOption[];
  selectedYears: number[];
  onYearToggle: (year: number) => void;
}

export function YearFilterSection({ years, selectedYears, onYearToggle }: YearFilterSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section>
      <button
        className="flex w-full items-center justify-between text-left text-xs font-medium text-slate-600"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span>Years</span>
        <span className="material-symbols-outlined text-base text-slate-400">{isOpen ? 'expand_less' : 'expand_more'}</span>
      </button>

      <div className="mt-3 space-y-3">
        <SelectionSummary emptyLabel="All 90s" selectedValues={[...selectedYears].sort((left, right) => left - right).map(String)} />

        {isOpen ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {years.map((item) => {
              const checked = selectedYears.includes(item.year);
              return (
                <label key={item.year} className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-xs text-slate-600 hover:bg-slate-100">
                  <input
                    checked={checked}
                    className="h-3.5 w-3.5 rounded-sm border-slate-300 text-primary focus:ring-0"
                    type="checkbox"
                    onChange={() => onYearToggle(item.year)}
                  />
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    <span className={checked ? 'font-medium text-slate-900' : ''}>{item.year}</span>
                    <span className="shrink-0 text-slate-400">({item.count})</span>
                  </div>
                </label>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
