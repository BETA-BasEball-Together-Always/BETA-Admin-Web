import { Search } from 'lucide-react'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AdminActionReasonModal } from '@features/admin/components/AdminActionReasonModal'
import { AdminPagination } from '@features/admin/components/AdminPagination'
import { toApiError } from '@shared/api/apiError'
import { hideComment, unhideComment } from '@shared/api/adminActionApi'
import {
  getAdminComments,
  type AdminCommentItemResponse,
  type AdminCommentStatus,
} from '@shared/api/adminCommentApi'

const COMMENTS_PAGE_SIZE = 10
const numberFormatter = new Intl.NumberFormat('ko-KR')

type CommentStatusFilter = 'ALL' | AdminCommentStatus
type CommentActionType = 'hide' | 'unhide'

type CommentActionTarget = {
  action: CommentActionType
  commentId: number
}

const COMMENT_STATUS_OPTIONS: Array<{ label: string; value: CommentStatusFilter }> = [
  { label: '전체', value: 'ALL' },
  { label: '노출', value: 'ACTIVE' },
  { label: '숨김', value: 'HIDDEN' },
  { label: '삭제', value: 'DELETED' },
  { label: '신고 검토', value: 'REPORTED' },
  { label: '대기', value: 'PENDING' },
]

function formatCount(value: number): string {
  return numberFormatter.format(value)
}

function formatDateTime(value: string): string {
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

function getCommentStatusLabel(status: AdminCommentStatus): string {
  if (status === 'ACTIVE') {
    return '노출'
  }

  if (status === 'HIDDEN') {
    return '숨김'
  }

  if (status === 'DELETED') {
    return '삭제'
  }

  if (status === 'REPORTED') {
    return '신고 검토'
  }

  return '대기'
}

function getCommentStatusClassName(status: AdminCommentStatus): string {
  if (status === 'ACTIVE') {
    return 'admin-members-status-badge admin-members-status-active'
  }

  if (status === 'REPORTED' || status === 'PENDING') {
    return 'admin-members-status-badge admin-members-status-warning'
  }

  if (status === 'HIDDEN') {
    return 'admin-members-status-badge admin-members-status-suspended'
  }

  return 'admin-members-status-badge admin-members-status-withdrawn'
}

function getCommentAction(item: AdminCommentItemResponse): CommentActionType | null {
  if (item.status === 'ACTIVE') {
    return 'hide'
  }

  if (item.status === 'HIDDEN') {
    return 'unhide'
  }

  return null
}

function getCommentActionLabel(action: CommentActionType): string {
  if (action === 'hide') {
    return '숨김'
  }

  return '숨김 해제'
}

function getCommentTypeLabel(depth: number): string {
  if (depth > 0) {
    return '대댓글'
  }

  return '댓글'
}

function CommentManagementLoadingState() {
  return (
    <article className="surface admin-members-table-card">
      <div className="admin-members-table-wrapper">
        <table className="admin-members-table admin-management-table admin-comments-table">
          <thead>
            <tr>
              <th>번호</th>
              <th>게시글 ID</th>
              <th>댓글 ID</th>
              <th>작성자</th>
              <th>구분</th>
              <th>본문</th>
              <th>작성일시</th>
              <th>상태</th>
              <th>상태 변경</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }, (_, index) => (
              <tr key={index}>
                {Array.from({ length: 9 }, (_, cellIndex) => (
                  <td key={cellIndex}>
                    <div className="admin-skeleton admin-members-skeleton-text" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  )
}

function CommentManagementErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <article className="surface admin-feed-panel admin-error-panel">
      <h2 className="admin-feed-title">댓글 목록을 불러오지 못했습니다.</h2>
      <p className="page-subtitle">{message}</p>
      <button className="btn-base btn-neutral admin-retry-button" onClick={onRetry} type="button">
        다시 시도
      </button>
    </article>
  )
}

function CommentManagementEmptyState() {
  return (
    <div className="admin-feed-placeholder admin-log-empty-state">
      <div>
        <p className="text-muted">조건에 맞는 댓글이 없습니다.</p>
      </div>
    </div>
  )
}

type CommentManagementTableProps = {
  items: AdminCommentItemResponse[]
  onActionOpen: (target: CommentActionTarget) => void
  page: number
  size: number
  totalCount: number
}

function CommentManagementDesktopTable({
  items,
  onActionOpen,
  page,
  size,
  totalCount,
}: CommentManagementTableProps) {
  return (
    <div className="admin-members-table-wrapper">
      <table className="admin-members-table admin-management-table admin-comments-table">
        <thead>
          <tr>
            <th>번호</th>
            <th>게시글 ID</th>
            <th>댓글 ID</th>
            <th>작성자</th>
            <th>구분</th>
            <th>본문</th>
            <th>작성일시</th>
            <th>상태</th>
            <th>상태 변경</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const action = getCommentAction(item)

            return (
              <tr key={item.commentId}>
                <td className="admin-management-number-cell">
                  {totalCount - (page * size + index)}
                </td>
                <td>{item.postId}</td>
                <td>{item.commentId}</td>
                <td>{item.authorNickname ?? `사용자-${item.authorUserId}`}</td>
                <td>{getCommentTypeLabel(item.depth)}</td>
                <td className="admin-management-content-cell admin-management-content-truncated" title={item.content}>
                  {item.content}
                </td>
                <td>{formatDateTime(item.createdAt)}</td>
                <td>
                  <span className={getCommentStatusClassName(item.status)}>
                    {getCommentStatusLabel(item.status)}
                  </span>
                </td>
                <td>
                  {action ? (
                    <button
                      className="btn-base btn-neutral admin-management-action-button"
                      onClick={() => onActionOpen({ action, commentId: item.commentId })}
                      type="button"
                    >
                      {getCommentActionLabel(action)}
                    </button>
                  ) : (
                    <span className="admin-management-action-empty">-</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function CommentManagementMobileList({
  items,
  onActionOpen,
}: {
  items: AdminCommentItemResponse[]
  onActionOpen: (target: CommentActionTarget) => void
}) {
  return (
    <div className="admin-members-mobile-list">
      {items.map((item) => {
        const action = getCommentAction(item)

        return (
          <article className="admin-members-mobile-item" key={item.commentId}>
            <div className="admin-members-mobile-header">
              <div className="admin-members-mobile-title-group">
                <p className="admin-members-name">{`게시글-${item.postId} · 댓글-${item.commentId}`}</p>
                <p className="admin-members-mobile-email">
                  {`작성자 ${item.authorNickname ?? `사용자-${item.authorUserId}`} · ${getCommentTypeLabel(item.depth)}`}
                </p>
              </div>
              <div className="admin-members-mobile-status-wrap">
                <span className={getCommentStatusClassName(item.status)}>
                  {getCommentStatusLabel(item.status)}
                </span>
              </div>
            </div>

            <div className="admin-members-mobile-chip-row">
              <span className="admin-members-mobile-chip">{formatDateTime(item.createdAt)}</span>
            </div>

            <p className="admin-management-mobile-content">{item.content}</p>

            <div className="admin-management-mobile-action-row">
              {action ? (
                <button
                  className="btn-base btn-neutral admin-management-action-button"
                  onClick={() => onActionOpen({ action, commentId: item.commentId })}
                  type="button"
                >
                  {getCommentActionLabel(action)}
                </button>
              ) : (
                <span className="admin-management-action-empty">-</span>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}

export function CommentManagementPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<CommentStatusFilter>('ALL')
  const [actionTarget, setActionTarget] = useState<CommentActionTarget | null>(null)

  const commentsQuery = useQuery({
    queryKey: ['admin', 'comments', page, keyword, status],
    queryFn: () => getAdminComments({
      page,
      size: COMMENTS_PAGE_SIZE,
      status: status === 'ALL' ? undefined : status,
      keyword: keyword || undefined,
    }),
    staleTime: 30_000,
  })

  const totalCount = commentsQuery.data?.totalCount ?? 0
  const totalPages = commentsQuery.data?.totalPages ?? 0
  const comments = commentsQuery.data?.items ?? []

  const commentActionMutation = useMutation({
    mutationFn: ({ action, commentId, reason }: CommentActionTarget & { reason: string }) => (
      action === 'hide'
        ? hideComment(commentId, reason)
        : unhideComment(commentId, reason)
    ),
    onSuccess: async () => {
      setActionTarget(null)
      await queryClient.invalidateQueries({ queryKey: ['admin', 'comments'] })
    },
  })

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPage(0)
    setKeyword(keywordInput.trim())
  }

  const handleStatusChange = (nextStatus: CommentStatusFilter) => {
    setPage(0)
    setStatus(nextStatus)
  }

  const handleActionConfirm = (reason: string) => {
    if (!actionTarget) {
      return
    }

    commentActionMutation.mutate({
      ...actionTarget,
      reason,
    })
  }

  return (
    <section className="admin-page admin-members-page">
      <header className="admin-page-header">
        <h1 className="page-title admin-page-title">댓글 관리</h1>
      </header>

      <article className="surface admin-members-controls">
        <form className="admin-management-search-row" onSubmit={handleSearchSubmit}>
          <div className="admin-members-control-block admin-management-search-block">
            <p className="form-label admin-members-filter-label">댓글 검색</p>
            <label className="admin-members-search-field">
              <Search aria-hidden className="admin-members-search-icon" strokeWidth={2} />
              <input
                className="input-base admin-members-search-input"
                onChange={(event) => setKeywordInput(event.target.value)}
                placeholder="본문 검색"
                type="search"
                value={keywordInput}
              />
            </label>
          </div>

          <button className="btn-base btn-primary admin-management-search-submit" type="submit">
            검색
          </button>
        </form>

        <div className="admin-members-control-block">
          <p className="form-label admin-members-filter-label">상태 필터</p>
          <div className="admin-members-filter-group" aria-label="댓글 상태 필터">
            {COMMENT_STATUS_OPTIONS.map((option) => (
              <button
                className={`admin-members-filter-chip ${status === option.value ? 'is-active' : ''}`}
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="admin-members-controls-footer">
          <p className="admin-members-controls-meta">{`총 댓글 ${formatCount(totalCount)}건`}</p>
        </div>
      </article>

      {commentsQuery.isPending ? <CommentManagementLoadingState /> : null}

      {commentsQuery.isError ? (
        <CommentManagementErrorState
          message={toApiError(commentsQuery.error).message}
          onRetry={() => void commentsQuery.refetch()}
        />
      ) : null}

      {!commentsQuery.isPending && !commentsQuery.isError && comments.length === 0 ? (
        <article className="surface admin-members-table-card">
          <CommentManagementEmptyState />
        </article>
      ) : null}

      {!commentsQuery.isPending && !commentsQuery.isError && comments.length > 0 ? (
        <article className="surface admin-members-table-card">
          <CommentManagementDesktopTable
            items={comments}
            onActionOpen={(target) => {
              commentActionMutation.reset()
              setActionTarget(target)
            }}
            page={page}
            size={COMMENTS_PAGE_SIZE}
            totalCount={totalCount}
          />
          <CommentManagementMobileList
            items={comments}
            onActionOpen={(target) => {
              commentActionMutation.reset()
              setActionTarget(target)
            }}
          />

          <div className="admin-management-footer">
            <div aria-hidden className="admin-management-footer-spacer" />
            <div className="admin-management-footer-pagination">
              <AdminPagination currentPage={page} onPageChange={setPage} totalPages={totalPages} />
            </div>
            <p className="admin-management-footer-meta">
              현재 페이지 {page + 1} / {Math.max(totalPages, 1)}
            </p>
          </div>
        </article>
      ) : null}

      {actionTarget ? (
        <AdminActionReasonModal
          confirmLabel={getCommentActionLabel(actionTarget.action)}
          errorMessage={commentActionMutation.isError ? toApiError(commentActionMutation.error).message : null}
          loading={commentActionMutation.isPending}
          onClose={() => {
            if (commentActionMutation.isPending) {
              return
            }
            commentActionMutation.reset()
            setActionTarget(null)
          }}
          onConfirm={handleActionConfirm}
          open
          targetLabel={`댓글-${actionTarget.commentId}`}
          title={`댓글 ${getCommentActionLabel(actionTarget.action)}`}
        />
      ) : null}
    </section>
  )
}
