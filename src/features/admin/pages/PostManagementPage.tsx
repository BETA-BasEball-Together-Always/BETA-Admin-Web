import { Search } from 'lucide-react'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AdminActionReasonModal } from '@features/admin/components/AdminActionReasonModal'
import { AdminPagination } from '@features/admin/components/AdminPagination'
import { toApiError } from '@shared/api/apiError'
import { hidePost, unhidePost } from '@shared/api/adminActionApi'
import {
  getAdminPosts,
  type AdminPostChannel,
  type AdminPostItemResponse,
  type AdminPostStatus,
} from '@shared/api/adminPostApi'

const POSTS_PAGE_SIZE = 10
const numberFormatter = new Intl.NumberFormat('ko-KR')
const ALL_CHANNELS = '__ALL__'

type PostStatusFilter = 'ALL' | AdminPostStatus
type PostChannelFilter = typeof ALL_CHANNELS | AdminPostChannel
type PostActionType = 'hide' | 'unhide'

type PostActionTarget = {
  action: PostActionType
  postId: number
}

const POST_STATUS_OPTIONS: Array<{ label: string; value: PostStatusFilter }> = [
  { label: '전체', value: 'ALL' },
  { label: '노출', value: 'ACTIVE' },
  { label: '숨김', value: 'HIDDEN' },
  { label: '삭제', value: 'DELETED' },
  { label: '신고 검토', value: 'REPORTED' },
  { label: '대기', value: 'PENDING' },
]

const POST_CHANNEL_OPTIONS: Array<{ label: string; value: PostChannelFilter }> = [
  { label: '전체', value: ALL_CHANNELS },
  { label: '공통', value: 'ALL' },
  { label: '두산', value: 'DOOSAN' },
  { label: 'LG', value: 'LG' },
  { label: '키움', value: 'KIWOOM' },
  { label: 'KT', value: 'KT' },
  { label: 'SSG', value: 'SSG' },
  { label: 'KIA', value: 'KIA' },
  { label: '삼성', value: 'SAMSUNG' },
  { label: 'NC', value: 'NC' },
  { label: '한화', value: 'HANWHA' },
  { label: '롯데', value: 'LOTTE' },
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

function getPostStatusLabel(status: AdminPostStatus): string {
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

function getPostStatusClassName(status: AdminPostStatus): string {
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

function getPostAction(item: AdminPostItemResponse): PostActionType | null {
  if (item.status === 'ACTIVE') {
    return 'hide'
  }

  if (item.status === 'HIDDEN') {
    return 'unhide'
  }

  return null
}

function getPostActionLabel(action: PostActionType): string {
  if (action === 'hide') {
    return '숨김'
  }

  return '숨김 해제'
}

function resolveInitialChannel(teamCode: string | null): PostChannelFilter {
  const validOption = POST_CHANNEL_OPTIONS.find((option) => option.value === teamCode)
  return validOption ? validOption.value : ALL_CHANNELS
}

function PostManagementLoadingState() {
  return (
    <article className="surface admin-members-table-card">
      <div className="admin-members-table-wrapper">
        <table className="admin-members-table admin-management-table admin-posts-table">
          <thead>
            <tr>
              <th>번호</th>
              <th>게시글 ID</th>
              <th>작성자</th>
              <th>채널</th>
              <th>본문</th>
              <th>작성일시</th>
              <th>상태</th>
              <th>상태 변경</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }, (_, index) => (
              <tr key={index}>
                {Array.from({ length: 8 }, (_, cellIndex) => (
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

function PostManagementErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <article className="surface admin-feed-panel admin-error-panel">
      <h2 className="admin-feed-title">게시글 목록을 불러오지 못했습니다.</h2>
      <p className="page-subtitle">{message}</p>
      <button className="btn-base btn-neutral admin-retry-button" onClick={onRetry} type="button">
        다시 시도
      </button>
    </article>
  )
}

function PostManagementEmptyState() {
  return (
    <div className="admin-feed-placeholder admin-log-empty-state">
      <div>
        <p className="text-muted">조건에 맞는 게시글이 없습니다.</p>
      </div>
    </div>
  )
}

type PostManagementTableProps = {
  items: AdminPostItemResponse[]
  onActionOpen: (target: PostActionTarget) => void
  onPostOpen: (postId: number) => void
  page: number
  size: number
  totalCount: number
}

function PostManagementDesktopTable({
  items,
  onActionOpen,
  onPostOpen,
  page,
  size,
  totalCount,
}: PostManagementTableProps) {
  return (
    <div className="admin-members-table-wrapper">
      <table className="admin-members-table admin-management-table admin-posts-table">
        <thead>
          <tr>
            <th>번호</th>
            <th>게시글 ID</th>
            <th>작성자</th>
            <th>채널</th>
            <th>본문</th>
            <th>작성일시</th>
            <th>상태</th>
            <th>상태 변경</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const action = getPostAction(item)

            return (
              <tr
                aria-label={`게시글 ${item.postId} 상세 보기`}
                className="admin-post-row-clickable"
                key={item.postId}
                onClick={() => onPostOpen(item.postId)}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' && event.key !== ' ') {
                    return
                  }

                  event.preventDefault()
                  onPostOpen(item.postId)
                }}
                role="link"
                tabIndex={0}
              >
                <td className="admin-management-number-cell">
                  {totalCount - (page * size + index)}
                </td>
                <td>{item.postId}</td>
                <td>{item.authorNickname ?? `사용자-${item.authorUserId}`}</td>
                <td>{item.channel}</td>
                <td className="admin-management-content-cell admin-management-content-truncated" title={item.content}>
                  {item.content}
                </td>
                <td>{formatDateTime(item.createdAt)}</td>
                <td>
                  <span className={getPostStatusClassName(item.status)}>
                    {getPostStatusLabel(item.status)}
                  </span>
                </td>
                <td>
                  {action ? (
                    <button
                      className="btn-base btn-neutral admin-management-action-button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onActionOpen({ action, postId: item.postId })
                      }}
                      type="button"
                    >
                      {getPostActionLabel(action)}
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

function PostManagementMobileList({
  items,
  onActionOpen,
  onPostOpen,
}: {
  items: AdminPostItemResponse[]
  onActionOpen: (target: PostActionTarget) => void
  onPostOpen: (postId: number) => void
}) {
  return (
    <div className="admin-members-mobile-list">
      {items.map((item) => {
        const action = getPostAction(item)

        return (
          <article
            aria-label={`게시글 ${item.postId} 상세 보기`}
            className="admin-members-mobile-item admin-post-card-clickable"
            key={item.postId}
            onClick={() => onPostOpen(item.postId)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') {
                return
              }

              event.preventDefault()
              onPostOpen(item.postId)
            }}
            role="link"
            tabIndex={0}
          >
            <div className="admin-members-mobile-header">
              <div className="admin-members-mobile-title-group">
                <p className="admin-members-name">{`게시글-${item.postId}`}</p>
                <p className="admin-members-mobile-email">
                  {item.authorNickname ?? `사용자-${item.authorUserId}`}
                </p>
              </div>
              <div className="admin-members-mobile-status-wrap">
                <span className={getPostStatusClassName(item.status)}>
                  {getPostStatusLabel(item.status)}
                </span>
              </div>
            </div>

            <div className="admin-members-mobile-chip-row">
              <span className="admin-members-mobile-chip">{item.channel}</span>
              <span className="admin-members-mobile-chip">{formatDateTime(item.createdAt)}</span>
            </div>

            <p className="admin-management-mobile-content">{item.content}</p>

            <div className="admin-management-mobile-action-row">
              {action ? (
                <button
                  className="btn-base btn-neutral admin-management-action-button"
                  onClick={(event) => {
                    event.stopPropagation()
                    onActionOpen({ action, postId: item.postId })
                  }}
                  type="button"
                >
                  {getPostActionLabel(action)}
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

export function PostManagementPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [page, setPage] = useState(0)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<PostStatusFilter>('ALL')
  const [channel, setChannel] = useState<PostChannelFilter>(
    () => resolveInitialChannel(searchParams.get('team')),
  )
  const [actionTarget, setActionTarget] = useState<PostActionTarget | null>(null)

  const postsQuery = useQuery({
    queryKey: ['admin', 'posts', page, keyword, status, channel],
    queryFn: () => getAdminPosts({
      page,
      size: POSTS_PAGE_SIZE,
      status: status === 'ALL' ? undefined : status,
      channel: channel === ALL_CHANNELS ? undefined : channel,
      keyword: keyword || undefined,
    }),
    staleTime: 30_000,
  })

  const totalCount = postsQuery.data?.totalCount ?? 0
  const totalPages = postsQuery.data?.totalPages ?? 0
  const posts = postsQuery.data?.items ?? []

  const postActionMutation = useMutation({
    mutationFn: ({ action, postId, reason }: PostActionTarget & { reason: string }) => (
      action === 'hide'
        ? hidePost(postId, reason)
        : unhidePost(postId, reason)
    ),
    onSuccess: async () => {
      setActionTarget(null)
      await queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] })
    },
  })

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPage(0)
    setKeyword(keywordInput.trim())
  }

  const handleStatusChange = (nextStatus: PostStatusFilter) => {
    setPage(0)
    setStatus(nextStatus)
  }

  const handleChannelChange = (nextChannel: PostChannelFilter) => {
    setPage(0)
    setChannel(nextChannel)
  }

  const handleActionConfirm = (reason: string) => {
    if (!actionTarget) {
      return
    }

    postActionMutation.mutate({
      ...actionTarget,
      reason,
    })
  }

  const handlePostOpen = (postId: number) => {
    navigate(`/posts/${postId}`)
  }

  return (
    <section className="admin-page admin-members-page">
      <header className="admin-page-header">
        <h1 className="page-title admin-page-title">게시글 관리</h1>
      </header>

      <article className="surface admin-members-controls">
        <form className="admin-management-search-row" onSubmit={handleSearchSubmit}>
          <div className="admin-members-control-block admin-management-search-block">
            <p className="form-label admin-members-filter-label">게시글 검색</p>
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
          <div className="admin-members-filter-group" aria-label="게시글 상태 필터">
            {POST_STATUS_OPTIONS.map((option) => (
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

        <div className="admin-members-control-block">
          <p className="form-label admin-members-filter-label">채널 필터</p>
          <div className="admin-members-filter-group" aria-label="게시글 채널 필터">
            {POST_CHANNEL_OPTIONS.map((option) => (
              <button
                className={`admin-members-filter-chip ${channel === option.value ? 'is-active' : ''}`}
                key={option.value}
                onClick={() => handleChannelChange(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="admin-members-controls-footer">
          <p className="admin-members-controls-meta">{`총 게시글 ${formatCount(totalCount)}건`}</p>
        </div>
      </article>

      {postsQuery.isPending ? <PostManagementLoadingState /> : null}

      {postsQuery.isError ? (
        <PostManagementErrorState
          message={toApiError(postsQuery.error).message}
          onRetry={() => void postsQuery.refetch()}
        />
      ) : null}

      {!postsQuery.isPending && !postsQuery.isError && posts.length === 0 ? (
        <article className="surface admin-members-table-card">
          <PostManagementEmptyState />
        </article>
      ) : null}

      {!postsQuery.isPending && !postsQuery.isError && posts.length > 0 ? (
        <article className="surface admin-members-table-card">
          <PostManagementDesktopTable
            items={posts}
            onActionOpen={(target) => {
              postActionMutation.reset()
              setActionTarget(target)
            }}
            onPostOpen={handlePostOpen}
            page={page}
            size={POSTS_PAGE_SIZE}
            totalCount={totalCount}
          />
          <PostManagementMobileList
            items={posts}
            onActionOpen={(target) => {
              postActionMutation.reset()
              setActionTarget(target)
            }}
            onPostOpen={handlePostOpen}
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
          confirmLabel={getPostActionLabel(actionTarget.action)}
          errorMessage={postActionMutation.isError ? toApiError(postActionMutation.error).message : null}
          loading={postActionMutation.isPending}
          onClose={() => {
            if (postActionMutation.isPending) {
              return
            }
            postActionMutation.reset()
            setActionTarget(null)
          }}
          onConfirm={handleActionConfirm}
          open
          targetLabel={`게시글-${actionTarget.postId}`}
          title={`게시글 ${getPostActionLabel(actionTarget.action)}`}
        />
      ) : null}
    </section>
  )
}
