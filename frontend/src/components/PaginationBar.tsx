interface PaginationBarProps {
  page: number;
  pages: number;
  total: number;
  onPage: (page: number) => void;
}

export function PaginationBar({ page, pages, total, onPage }: PaginationBarProps) {
  if (pages <= 1) return null;

  return (
    <div className="pagination">
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
      <span>Page {page} of {pages} · {total} expenses</span>
      <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
    </div>
  );
}