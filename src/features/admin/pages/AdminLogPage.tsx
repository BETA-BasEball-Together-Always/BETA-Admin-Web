import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import { toApiError } from '@shared/api/apiError'
import {
  getAdminLogs,
  type AdminLogAction,
  type AdminLogItemResponse,
  type AdminLogTargetType,
} from '@shared/api/adminLogApi'

const ADMIN_LOGS_PAGE_SIZE = 10
const numberFormatter = new Intl.NumberFormat('ko-KR')

type AdminLogFilterValue = 'ALL' | AdminLogAction

type AdminLogFilterState = {
  action: AdminLogFilterValue
  from: string
  to: string
}

const DEFAULT_FILTERS: AdminLogFilterState = {
  action: 'ALL',
  from: '',
  to: '',
}

const ADMIN_LOG_FILTER_OPTIONS: Array<{
  label: string
  value: AdminLogFilterValue
}> = [
  { label: '전체', value: 'ALL' },
  { label: '회원 정지', value: 'MEMBER_SUSPEND' },
  { label: '회원 정지 해제', value: 'MEMBER_UNSUSPEND' },
  { label: '게시글 숨김', value: 'POST_HIDE' },
  { label: '게시글 숨김 해제', value: 'POST_UNHIDE' },
  { label: '댓글 숨김', value: 'COMMENT_HIDE' },
  { label: '댓글 숨김 해제', value: 'COMMENT_UNHIDE' },
]

function formatCount(value: number): string {
  return numberFormatter.format(value)
}

function resolveActionLabel(action: AdminLogAction): string {
  if (action === 'MEMBER_SUSPEND') {
    return '회원 정지'
  }

  if (action === 'MEMBER_UNSUSPEND') {
    return '회원 정지 해제'
  }

  if (action === 'POST_HIDE') {
    return '게시글 숨김'
  }

  if (action === 'POST_UNHIDE') {
    return '게시글 숨김 해제'
  }

  if (action === 'COMMENT_HIDE') {
    return '댓글 숨김'
  }

  return '댓글 숨김 해제'
}

function resolveTargetLabel(targetType: AdminLogTargetType, targetId: number): string {
  if (targetType === 'MEMBER') {
    return `회원-${targetId}`
  }

  if (targetType === 'POST') {
    return `게시글-${targetId}`
  }

  return `댓글-${targetId}`
}

function formatAdminLogDateTime(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function parseFilterDate(value: string): Date | undefined {
  if (!value) {
    return undefined
  }

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return undefined
  }

  return date
}

function formatFilterDateLabel(value: string, placeholder: string): string {
  const date = parseFilterDate(value)

  if (!date) {
    return placeholder
  }

  return format(date, 'yyyy. MM. dd')
}

function AdminLogLoadingState() {
  return (
    <article className="surface admin-log-table-card">
      <div className="admin-log-table-wrapper">
        <table className="admin-log-table">
          <thead>
            <tr>
              <th>번호</th>
              <th>변경한 관리자</th>
              <th>대상 ID</th>
              <th>액션</th>
              <th>변경 사유</th>
              <th>시간</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }, (_, index) => (
              <tr key={index}>
                <td><div className="admin-skeleton admin-members-skeleton-text" /></td>
                <td><div className="admin-skeleton admin-members-skeleton-text" /></td>
                <td><div className="admin-skeleton admin-members-skeleton-text" /></td>
                <td><div className="admin-skeleton admin-members-skeleton-badge" /></td>
                <td><div className="admin-skeleton admin-members-skeleton-text" /></td>
                <td><div className="admin-skeleton admin-members-skeleton-text" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  )
}

type AdminLogErrorStateProps = {
  message: string
  onRetry: () => void
}

function AdminLogErrorState({ message, onRetry }: AdminLogErrorStateProps) {
  return (
    <article className="surface admin-feed-panel admin-error-panel">
      <h2 className="admin-feed-title">조치 이력을 불러오지 못했습니다.</h2>
      <p className="page-subtitle">{message}</p>
      <button className="btn-base btn-neutral admin-retry-button" onClick={onRetry} type="button">
        다시 시도
      </button>
    </article>
  )
}

function AdminLogEmptyState() {
  return (
    <div className="surface-muted admin-empty-state admin-log-empty-state">
      <p className="text-muted">조건에 맞는 조치 이력이 없습니다.</p>
    </div>
  )
}

type AdminPaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

function AdminPagination({ currentPage, totalPages, onPageChange }: AdminPaginationProps) {
  const pageNumbers = useMemo(
    () => Array.from({ length: totalPages }, (_, index) => index),
    [totalPages],
  )

  if (totalPages <= 1) {
    return null
  }

  return (
    <nav aria-label="관리자 로그 페이지 이동" className="admin-log-pagination">
      <button
        className="btn-base btn-neutral admin-log-pagination-button"
        disabled={currentPage === 0}
        onClick={() => onPageChange(currentPage - 1)}
        type="button"
      >
        <ChevronLeft aria-hidden strokeWidth={2} />
        <span>이전</span>
      </button>

      <div className="admin-log-pagination-pages">
        {pageNumbers.map((pageNumber) => (
          <button
            aria-current={currentPage === pageNumber ? 'page' : undefined}
            className={`admin-log-page-button ${currentPage === pageNumber ? 'is-active' : ''}`}
            key={pageNumber}
            onClick={() => onPageChange(pageNumber)}
            type="button"
          >
            {pageNumber + 1}
          </button>
        ))}
      </div>

      <button
        className="btn-base btn-neutral admin-log-pagination-button"
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

type AdminLogDesktopTableProps = {
  items: AdminLogItemResponse[]
  page: number
  size: number
  totalCount: number
}

function AdminLogDesktopTable({ items, page, size, totalCount }: AdminLogDesktopTableProps) {
  return (
    <div className="admin-log-table-wrapper">
      <table className="admin-log-table">
        <thead>
          <tr>
            <th>번호</th>
            <th>변경한 관리자</th>
            <th>대상 ID</th>
            <th>액션</th>
            <th>변경 사유</th>
            <th>시간</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.logId}>
              <td className="admin-log-number-cell">{totalCount - (page * size + index)}</td>
              <td className="admin-log-admin-cell">{item.actorAdminNickname}</td>
              <td>{resolveTargetLabel(item.targetType, item.targetId)}</td>
              <td>
                <span className="admin-log-action-badge">{resolveActionLabel(item.action)}</span>
              </td>
              <td className="admin-log-reason-cell">{item.reason ?? '-'}</td>
              <td>{formatAdminLogDateTime(item.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AdminLogMobileList({ items }: { items: AdminLogItemResponse[] }) {
  return (
    <div className="admin-log-mobile-list">
      {items.map((item) => (
        <article className="admin-log-mobile-item" key={item.logId}>
          <div className="admin-log-mobile-header">
            <div>
              <p className="admin-log-mobile-time">{formatAdminLogDateTime(item.createdAt)}</p>
              <p className="admin-log-mobile-admin">{item.actorAdminNickname}</p>
            </div>
            <span className="admin-log-action-badge">{resolveActionLabel(item.action)}</span>
          </div>

          <div className="admin-log-mobile-meta">
            <span className="admin-log-mobile-chip">{resolveTargetLabel(item.targetType, item.targetId)}</span>
          </div>

          <p className="admin-log-mobile-reason">{item.reason ?? '변경 사유 없음'}</p>
        </article>
      ))}
    </div>
  )
}

export function AdminLogPage() {
  const [page, setPage] = useState(0)
  const [draftFilters, setDraftFilters] = useState<AdminLogFilterState>(DEFAULT_FILTERS)
  const [filters, setFilters] = useState<AdminLogFilterState>(DEFAULT_FILTERS)
  const [openDatePicker, setOpenDatePicker] = useState<'from' | 'to' | null>(null)
  const datePickerRef = useRef<HTMLDivElement | null>(null)
  const selectedFromDate = parseFilterDate(draftFilters.from)
  const selectedToDate = parseFilterDate(draftFilters.to)

  const hasInvalidDateRange = Boolean(
    draftFilters.from && draftFilters.to && draftFilters.from > draftFilters.to,
  )

  const adminLogsQuery = useQuery({
    queryKey: ['admin', 'logs', page, filters],
    queryFn: () => getAdminLogs({
      page,
      size: ADMIN_LOGS_PAGE_SIZE,
      action: filters.action === 'ALL' ? undefined : filters.action,
      from: filters.from || undefined,
      to: filters.to || undefined,
    }),
    staleTime: 30_000,
  })

  const adminLogs = adminLogsQuery.data?.items ?? []
  const totalCount = adminLogsQuery.data?.totalCount ?? 0
  const totalPages = adminLogsQuery.data?.totalPages ?? 0
  const totalCountLabel = adminLogsQuery.data
    ? `총 로그 ${formatCount(totalCount)}건`
    : '총 로그 -건'

  const handleApplyFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (hasInvalidDateRange) {
      return
    }

    setPage(0)
    setFilters(draftFilters)
  }

  const handleDateChange = (key: 'from' | 'to', date: Date | undefined) => {
    setDraftFilters((current) => ({
      ...current,
      [key]: date ? format(date, 'yyyy-MM-dd') : '',
    }))
    setOpenDatePicker(null)
  }

  const handleActionFilterSelect = (action: AdminLogFilterValue) => {
    setPage(0)
    setDraftFilters((current) => ({
      ...current,
      action,
    }))
    setFilters((current) => ({
      ...current,
      action,
    }))
  }

  useEffect(() => {
    if (!openDatePicker) {
      return undefined
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setOpenDatePicker(null)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [openDatePicker])

  return (
    <section className="admin-page admin-log-page">
      <header className="admin-page-header admin-log-page-header">
        <div className="admin-log-header-row">
          <h1 className="page-title admin-page-title">조치 이력</h1>
        </div>
      </header>

      <article className="surface admin-log-controls">
        <form className="admin-log-controls-form" onSubmit={handleApplyFilters}>
          <div className="admin-log-controls-meta-row">
            <p className="admin-log-controls-meta">{totalCountLabel}</p>
          </div>

          <div className="admin-log-control-row admin-log-control-row-period">
            <div className="admin-log-control-block admin-log-control-block-period">
              <p className="form-label admin-log-filter-label">기간 검색</p>
              <div className="admin-log-period-fields-row">
                <div className="admin-log-date-picker" ref={datePickerRef}>
                  <div className="admin-log-date-fields">
                    <div className="admin-log-date-field">
                      <button
                        aria-expanded={openDatePicker === 'from'}
                        className={`btn-base btn-neutral admin-log-date-trigger ${openDatePicker === 'from' ? 'is-active' : ''}`}
                        onClick={() => setOpenDatePicker((current) => current === 'from' ? null : 'from')}
                        type="button"
                      >
                        <span>{formatFilterDateLabel(draftFilters.from, '시작일 선택')}</span>
                        <CalendarDays aria-hidden className="admin-log-date-trigger-icon" strokeWidth={2} />
                      </button>

                      {openDatePicker === 'from' ? (
                        <div className="surface admin-log-date-popover">
                          <DayPicker
                            mode="single"
                            onSelect={(date) => handleDateChange('from', date)}
                            selected={selectedFromDate}
                          />
                        </div>
                      ) : null}
                    </div>

                    <span className="admin-log-range-separator">~</span>

                    <div className="admin-log-date-field">
                      <button
                        aria-expanded={openDatePicker === 'to'}
                        className={`btn-base btn-neutral admin-log-date-trigger ${openDatePicker === 'to' ? 'is-active' : ''}`}
                        onClick={() => setOpenDatePicker((current) => current === 'to' ? null : 'to')}
                        type="button"
                      >
                        <span>{formatFilterDateLabel(draftFilters.to, '종료일 선택')}</span>
                        <CalendarDays aria-hidden className="admin-log-date-trigger-icon" strokeWidth={2} />
                      </button>

                      {openDatePicker === 'to' ? (
                        <div className="surface admin-log-date-popover">
                          <DayPicker
                            mode="single"
                            onSelect={(date) => handleDateChange('to', date)}
                            selected={selectedToDate}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="admin-log-controls-actions">
                  <button className="btn-base btn-primary admin-log-submit-button" disabled={hasInvalidDateRange} type="submit">
                    조회
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-log-control-row">
            <div className="admin-log-control-block">
              <p className="form-label admin-log-filter-label">액션 필터</p>
              <div className="admin-log-filter-group">
                {ADMIN_LOG_FILTER_OPTIONS.map((option) => (
                  <button
                    className={`admin-log-filter-chip ${draftFilters.action === option.value ? 'is-active' : ''}`}
                    key={option.value}
                    onClick={() => handleActionFilterSelect(option.value)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </form>

        {hasInvalidDateRange ? (
          <p className="admin-log-controls-error">시작일은 종료일보다 늦을 수 없습니다.</p>
        ) : null}
      </article>

      {adminLogsQuery.isPending ? <AdminLogLoadingState /> : null}

      {adminLogsQuery.isError ? (
        <AdminLogErrorState
          message={toApiError(adminLogsQuery.error).message}
          onRetry={() => void adminLogsQuery.refetch()}
        />
      ) : null}

      {!adminLogsQuery.isPending && !adminLogsQuery.isError && adminLogs.length === 0 ? (
        <article className="surface admin-log-table-card">
          <AdminLogEmptyState />
        </article>
      ) : null}

      {!adminLogsQuery.isPending && !adminLogsQuery.isError && adminLogs.length > 0 ? (
        <article className="surface admin-log-table-card">
          <AdminLogDesktopTable
            items={adminLogs}
            page={page}
            size={ADMIN_LOGS_PAGE_SIZE}
            totalCount={totalCount}
          />
          <AdminLogMobileList items={adminLogs} />

          <div className="admin-log-footer">
            <div aria-hidden className="admin-log-footer-spacer" />
            <div className="admin-log-footer-pagination">
              <AdminPagination currentPage={page} onPageChange={setPage} totalPages={totalPages} />
            </div>
            <p className="admin-log-footer-meta">
              현재 페이지 {page + 1} / {Math.max(totalPages, 1)}
            </p>
          </div>
        </article>
      ) : null}
    </section>
  )
}
