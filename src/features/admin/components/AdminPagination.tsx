import { ChevronLeft, ChevronRight } from 'lucide-react'

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

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index)

  return (
    <nav aria-label="페이지 이동" className="admin-management-pagination">
      <button
        className="btn-base btn-neutral admin-management-pagination-button"
        disabled={currentPage === 0}
        onClick={() => onPageChange(currentPage - 1)}
        type="button"
      >
        <ChevronLeft aria-hidden strokeWidth={2} />
        <span>이전</span>
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
        className="btn-base btn-neutral admin-management-pagination-button"
        disabled={currentPage >= totalPages - 1}
        onClick={() => onPageChange(currentPage + 1)}
        type="button"
      >
        <span>다음</span>
        <ChevronRight aria-hidden strokeWidth={2} />
      </button>
    </nav>
  )
}
