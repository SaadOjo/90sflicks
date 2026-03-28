interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

function getVisiblePages(currentPage: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | 'ellipsis'> = [1];

  if (currentPage > 3) {
    pages.push('ellipsis');
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (currentPage < totalPages - 2) {
    pages.push('ellipsis');
  }

  pages.push(totalPages);
  return pages;
}

export function Pagination({ currentPage, pageSize, totalItems, onPageChange, onPageSizeChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  const visiblePages = getVisiblePages(currentPage, totalPages);

  return (
    <div className="mt-16 flex flex-col gap-6 border-t border-outline-variant/30 pt-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="font-label text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500">
            Showing {startItem}-{endItem} of {totalItems}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <label className="font-label text-[11px] font-bold uppercase tracking-widest text-slate-500" htmlFor="page-size">
            Per page
          </label>
          <select
            id="page-size"
            className="border border-outline-variant bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-900 focus:border-primary focus:ring-0"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          className="border border-outline-variant px-4 py-3 font-label text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          type="button"
        >
          Previous
        </button>

        {visiblePages.map((page, index) =>
          page === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-2 text-slate-400">
              ...
            </span>
          ) : (
            <button
              key={page}
              className={
                page === currentPage
                  ? 'bg-primary px-4 py-3 font-label text-[11px] font-bold uppercase tracking-[0.2em] text-white'
                  : 'border border-outline-variant px-4 py-3 font-label text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900 transition-colors hover:bg-slate-200'
              }
              onClick={() => onPageChange(page)}
              type="button"
            >
              {page}
            </button>
          ),
        )}

        <button
          className="border border-outline-variant px-4 py-3 font-label text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={currentPage === totalPages || totalItems === 0}
          onClick={() => onPageChange(currentPage + 1)}
          type="button"
        >
          Next
        </button>
      </div>
    </div>
  );
}
