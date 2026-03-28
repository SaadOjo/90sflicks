import { useState } from 'react';
import type { NumericRangeFilter } from '../../../shared/types/archive';

interface RatingPreset {
  label: string;
  min: number;
}

interface RatingFilterSectionProps {
  imdbRatingFilter: NumericRangeFilter;
  selectedRatingPreset: string | null;
  ratingPresets: RatingPreset[];
  onKnownOnlyChange: (checked: boolean) => void;
  onPresetSelect: (presetLabel: string | null) => void;
}

export function RatingFilterSection({
  imdbRatingFilter,
  selectedRatingPreset,
  ratingPresets,
  onKnownOnlyChange,
  onPresetSelect,
}: RatingFilterSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section>
      <button
        className="flex w-full items-center justify-between text-left text-xs font-medium text-slate-600"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span>IMDb rating</span>
        <span className="material-symbols-outlined text-base text-slate-400">{isOpen ? 'expand_less' : 'expand_more'}</span>
      </button>

      {isOpen ? (
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700">Minimum rating</span>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                checked={imdbRatingFilter.knownOnly}
                className="h-3.5 w-3.5 rounded-sm border-slate-300 text-primary focus:ring-0"
                type="checkbox"
                onChange={(event) => onKnownOnlyChange(event.target.checked)}
              />
              Known only
            </label>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {ratingPresets.map((preset) => {
              const active = selectedRatingPreset === preset.label;
              return (
                <button
                  key={preset.label}
                  className={
                    active
                      ? 'rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-medium text-white'
                      : 'rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-100'
                  }
                  onClick={() => onPresetSelect(active ? null : preset.label)}
                  type="button"
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
