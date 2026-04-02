const PAGE_GROUP_SIZE = 10

type AdminPaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function AdminPagination({
  currentPage,
  totalPages,
  onPageChange,
}: AdminPaginationProps) {
  if (totalPages <= 1) {
    return null
  }

  const currentGroupIndex = Math.floor(currentPage / PAGE_GROUP_SIZE)
  const startPage = currentGroupIndex * PAGE_GROUP_SIZE
  const endPage = Math.min(startPage + PAGE_GROUP_SIZE, totalPages)
  const pageNumbers = Array.from(
    { length: endPage - startPage },
    (_, index) => startPage + index,
  )
  const isFirstPage = currentPage === 0
  const isLastPage = currentPage >= totalPages - 1

  return (
    <nav aria-label="페이지 이동" className="admin-management-pagination">
      <button
        aria-label="첫 페이지"
        className="btn-base btn-neutral admin-management-pagination-button"
        disabled={isFirstPage}
        onClick={() => onPageChange(0)}
        type="button"
      >
        <span aria-hidden>{'<<'}</span>
      </button>

      <button
        aria-label="이전 페이지"
        className="btn-base btn-neutral admin-management-pagination-button"
        disabled={isFirstPage}
        onClick={() => onPageChange(currentPage - 1)}
        type="button"
      >
        <span aria-hidden>{'<'}</span>
      </button>

      <div className="admin-management-pagination-pages">
        {pageNumbers.map((pageNumber) => (
          <button
            aria-current={currentPage === pageNumber ? 'page' : undefined}
            className={`admin-management-page-button ${currentPage === pageNumber ? 'is-active' : ''}`}
            key={pageNumber}
            onClick={() => onPageChange(pageNumber)}
            type="button"
          >
            {pageNumber + 1}
          </button>
        ))}
      </div>

      <button
        aria-label="다음 페이지"
        className="btn-base btn-neutral admin-management-pagination-button"
        disabled={isLastPage}
        onClick={() => onPageChange(currentPage + 1)}
        type="button"
      >
        <span aria-hidden>{'>'}</span>
      </button>

      <button
        aria-label="마지막 페이지"
        className="btn-base btn-neutral admin-management-pagination-button"
        disabled={isLastPage}
        onClick={() => onPageChange(totalPages - 1)}
        type="button"
      >
        <span aria-hidden>{'>>'}</span>
      </button>
    </nav>
  )
}
