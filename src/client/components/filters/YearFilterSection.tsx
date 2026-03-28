import type { YearOption } from '../../lib/archiveFilters';

interface YearFilterSectionProps {
  years: YearOption[];
  selectedYears: number[];
  onYearToggle: (year: number) => void;
}

export function YearFilterSection({ years, selectedYears, onYearToggle }: YearFilterSectionProps) {
  return (
    <section>
      <label className="mb-2 block text-xs font-medium text-slate-600">Years</label>
      <div className="grid grid-cols-2 gap-2">
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
              <span className={checked ? 'font-medium text-slate-900' : ''}>
                {item.year} <span className="text-slate-400">({item.count})</span>
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}
