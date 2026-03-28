interface SelectionSummaryProps {
  selectedValues: string[];
  emptyLabel: string;
}

export function SelectionSummary({ selectedValues, emptyLabel }: SelectionSummaryProps) {
  const visibleValues = [...selectedValues].sort((left, right) => left.localeCompare(right)).slice(0, 4);
  const remainingCount = Math.max(0, selectedValues.length - visibleValues.length);

  if (selectedValues.length === 0) {
    return <p className="text-xs text-slate-500">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {visibleValues.map((value) => (
        <span key={value} className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">
          {value}
        </span>
      ))}
      {remainingCount > 0 ? (
        <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-xs text-slate-500">
          +{remainingCount} more selected
        </span>
      ) : null}
    </div>
  );
}
