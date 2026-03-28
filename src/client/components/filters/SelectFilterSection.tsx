import { useState } from 'react';
import type { SelectOption } from '../../lib/archiveFilters';
import { SelectionSummary } from './SelectionSummary';

interface SelectFilterSectionProps {
  title: string;
  emptyLabel: string;
  options: SelectOption[];
  selectedValues: string[];
  onToggle: (value: string) => void;
}

export function SelectFilterSection({ title, emptyLabel, options, selectedValues, onToggle }: SelectFilterSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedValueSet = new Set(selectedValues);

  return (
    <section>
      <button
        className="flex w-full items-center justify-between text-left text-xs font-medium text-slate-600"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span>{title}</span>
        <span className="material-symbols-outlined text-base text-slate-400">{isOpen ? 'expand_less' : 'expand_more'}</span>
      </button>

      <div className="mt-3 space-y-3">
        <SelectionSummary emptyLabel={emptyLabel} selectedValues={selectedValues} />

        {isOpen ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {options.map((option) => {
              const checked = selectedValueSet.has(option.name);
              return (
                <label key={option.name} className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-xs text-slate-600 hover:bg-slate-100">
                  <input
                    checked={checked}
                    className="h-3.5 w-3.5 rounded-sm border-slate-300 text-primary focus:ring-0"
                    type="checkbox"
                    onChange={() => onToggle(option.name)}
                  />
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    <span className={`min-w-0 truncate ${checked ? 'font-medium text-slate-900' : ''}`} title={option.name}>
                      {option.name}
                    </span>
                    <span className="shrink-0 text-slate-400">({option.count})</span>
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
