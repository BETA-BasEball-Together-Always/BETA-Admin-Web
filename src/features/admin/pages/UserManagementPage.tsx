import type { EChartsOption } from 'echarts'
import { BarChart, PieChart } from 'echarts/charts'
import {
  GraphicComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components'
import * as echarts from 'echarts/core'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import { CanvasRenderer } from 'echarts/renderers'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BarChart3, PieChart as PieChartIcon, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { AdminActionReasonModal } from '@features/admin/components/AdminActionReasonModal'
import { AdminPagination } from '@features/admin/components/AdminPagination'
import { toApiError } from '@shared/api/apiError'
import { suspendUser, unsuspendUser } from '@shared/api/adminActionApi'
import {
  getAdminUserStatistics,
  getAdminUsers,
  type AdminUserAgeGroup,
  type AdminUserGenderCategory,
  type AdminUserItemResponse,
  type AdminUserStatus,
} from '@shared/api/adminUserApi'

echarts.use([
  GridComponent,
  TooltipComponent,
  LegendComponent,
  GraphicComponent,
  PieChart,
  BarChart,
  CanvasRenderer,
])

const USERS_PAGE_SIZE = 10
const USER_STATISTICS_QUERY_KEY = ['admin', 'users', 'statistics'] as const
const numberFormatter = new Intl.NumberFormat('ko-KR')

type UserStatusFilter = 'ALL' | AdminUserStatus
type UserActionType = 'suspend' | 'unsuspend'

type UserActionTarget = {
  action: UserActionType
  userId: number
  nickname: string
}

type ChartTokens = {
  text: string
  muted: string
  border: string
  surface: string
  primary: string
  secondary: string
  accent: string
  success: string
}

const DEFAULT_CHART_TOKENS: ChartTokens = {
  text: '#f8fafc',
  muted: '#94a3b8',
  border: 'rgba(148, 163, 184, 0.22)',
  surface: '#1e293b',
  primary: '#60a5fa',
  secondary: '#38bdf8',
  accent: '#f59e0b',
  success: '#4ade80',
}

const USER_STATUS_OPTIONS: Array<{ label: string; value: UserStatusFilter }> = [
  { label: '전체', value: 'ALL' },
  { label: '정상', value: 'ACTIVE' },
  { label: '정지', value: 'SUSPENDED' },
  { label: '탈퇴', value: 'WITHDRAWN' },
]

const GENDER_STAT_LABELS: Record<AdminUserGenderCategory, string> = {
  FEMALE: '여성',
  MALE: '남성',
  UNSPECIFIED: '미선택',
}

const AGE_GROUP_LABELS: Record<AdminUserAgeGroup, string> = {
  TEENS: '10대',
  TWENTIES: '20대',
  THIRTIES: '30대',
  FORTIES: '40대',
  FIFTIES: '50대',
  OTHERS: '그 외',
  UNSPECIFIED: '미입력',
}

function readCssColor(variableName: string, fallback: string): string {
  if (typeof window === 'undefined') {
    return fallback
  }

  const value = window.getComputedStyle(document.documentElement).getPropertyValue(variableName).trim()
  if (!value) {
    return fallback
  }

  return `rgb(${value})`
}

function useChartTokens(): ChartTokens {
  const [tokens, setTokens] = useState<ChartTokens>(DEFAULT_CHART_TOKENS)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const updateTokens = () => {
      setTokens({
        text: readCssColor('--color-text', DEFAULT_CHART_TOKENS.text),
        muted: readCssColor('--color-text-muted', DEFAULT_CHART_TOKENS.muted),
        border: readCssColor('--color-border', DEFAULT_CHART_TOKENS.border),
        surface: readCssColor('--color-surface', DEFAULT_CHART_TOKENS.surface),
        primary: readCssColor('--color-primary', DEFAULT_CHART_TOKENS.primary),
        secondary: DEFAULT_CHART_TOKENS.secondary,
        accent: DEFAULT_CHART_TOKENS.accent,
        success: readCssColor('--color-success', DEFAULT_CHART_TOKENS.success),
      })
    }

    updateTokens()

    const observer = new MutationObserver(updateTokens)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  return tokens
}

function useViewportWidth(): number {
  const [viewportWidth, setViewportWidth] = useState<number>(() => (
    typeof window === 'undefined' ? 1440 : window.innerWidth
  ))

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleResize = () => {
      setViewportWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return viewportWidth
}

function formatCount(value: number): string {
  return numberFormatter.format(value)
}

function formatCountWithUnit(value: number, unit: string): string {
  return `${numberFormatter.format(value)}${unit}`
}

function extractChartValue(value: unknown): number {
  if (Array.isArray(value)) {
    return Number(value[0] ?? 0)
  }

  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    return Number(value)
  }

  return 0
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

function getStatisticsStatusLabel(status: UserStatusFilter): string {
  if (status === 'ALL') {
    return '전체 사용자 기준'
  }

  return `${getUserStatusLabel(status)} 사용자 기준`
}

function getAgeBarColor(ageGroup: AdminUserAgeGroup, chartTokens: ChartTokens): string {
  if (ageGroup === 'OTHERS') {
    return chartTokens.accent
  }

  if (ageGroup === 'UNSPECIFIED') {
    return chartTokens.muted
  }

  return chartTokens.primary
}

function UserStatisticsLoadingState() {
  return (
    <section className="admin-channel-chart-grid">
      {Array.from({ length: 2 }, (_, index) => (
        <article className="surface admin-channel-chart-card" key={index}>
          <div className="admin-panel-header">
            <div className="admin-skeleton admin-skeleton-title" />
            <div className="admin-skeleton admin-user-stats-badge-skeleton" />
          </div>
          <div className="admin-skeleton admin-channel-chart-skeleton" />
        </article>
      ))}
    </section>
  )
}

function UserStatisticsErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <article className="surface admin-feed-panel admin-error-panel">
      <h2 className="admin-feed-title">사용자 통계를 불러오지 못했습니다.</h2>
      <p className="page-subtitle">{message}</p>
      <button className="btn-base btn-neutral admin-retry-button" onClick={onRetry} type="button">
        다시 시도
      </button>
    </article>
  )
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
              <th>소개</th>
              <th>가입일시</th>
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
  const chartTokens = useChartTokens()
  const viewportWidth = useViewportWidth()
  const isCompactView = viewportWidth <= 640
  const [page, setPage] = useState(0)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<UserStatusFilter>('ALL')
  const [actionTarget, setActionTarget] = useState<UserActionTarget | null>(null)

  const selectedStatus = status === 'ALL' ? undefined : status

  const statisticsQuery = useQuery({
    queryKey: [...USER_STATISTICS_QUERY_KEY, status],
    queryFn: () => getAdminUserStatistics({
      status: selectedStatus,
    }),
    staleTime: 30_000,
  })

  const usersQuery = useQuery({
    queryKey: ['admin', 'users', page, keyword, status],
    queryFn: () => getAdminUsers({
      page,
      size: USERS_PAGE_SIZE,
      status: selectedStatus,
      keyword: keyword || undefined,
    }),
    staleTime: 30_000,
  })

  const statisticsStatusLabel = getStatisticsStatusLabel(status)
  const statisticsTotalCount = statisticsQuery.data?.totalUserCount ?? 0
  const genderStats = statisticsQuery.data?.genderStats ?? []
  const ageStats = statisticsQuery.data?.ageStats ?? []
  const totalCount = usersQuery.data?.totalCount ?? 0
  const totalPages = usersQuery.data?.totalPages ?? 0
  const users = usersQuery.data?.items ?? []

  const genderChartData = useMemo(
    () => genderStats.map((item) => ({
      value: item.count,
      name: GENDER_STAT_LABELS[item.gender],
    })),
    [genderStats],
  )

  const ageChartData = useMemo(
    () => ageStats.map((item) => ({
      value: item.count,
      label: AGE_GROUP_LABELS[item.ageGroup],
      color: getAgeBarColor(item.ageGroup, chartTokens),
    })),
    [ageStats, chartTokens],
  )

  const genderChartOption = useMemo<EChartsOption>(() => ({
    animationDuration: 700,
    color: [chartTokens.primary, chartTokens.secondary, chartTokens.muted],
    tooltip: {
      trigger: 'item',
      backgroundColor: chartTokens.surface,
      borderColor: chartTokens.border,
      textStyle: {
        color: chartTokens.text,
      },
      valueFormatter: (value) => formatCountWithUnit(Number(value ?? 0), '명'),
    },
    legend: {
      bottom: 0,
      left: 'center',
      itemWidth: 10,
      itemHeight: 10,
      icon: 'circle',
      textStyle: {
        color: chartTokens.muted,
        fontSize: isCompactView ? 11 : 12,
      },
    },
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: isCompactView ? '32%' : '34%',
        silent: true,
        style: {
          text: '전체 사용자',
          fill: chartTokens.muted,
          fontSize: isCompactView ? 11 : 12,
          fontWeight: 600,
          fontFamily: 'Pretendard, Noto Sans KR, sans-serif',
          textAlign: 'center',
        },
      },
      {
        type: 'text',
        left: 'center',
        top: isCompactView ? '42%' : '44%',
        silent: true,
        style: {
          text: formatCountWithUnit(statisticsTotalCount, '명'),
          fill: chartTokens.text,
          fontSize: isCompactView ? 18 : 22,
          fontWeight: 700,
          fontFamily: 'Pretendard, Noto Sans KR, sans-serif',
          textAlign: 'center',
        },
      },
    ],
    series: [
      {
        name: '성별',
        type: 'pie',
        radius: ['58%', '76%'],
        center: ['50%', '42%'],
        avoidLabelOverlap: true,
        label: {
          show: false,
        },
        itemStyle: {
          borderRadius: 8,
          borderWidth: 2,
          borderColor: chartTokens.surface,
        },
        emphasis: {
          scale: true,
        },
        data: genderChartData,
      },
    ],
  }), [chartTokens, genderChartData, isCompactView, statisticsTotalCount])

  const ageChartOption = useMemo<EChartsOption>(() => ({
    animationDuration: 700,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      backgroundColor: chartTokens.surface,
      borderColor: chartTokens.border,
      textStyle: {
        color: chartTokens.text,
      },
      valueFormatter: (value) => formatCountWithUnit(Number(value ?? 0), '명'),
    },
    grid: {
      top: 12,
      right: isCompactView ? 12 : 18,
      bottom: 8,
      left: isCompactView ? 8 : 14,
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        color: chartTokens.muted,
        fontSize: isCompactView ? 10 : 12,
        formatter: (value) => numberFormatter.format(Number(value)),
      },
      splitLine: {
        lineStyle: {
          color: chartTokens.border,
        },
      },
    },
    yAxis: {
      type: 'category',
      data: ageChartData.map((item) => item.label),
      axisTick: {
        show: false,
      },
      axisLine: {
        show: false,
      },
      axisLabel: {
        color: chartTokens.text,
        fontWeight: 600,
        fontSize: isCompactView ? 11 : 13,
      },
    },
    series: [
      {
        name: '사용자 수',
        type: 'bar',
        barWidth: isCompactView ? 12 : 16,
        label: {
          show: true,
          position: 'right',
          color: chartTokens.muted,
          fontWeight: 600,
          fontSize: isCompactView ? 11 : 12,
          formatter: (params) => {
            const value = extractChartValue(params.value)
            return value > 0 ? numberFormatter.format(value) : ''
          },
        },
        data: ageChartData.map((item) => ({
          value: item.value,
          itemStyle: {
            color: item.color,
            borderRadius: [0, 10, 10, 0],
          },
        })),
      },
    ],
  }), [ageChartData, chartTokens, isCompactView])

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

      {statisticsQuery.isPending ? <UserStatisticsLoadingState /> : null}

      {statisticsQuery.isError ? (
        <UserStatisticsErrorState
          message={toApiError(statisticsQuery.error).message}
          onRetry={() => void statisticsQuery.refetch()}
        />
      ) : null}

      {!statisticsQuery.isPending && !statisticsQuery.isError ? (
        <section className="admin-channel-chart-grid">
          <article className="surface admin-channel-chart-card">
            <div className="admin-panel-header">
              <h2 className="admin-feed-title admin-panel-title">
                <PieChartIcon aria-hidden className="admin-panel-title-icon" strokeWidth={2} />
                <span>성별 분포</span>
              </h2>
              <span className="admin-panel-badge">{statisticsStatusLabel}</span>
            </div>
            <ReactEChartsCore
              className="admin-channel-chart"
              echarts={echarts}
              notMerge
              option={genderChartOption}
            />
          </article>

          <article className="surface admin-channel-chart-card">
            <div className="admin-panel-header">
              <h2 className="admin-feed-title admin-panel-title">
                <BarChart3 aria-hidden className="admin-panel-title-icon" strokeWidth={2} />
                <span>연령대 분포</span>
              </h2>
              <span className="admin-panel-badge">{statisticsStatusLabel}</span>
            </div>
            <ReactEChartsCore
              className="admin-channel-chart"
              echarts={echarts}
              notMerge
              option={ageChartOption}
            />
          </article>
        </section>
      ) : null}

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
                      <td
                        className="admin-management-muted-cell admin-members-table-email-cell"
                        title={item.email}
                      >
                        <span className="admin-members-table-truncated">{item.email}</span>
                      </td>
                      <td>{item.favoriteTeamName ?? '-'}</td>
                      <td
                        className="admin-management-content-cell admin-management-content-truncated"
                        title={item.bio ?? '-'}
                      >
                        {item.bio ?? '-'}
                      </td>
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

      {actionTarget ? (
        <AdminActionReasonModal
          confirmLabel={getUserActionLabel(actionTarget.action)}
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
          open
          targetLabel={`${actionTarget.nickname} (사용자-${actionTarget.userId})`}
          title={`사용자 ${getUserActionLabel(actionTarget.action)}`}
        />
      ) : null}
    </section>
  )
}
