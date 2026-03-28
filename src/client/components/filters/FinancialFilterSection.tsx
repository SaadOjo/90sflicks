import { useState } from 'react';
import type { NumericRangeFilter } from '../../../shared/types/archive';

interface RangePreset {
  label: string;
  min?: number;
  max?: number;
}

interface FinancialFilterSectionProps {
  budgetFilter: NumericRangeFilter;
  boxOfficeFilter: NumericRangeFilter;
  selectedBudgetPreset: string | null;
  selectedBoxOfficePreset: string | null;
  budgetPresets: RangePreset[];
  boxOfficePresets: RangePreset[];
  onBudgetKnownOnlyChange: (checked: boolean) => void;
  onBoxOfficeKnownOnlyChange: (checked: boolean) => void;
  onBudgetPresetSelect: (presetLabel: string | null) => void;
  onBoxOfficePresetSelect: (presetLabel: string | null) => void;
}

function PresetChips({
  presets,
  selectedLabel,
  onSelect,
}: {
  presets: RangePreset[];
  selectedLabel: string | null;
  onSelect: (label: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {presets.map((preset) => {
        const active = selectedLabel === preset.label;
        return (
          <button
            key={preset.label}
            className={
              active
                ? 'rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-medium text-white'
                : 'rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-100'
            }
            onClick={() => onSelect(active ? null : preset.label)}
            type="button"
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}

export function FinancialFilterSection({
  budgetFilter,
  boxOfficeFilter,
  selectedBudgetPreset,
  selectedBoxOfficePreset,
  budgetPresets,
  boxOfficePresets,
  onBudgetKnownOnlyChange,
  onBoxOfficeKnownOnlyChange,
  onBudgetPresetSelect,
  onBoxOfficePresetSelect,
}: FinancialFilterSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section>
      <button
        className="flex w-full items-center justify-between text-left text-xs font-medium text-slate-600"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span>Financials</span>
        <span className="material-symbols-outlined text-base text-slate-400">{isOpen ? 'expand_less' : 'expand_more'}</span>
      </button>

      {isOpen ? (
        <div className="mt-3 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700">Budget</span>
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  checked={budgetFilter.knownOnly}
                  className="h-3.5 w-3.5 rounded-sm border-slate-300 text-primary focus:ring-0"
                  type="checkbox"
                  onChange={(event) => onBudgetKnownOnlyChange(event.target.checked)}
                />
                Known only
              </label>
            </div>
            <PresetChips presets={budgetPresets} selectedLabel={selectedBudgetPreset} onSelect={onBudgetPresetSelect} />
          </div>

          <div className="space-y-2 border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700">Box office</span>
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  checked={boxOfficeFilter.knownOnly}
                  className="h-3.5 w-3.5 rounded-sm border-slate-300 text-primary focus:ring-0"
                  type="checkbox"
                  onChange={(event) => onBoxOfficeKnownOnlyChange(event.target.checked)}
                />
                Known only
              </label>
            </div>
            <PresetChips presets={boxOfficePresets} selectedLabel={selectedBoxOfficePreset} onSelect={onBoxOfficePresetSelect} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
