import { Search } from 'lucide-react'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AdminActionReasonModal } from '@features/admin/components/AdminActionReasonModal'
import { AdminPagination } from '@features/admin/components/AdminPagination'
import { toApiError } from '@shared/api/apiError'
import { suspendUser, unsuspendUser } from '@shared/api/adminActionApi'
import {
  getAdminUsers,
  type AdminUserItemResponse,
  type AdminUserStatus,
} from '@shared/api/adminUserApi'

const USERS_PAGE_SIZE = 10
const numberFormatter = new Intl.NumberFormat('ko-KR')

type UserStatusFilter = 'ALL' | AdminUserStatus
type UserActionType = 'suspend' | 'unsuspend'

type UserActionTarget = {
  action: UserActionType
  userId: number
  nickname: string
}

const USER_STATUS_OPTIONS: Array<{ label: string; value: UserStatusFilter }> = [
  { label: '전체', value: 'ALL' },
  { label: '정상', value: 'ACTIVE' },
  { label: '정지', value: 'SUSPENDED' },
  { label: '탈퇴', value: 'WITHDRAWN' },
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

function getUserStatusLabel(status: AdminUserStatus): string {
  if (status === 'ACTIVE') {
    return '정상'
  }

  if (status === 'SUSPENDED') {
    return '정지'
  }

  return '탈퇴'
}

function getUserStatusClassName(status: AdminUserStatus): string {
  if (status === 'ACTIVE') {
    return 'admin-members-status-badge admin-members-status-active'
  }

  if (status === 'SUSPENDED') {
    return 'admin-members-status-badge admin-members-status-suspended'
  }

  return 'admin-members-status-badge admin-members-status-withdrawn'
}

function formatGenderAge(item: AdminUserItemResponse): string {
  const parts: string[] = []

  if (item.gender === 'M') {
    parts.push('남성')
  }

  if (item.gender === 'F') {
    parts.push('여성')
  }

  if (item.age !== null) {
    parts.push(`${item.age}세`)
  }

  return parts.length > 0 ? parts.join(' · ') : '-'
}

function UserManagementLoadingState() {
  return (
    <article className="surface admin-members-table-card">
      <div className="admin-members-table-wrapper">
        <table className="admin-members-table admin-management-table admin-users-table">
          <thead>
            <tr>
              <th>번호</th>
              <th>사용자 ID</th>
              <th>닉네임</th>
              <th>이메일</th>
              <th>응원 팀</th>
              <th>성별/나이</th>
              <th>소개</th>
              <th>가입일시</th>
              <th>상태</th>
              <th>상태 변경</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }, (_, index) => (
              <tr key={index}>
                {Array.from({ length: 10 }, (_, cellIndex) => (
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

function UserManagementErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <article className="surface admin-feed-panel admin-error-panel">
      <h2 className="admin-feed-title">회원 목록을 불러오지 못했습니다.</h2>
      <p className="page-subtitle">{message}</p>
      <button className="btn-base btn-neutral admin-retry-button" onClick={onRetry} type="button">
        다시 시도
      </button>
    </article>
  )
}

function UserManagementEmptyState() {
  return (
    <div className="admin-feed-placeholder admin-log-empty-state">
      <div>
        <p className="admin-placeholder-title">회원 관리</p>
        <p className="text-muted">조건에 맞는 사용자가 없습니다.</p>
      </div>
    </div>
  )
}

function getUserAction(item: AdminUserItemResponse): UserActionType | null {
  if (item.status === 'ACTIVE') {
    return 'suspend'
  }

  if (item.status === 'SUSPENDED') {
    return 'unsuspend'
  }

  return null
}

function getUserActionLabel(action: UserActionType): string {
  if (action === 'suspend') {
    return '정지'
  }

  return '정지 해제'
}

export function UserManagementPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<UserStatusFilter>('ALL')
  const [actionTarget, setActionTarget] = useState<UserActionTarget | null>(null)

  const usersQuery = useQuery({
    queryKey: ['admin', 'users', page, keyword, status],
    queryFn: () => getAdminUsers({
      page,
      size: USERS_PAGE_SIZE,
      status: status === 'ALL' ? undefined : status,
      keyword: keyword || undefined,
    }),
    staleTime: 30_000,
  })

  const totalCount = usersQuery.data?.totalCount ?? 0
  const totalPages = usersQuery.data?.totalPages ?? 0
  const users = usersQuery.data?.items ?? []

  const userActionMutation = useMutation({
    mutationFn: ({ action, userId, reason }: UserActionTarget & { reason: string }) => (
      action === 'suspend'
        ? suspendUser(userId, reason)
        : unsuspendUser(userId, reason)
    ),
    onSuccess: async () => {
      setActionTarget(null)
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPage(0)
    setKeyword(keywordInput.trim())
  }

  const handleStatusChange = (nextStatus: UserStatusFilter) => {
    setPage(0)
    setStatus(nextStatus)
  }

  const handleActionConfirm = (reason: string) => {
    if (!actionTarget) {
      return
    }

    userActionMutation.mutate({
      ...actionTarget,
      reason,
    })
  }

  return (
    <section className="admin-page admin-members-page">
      <header className="admin-page-header">
        <h1 className="page-title admin-page-title">회원 관리</h1>
      </header>

      <article className="surface admin-members-controls">
        <form className="admin-management-search-row" onSubmit={handleSearchSubmit}>
          <div className="admin-members-control-block admin-management-search-block">
            <p className="form-label admin-members-filter-label">회원 검색</p>
            <label className="admin-members-search-field">
              <Search aria-hidden className="admin-members-search-icon" strokeWidth={2} />
              <input
                className="input-base admin-members-search-input"
                onChange={(event) => setKeywordInput(event.target.value)}
                placeholder="닉네임 또는 이메일 검색"
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
          <div className="admin-members-filter-group" aria-label="회원 상태 필터">
            {USER_STATUS_OPTIONS.map((option) => (
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
          <p className="admin-members-controls-meta">{`총 사용자 ${formatCount(totalCount)}명`}</p>
        </div>
      </article>

      {usersQuery.isPending ? <UserManagementLoadingState /> : null}

      {usersQuery.isError ? (
        <UserManagementErrorState
          message={toApiError(usersQuery.error).message}
          onRetry={() => void usersQuery.refetch()}
        />
      ) : null}

      {!usersQuery.isPending && !usersQuery.isError && users.length === 0 ? (
        <article className="surface admin-members-table-card">
          <UserManagementEmptyState />
        </article>
      ) : null}

      {!usersQuery.isPending && !usersQuery.isError && users.length > 0 ? (
        <article className="surface admin-members-table-card">
          <div className="admin-members-table-wrapper">
            <table className="admin-members-table admin-management-table admin-users-table">
              <thead>
                <tr>
                  <th>번호</th>
                  <th>사용자 ID</th>
                  <th>닉네임</th>
                  <th>이메일</th>
                  <th>응원 팀</th>
                  <th>성별/나이</th>
                  <th>소개</th>
                  <th>가입일시</th>
                  <th>상태</th>
                  <th>상태 변경</th>
                </tr>
              </thead>
              <tbody>
                {users.map((item, index) => {
                  const action = getUserAction(item)

                  return (
                    <tr key={item.userId}>
                      <td className="admin-management-number-cell">
                        {totalCount - (page * USERS_PAGE_SIZE + index)}
                      </td>
                      <td>{item.userId}</td>
                      <td>{item.nickname}</td>
                      <td className="admin-management-muted-cell">{item.email}</td>
                      <td>{item.favoriteTeamName ?? '-'}</td>
                      <td>{formatGenderAge(item)}</td>
                      <td className="admin-management-content-cell">{item.bio ?? '-'}</td>
                      <td>{formatDateTime(item.joinedAt)}</td>
                      <td>
                        <span className={getUserStatusClassName(item.status)}>
                          {getUserStatusLabel(item.status)}
                        </span>
                      </td>
                      <td>
                        {action ? (
                          <button
                            className="btn-base btn-neutral admin-management-action-button"
                            onClick={() => {
                              userActionMutation.reset()
                              setActionTarget({
                                action,
                                userId: item.userId,
                                nickname: item.nickname,
                              })
                            }}
                            type="button"
                          >
                            {getUserActionLabel(action)}
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

          <div className="admin-members-mobile-list">
            {users.map((item) => {
              const action = getUserAction(item)

              return (
                <article className="admin-members-mobile-item" key={item.userId}>
                  <div className="admin-members-mobile-header">
                    <div className="admin-members-mobile-title-group">
                      <p className="admin-members-name">{item.nickname}</p>
                      <p className="admin-members-mobile-email">{item.email}</p>
                    </div>
                    <div className="admin-members-mobile-status-wrap">
                      <span className={getUserStatusClassName(item.status)}>
                        {getUserStatusLabel(item.status)}
                      </span>
                    </div>
                  </div>

                  <div className="admin-members-mobile-chip-row">
                    <span className="admin-members-mobile-chip">{`ID ${item.userId}`}</span>
                    <span className="admin-members-mobile-chip">{item.favoriteTeamName ?? '응원 팀 없음'}</span>
                    <span className="admin-members-mobile-chip">{formatGenderAge(item)}</span>
                    <span className="admin-members-mobile-chip">{formatDateTime(item.joinedAt)}</span>
                  </div>

                  <p className="admin-management-mobile-content">{item.bio ?? '소개 없음'}</p>

                  <div className="admin-management-mobile-action-row">
                    {action ? (
                      <button
                        className="btn-base btn-neutral admin-management-action-button"
                        onClick={() => {
                          userActionMutation.reset()
                          setActionTarget({
                            action,
                            userId: item.userId,
                            nickname: item.nickname,
                          })
                        }}
                        type="button"
                      >
                        {getUserActionLabel(action)}
                      </button>
                    ) : (
                      <span className="admin-management-action-empty">-</span>
                    )}
                  </div>
                </article>
              )
            })}
          </div>

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

      <AdminActionReasonModal
        confirmLabel={actionTarget ? getUserActionLabel(actionTarget.action) : '확인'}
        errorMessage={userActionMutation.isError ? toApiError(userActionMutation.error).message : null}
        loading={userActionMutation.isPending}
        onClose={() => {
          if (userActionMutation.isPending) {
            return
          }
          userActionMutation.reset()
          setActionTarget(null)
        }}
        onConfirm={handleActionConfirm}
        open={Boolean(actionTarget)}
        targetLabel={actionTarget ? `${actionTarget.nickname} (사용자-${actionTarget.userId})` : ''}
        title={actionTarget ? `사용자 ${getUserActionLabel(actionTarget.action)}` : '사용자 상태 변경'}
      />
    </section>
  )
}
