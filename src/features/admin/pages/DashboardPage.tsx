import { useMemo } from 'react'
import {
  Activity,
  FileText,
  ShieldAlert,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  getAdminDashboard,
  type AdminDashboardMetricResponse,
} from '@shared/api/adminDashboardApi'
import { toApiError } from '@shared/api/apiError'
import { getTeamLogoByCode } from '@shared/team/teamLogo'

const DASHBOARD_QUERY_KEY = ['admin', 'dashboard']

const numberFormatter = new Intl.NumberFormat('ko-KR')
const dateTimeFormatter = new Intl.DateTimeFormat('ko-KR', {
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

type MetricCard = {
  label: string
  value: number | null
  delta: number | null
  helper: string
  icon: typeof Activity
}

function formatMetricValue(value: number | null): string {
  if (value === null) {
    return '-'
  }

  return numberFormatter.format(value)
}

function formatDelta(delta: number | null): string {
  if (delta === null) {
    return '집계 대기'
  }

  if (delta > 0) {
    return `+${numberFormatter.format(delta)}`
  }

  if (delta < 0) {
    return numberFormatter.format(delta)
  }

  return '0'
}

function resolveDeltaClassName(delta: number | null): string {
  if (delta === null || delta === 0) {
    return 'admin-metric-delta-neutral'
  }

  return delta > 0 ? 'admin-metric-delta-positive' : 'admin-metric-delta-negative'
}

function formatFeedTimestamp(createdAt: string): string {
  const parsedDate = new Date(createdAt)

  if (Number.isNaN(parsedDate.getTime())) {
    return createdAt
  }

  return dateTimeFormatter.format(parsedDate)
}

function buildMetricCards(data: AdminDashboardMetricResponse): MetricCard[] {
  return [
    {
      label: '총 회원 수',
      value: data.totalUserCount,
      delta: data.totalUserDelta,
      helper: '오늘 기준 증감',
      icon: Users,
    },
    {
      label: '오늘 게시물',
      value: data.todayPostCount,
      delta: data.todayPostDelta,
      helper: '어제 동일 시각 대비',
      icon: FileText,
    },
    {
      label: '오늘 신규 가입자',
      value: data.todayNewSignupCount,
      delta: data.todayNewSignupDelta,
      helper: '어제 동일 시각 대비',
      icon: UserPlus,
    },
    {
      label: '처리 대기 신고',
      value: data.pendingReportCount,
      delta: null,
      helper: 'TODO',
      icon: ShieldAlert,
    },
  ]
}

function DashboardLoadingState() {
  return (
    <>
      <section className="admin-metric-grid">
        {Array.from({ length: 4 }, (_, index) => (
          <article className="surface admin-metric-card admin-skeleton-card" key={index}>
            <div className="admin-skeleton admin-skeleton-label" />
            <div className="admin-skeleton admin-skeleton-value" />
            <div className="admin-skeleton admin-skeleton-delta" />
          </article>
        ))}
      </section>

      <section className="admin-dashboard-grid">
        <article className="surface admin-feed-panel">
          <div className="admin-skeleton admin-skeleton-title" />
          <div className="admin-feed-list">
            {Array.from({ length: 3 }, (_, index) => (
              <div className="surface-muted admin-feed-item" key={index}>
                <div className="admin-skeleton admin-skeleton-title" />
                <div className="admin-skeleton admin-skeleton-text" />
              </div>
            ))}
          </div>
        </article>

        <article className="surface admin-feed-panel">
          <div className="admin-skeleton admin-skeleton-title" />
          <div className="admin-topic-list">
            {Array.from({ length: 3 }, (_, index) => (
              <div className="surface-muted admin-topic-item" key={index}>
                <div className="admin-skeleton admin-skeleton-text" />
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  )
}

type DashboardErrorStateProps = {
  message: string
  onRetry: () => void
}

function DashboardErrorState({ message, onRetry }: DashboardErrorStateProps) {
  return (
    <article className="surface admin-feed-panel admin-error-panel">
      <h2 className="admin-feed-title">대시보드를 불러오지 못했습니다.</h2>
      <p className="page-subtitle">{message}</p>
      <button className="btn-base btn-neutral admin-retry-button" onClick={onRetry} type="button">
        다시 시도
      </button>
    </article>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const dashboardQuery = useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: getAdminDashboard,
    staleTime: 30_000,
  })

  const metricCards = useMemo(
    () => (dashboardQuery.data ? buildMetricCards(dashboardQuery.data) : []),
    [dashboardQuery.data],
  )

  const handleFeedOpen = (postId: number) => {
    navigate(`/posts/${postId}`)
  }

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <h1 className="page-title admin-page-title">대시보드</h1>
      </header>

      {dashboardQuery.isPending ? <DashboardLoadingState /> : null}

      {dashboardQuery.isError ? (
        <DashboardErrorState message={toApiError(dashboardQuery.error).message} onRetry={() => void dashboardQuery.refetch()} />
      ) : null}

      {dashboardQuery.data ? (
        <>
          <section className="admin-metric-grid">
            {metricCards.map((card) => (
              <article className="surface admin-metric-card" key={card.label}>
                <div className="admin-metric-card-header">
                  <p className="admin-metric-label">{card.label}</p>
                  <card.icon aria-hidden className="admin-summary-card-icon" strokeWidth={2} />
                </div>
                <div className="admin-metric-card-body">
                  <p className="admin-metric-value">{formatMetricValue(card.value)}</p>
                </div>
                <div className="admin-metric-card-footer">
                  <p className={`admin-metric-delta ${resolveDeltaClassName(card.delta)}`}>
                    {formatDelta(card.delta)}
                  </p>
                  <p className="admin-metric-helper">{card.helper}</p>
                </div>
              </article>
            ))}
          </section>

          <section className="admin-dashboard-grid">
            <section className="admin-section-block">
              <article className="surface admin-feed-panel">
                <div className="admin-panel-header">
                  <h2 className="admin-feed-title admin-panel-title">
                    <Activity aria-hidden className="admin-panel-title-icon" strokeWidth={2} />
                    <span>실시간 피드 모니터링</span>
                  </h2>
                  <span className="admin-panel-badge">최근 {dashboardQuery.data.realtimeFeeds.length}건</span>
                </div>
                <div className="admin-panel-body">
                  {dashboardQuery.data.realtimeFeeds.length > 0 ? (
                    <div className="admin-feed-list">
                      {dashboardQuery.data.realtimeFeeds.map((feed) => {
                        const teamLogo = getTeamLogoByCode(feed.channel)

                        return (
                          <article
                            aria-label={`게시글 ${feed.postId} 상세 보기`}
                            className="surface-muted admin-feed-item admin-feed-item-clickable"
                            key={feed.postId}
                            onClick={() => handleFeedOpen(feed.postId)}
                            onKeyDown={(event) => {
                              if (event.key !== 'Enter' && event.key !== ' ') {
                                return
                              }

                              event.preventDefault()
                              handleFeedOpen(feed.postId)
                            }}
                            role="link"
                            tabIndex={0}
                          >
                            <div className="admin-feed-item-main">
                              <div className="admin-feed-meta-row">
                                {teamLogo ? (
                                  <img
                                    alt={`${feed.channel} logo`}
                                    className="admin-team-logo"
                                    loading="lazy"
                                    src={teamLogo}
                                    title={feed.channel}
                                  />
                                ) : (
                                  <span className="admin-channel-badge">{feed.channel}</span>
                                )}
                                <span className="text-muted">{feed.authorNickname}</span>
                                <span className="text-muted">{formatFeedTimestamp(feed.createdAt)}</span>
                              </div>
                              {feed.thumbnailUrl ? (
                                <div className="admin-feed-media">
                                  <img
                                    alt={`${feed.postId} thumbnail`}
                                    className="admin-feed-cover"
                                    loading="lazy"
                                    src={feed.thumbnailUrl}
                                  />
                                </div>
                              ) : null}
                              <p className="admin-feed-content">{feed.contentPreview || '본문 미리보기가 없습니다.'}</p>
                              <div className="admin-feed-stats text-muted">
                                <span>좋아요 {numberFormatter.format(feed.likeCount)}</span>
                                <span>댓글 {numberFormatter.format(feed.commentCount)}</span>
                                <span>게시물 #{feed.postId}</span>
                              </div>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="surface-muted admin-empty-state">
                      <p className="text-muted">표시할 실시간 피드가 없습니다.</p>
                    </div>
                  )}
                </div>
              </article>
            </section>

            <section className="admin-section-block">
              <article className="surface admin-feed-panel">
                <div className="admin-panel-header">
                  <h2 className="admin-feed-title admin-panel-title">
                    <TrendingUp aria-hidden className="admin-panel-title-icon" strokeWidth={2} />
                    <span>인기 토픽</span>
                  </h2>
                  <span className="admin-panel-badge">상위 {dashboardQuery.data.popularTopics.length}개</span>
                </div>
                <div className="admin-panel-body">
                  {dashboardQuery.data.popularTopics.length > 0 ? (
                    <div className="admin-topic-list">
                      {dashboardQuery.data.popularTopics.map((topic, index) => (
                        <article className="surface-muted admin-topic-item" key={topic.hashtagId}>
                          <div className="admin-topic-main">
                            <p className="admin-topic-rank">TOP {index + 1}</p>
                            <p className="admin-topic-name">#{topic.hashtag}</p>
                          </div>
                          <p className="admin-topic-usage">{numberFormatter.format(topic.usageCount)}회</p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="surface-muted admin-empty-state">
                      <p className="text-muted">집계된 인기 토픽이 없습니다.</p>
                    </div>
                  )}
                </div>
              </article>
            </section>
          </section>
        </>
      ) : null}
    </section>
  )
}
