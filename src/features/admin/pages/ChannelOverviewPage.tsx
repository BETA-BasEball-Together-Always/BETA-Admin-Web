import type { EChartsOption } from 'echarts'
import { BarChart, LineChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components'
import * as echarts from 'echarts/core'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import { CanvasRenderer } from 'echarts/renderers'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  BarChart3,
  Trophy,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toApiError } from '@shared/api/apiError'
import {
  getAdminChannelOverview,
  type AdminChannelOverviewResponse,
  type AdminChannelTeamActivityResponse,
} from '@shared/api/adminChannelApi'
import { getTeamLogoByCode } from '@shared/team/teamLogo'

echarts.use([
  GridComponent,
  TooltipComponent,
  LegendComponent,
  BarChart,
  LineChart,
  CanvasRenderer,
])

const CHANNEL_OVERVIEW_QUERY_KEY = ['admin', 'channels', 'overview']

const numberFormatter = new Intl.NumberFormat('ko-KR')

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

type SummaryCard = {
  label: string
  value: string
  helper: string
  icon: typeof Users
}

type TeamMemberMetric = {
  teamCode: string
  teamName: string
  memberCount: number
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
  return `${numberFormatter.format(value)}건`
}

function formatMemberCount(value: number): string {
  return `${numberFormatter.format(value)}명`
}

function formatShortDateLabel(date: string): string {
  const [year, month, day] = date.split('-').map(Number)

  if (!year || !month || !day) {
    return date
  }

  return `${month}/${day}`
}

function compareByTodayActivity(
  left: AdminChannelTeamActivityResponse,
  right: AdminChannelTeamActivityResponse,
): number {
  if (right.todayActivityCount !== left.todayActivityCount) {
    return right.todayActivityCount - left.todayActivityCount
  }

  if (right.weeklyActivityCount !== left.weeklyActivityCount) {
    return right.weeklyActivityCount - left.weeklyActivityCount
  }

  return left.teamName.localeCompare(right.teamName, 'ko-KR')
}

function compareByWeeklyActivity(
  left: AdminChannelTeamActivityResponse,
  right: AdminChannelTeamActivityResponse,
): number {
  if (right.weeklyActivityCount !== left.weeklyActivityCount) {
    return right.weeklyActivityCount - left.weeklyActivityCount
  }

  if (right.todayActivityCount !== left.todayActivityCount) {
    return right.todayActivityCount - left.todayActivityCount
  }

  return left.teamName.localeCompare(right.teamName, 'ko-KR')
}

function buildTeamMemberMetrics(teams: AdminChannelTeamActivityResponse[]): TeamMemberMetric[] {
  return teams
    .map((team) => ({
      teamCode: team.teamCode,
      teamName: team.teamName,
      memberCount: team.memberCount,
    }))
    .sort((left, right) => {
      if (right.memberCount !== left.memberCount) {
        return right.memberCount - left.memberCount
      }

      return left.teamName.localeCompare(right.teamName, 'ko-KR')
    })
}

function buildSummaryCards(
  overview: AdminChannelOverviewResponse,
  topMemberTeam: TeamMemberMetric | null,
): SummaryCard[] {
  return [
    {
      label: '운영 팀 수',
      value: `${numberFormatter.format(overview.teams.length)}개`,
      helper: '현재 표시 중인 팀',
      icon: Users,
    },
    {
      label: '최다 팬 보유 팀',
      value: topMemberTeam?.teamName ?? '-',
      helper: topMemberTeam ? formatMemberCount(topMemberTeam.memberCount) : '집계 준비 중',
      icon: Trophy,
    },
    {
      label: '오늘 최고 활동 팀',
      value: overview.todayPeakTeam.teamName ?? '-',
      helper: `총 활동 ${formatCount(overview.todayPeakTeam.activityCount)} · 게시물 ${formatCount(overview.todayPeakTeam.postCount)} · 댓글 ${formatCount(overview.todayPeakTeam.commentCount)}`,
      icon: Activity,
    },
    {
      label: '최근 7일 최고 활동 팀',
      value: overview.weeklyPeakTeam.teamName ?? '-',
      helper: `총 활동 ${formatCount(overview.weeklyPeakTeam.activityCount)} · 게시물 ${formatCount(overview.weeklyPeakTeam.postCount)} · 댓글 ${formatCount(overview.weeklyPeakTeam.commentCount)}`,
      icon: TrendingUp,
    },
  ]
}

function ChannelOverviewLoadingState() {
  return (
    <>
      <section className="admin-channel-summary-grid">
        {Array.from({ length: 4 }, (_, index) => (
          <article className="surface admin-channel-summary-card admin-skeleton-card" key={index}>
            <div className="admin-skeleton admin-skeleton-label" />
            <div className="admin-skeleton admin-skeleton-value" />
            <div className="admin-skeleton admin-skeleton-delta" />
          </article>
        ))}
      </section>

      <section className="admin-channel-chart-grid">
        {Array.from({ length: 4 }, (_, index) => (
          <article className="surface admin-channel-chart-card" key={index}>
            <div className="admin-skeleton admin-skeleton-title" />
            <div className="admin-skeleton admin-channel-chart-skeleton" />
          </article>
        ))}
      </section>

      <article className="surface admin-channel-table-card">
        <div className="admin-skeleton admin-skeleton-title" />
        <div className="admin-skeleton admin-channel-table-skeleton" />
      </article>
    </>
  )
}

type ChannelOverviewErrorStateProps = {
  message: string
  onRetry: () => void
}

function ChannelOverviewErrorState({ message, onRetry }: ChannelOverviewErrorStateProps) {
  return (
    <article className="surface admin-feed-panel admin-error-panel">
      <h2 className="admin-feed-title">팀별 현황을 불러오지 못했습니다.</h2>
      <p className="page-subtitle">{message}</p>
      <button className="btn-base btn-neutral admin-retry-button" onClick={onRetry} type="button">
        다시 시도
      </button>
    </article>
  )
}

function ChannelOverviewEmptyState() {
  return (
    <article className="surface admin-channel-table-card">
      <div className="admin-panel-header">
        <h2 className="admin-feed-title admin-panel-title">
          <Activity aria-hidden className="admin-panel-title-icon" strokeWidth={2} />
          <span>팀별 상세 지표</span>
        </h2>
      </div>

      <div className="surface-muted admin-empty-state">
        <p className="text-muted">표시할 팀별 활동 데이터가 없습니다.</p>
      </div>
    </article>
  )
}

export function ChannelOverviewPage() {
  const chartTokens = useChartTokens()
  const viewportWidth = useViewportWidth()
  const isCompactView = viewportWidth <= 640

  const channelOverviewQuery = useQuery({
    queryKey: CHANNEL_OVERVIEW_QUERY_KEY,
    queryFn: getAdminChannelOverview,
    staleTime: 30_000,
  })

  const teams = useMemo(
    () => channelOverviewQuery.data?.teams ?? [],
    [channelOverviewQuery.data?.teams],
  )

  const teamsByTodayActivity = useMemo(
    () => [...teams].sort(compareByTodayActivity),
    [teams],
  )
  const teamsByWeeklyActivity = useMemo(
    () => [...teams].sort(compareByWeeklyActivity),
    [teams],
  )
  const teamMemberMetrics = useMemo(
    () => buildTeamMemberMetrics(teams),
    [teams],
  )
  const topMemberTeam = teamMemberMetrics[0] ?? null

  const visibleTrendTeams = useMemo(
    () => teamsByWeeklyActivity.slice(0, isCompactView ? 3 : 4),
    [isCompactView, teamsByWeeklyActivity],
  )

  const summaryCards = useMemo(
    () => channelOverviewQuery.data
      ? buildSummaryCards(channelOverviewQuery.data, topMemberTeam)
      : [],
    [channelOverviewQuery.data, topMemberTeam],
  )

  const teamMemberOption = useMemo<EChartsOption>(() => ({
    animationDuration: 700,
    color: [chartTokens.primary],
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
      valueFormatter: (value) => `${numberFormatter.format(Number(value ?? 0))}명`,
    },
    grid: {
      top: 12,
      right: isCompactView ? 8 : 18,
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
      data: teamMemberMetrics.map((team) => (isCompactView ? team.teamCode : team.teamName)),
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
        itemStyle: {
          borderRadius: [0, 10, 10, 0],
        },
        data: teamMemberMetrics.map((team) => team.memberCount),
      },
    ],
  }), [chartTokens, isCompactView, teamMemberMetrics])

  const todayActivityOption = useMemo<EChartsOption>(() => ({
    animationDuration: 700,
    color: [chartTokens.primary, chartTokens.secondary],
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
      valueFormatter: (value) => `${numberFormatter.format(Number(value ?? 0))}건`,
    },
    legend: {
      top: 0,
      textStyle: {
        color: chartTokens.muted,
      },
    },
    grid: {
      top: isCompactView ? 36 : 42,
      right: isCompactView ? 8 : 18,
      bottom: 8,
      left: isCompactView ? 8 : 14,
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        color: chartTokens.muted,
        fontSize: isCompactView ? 10 : 12,
      },
      splitLine: {
        lineStyle: {
          color: chartTokens.border,
        },
      },
    },
    yAxis: {
      type: 'category',
      data: teamsByTodayActivity.map((team) => (isCompactView ? team.teamCode : team.teamName)),
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
        name: '게시물',
        type: 'bar',
        stack: 'activity',
        barWidth: isCompactView ? 12 : 16,
        data: teamsByTodayActivity.map((team) => team.todayPostCount),
      },
      {
        name: '댓글',
        type: 'bar',
        stack: 'activity',
        barWidth: isCompactView ? 12 : 16,
        itemStyle: {
          borderRadius: [0, 10, 10, 0],
        },
        data: teamsByTodayActivity.map((team) => team.todayCommentCount),
      },
    ],
  }), [chartTokens, isCompactView, teamsByTodayActivity])

  const weeklyTrendOption = useMemo<EChartsOption>(() => ({
    animationDuration: 700,
    color: [chartTokens.primary, chartTokens.secondary, chartTokens.accent, chartTokens.success],
    tooltip: {
      trigger: 'axis',
      backgroundColor: chartTokens.surface,
      borderColor: chartTokens.border,
      textStyle: {
        color: chartTokens.text,
      },
    },
    legend: {
      show: !isCompactView,
      top: 0,
      textStyle: {
        color: chartTokens.muted,
      },
    },
    grid: {
      top: isCompactView ? 12 : 40,
      right: isCompactView ? 8 : 18,
      bottom: 12,
      left: isCompactView ? 8 : 14,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: visibleTrendTeams[0]?.dailyActivities.map((activity) => formatShortDateLabel(activity.date)) ?? [],
      axisLine: {
        lineStyle: {
          color: chartTokens.border,
        },
      },
      axisLabel: {
        color: chartTokens.muted,
        fontSize: isCompactView ? 10 : 12,
      },
    },
    yAxis: {
      type: 'value',
      splitLine: {
        lineStyle: {
          color: chartTokens.border,
        },
      },
      axisLabel: {
        color: chartTokens.muted,
        fontSize: isCompactView ? 10 : 12,
      },
    },
    series: visibleTrendTeams.map((team) => ({
      name: team.teamName,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: isCompactView ? 5 : 7,
      lineStyle: {
        width: isCompactView ? 2 : 3,
      },
      areaStyle: {
        opacity: 0.06,
      },
      emphasis: {
        focus: 'series',
      },
      data: team.dailyActivities.map((activity) => activity.totalActivityCount),
    })),
  }), [chartTokens, isCompactView, visibleTrendTeams])

  return (
    <section className="admin-page admin-channel-page">
      <header className="admin-page-header">
        <h1 className="page-title admin-page-title">팀별 현황</h1>
      </header>

      {channelOverviewQuery.isPending ? <ChannelOverviewLoadingState /> : null}

      {channelOverviewQuery.isError ? (
        <ChannelOverviewErrorState
          message={toApiError(channelOverviewQuery.error).message}
          onRetry={() => void channelOverviewQuery.refetch()}
        />
      ) : null}

      {channelOverviewQuery.data ? (
        <>
          <section className="admin-channel-summary-grid">
            {summaryCards.map((card) => (
              <article className="surface admin-channel-summary-card" key={card.label}>
                <div className="admin-channel-summary-header">
                  <p className="admin-channel-summary-label">{card.label}</p>
                  <card.icon aria-hidden className="admin-summary-card-icon" strokeWidth={2} />
                </div>
                <p className="admin-channel-summary-value">{card.value}</p>
                <p className="admin-channel-summary-meta">{card.helper}</p>
              </article>
            ))}
          </section>

          <section className="admin-channel-chart-grid">
            <article className="surface admin-channel-chart-card">
              <div className="admin-panel-header">
                <h2 className="admin-feed-title admin-panel-title">
                  <Users aria-hidden className="admin-panel-title-icon" strokeWidth={2} />
                  <span>운영 팀</span>
                </h2>
              </div>
              <div className="admin-channel-team-roster">
                {teams.map((team) => {
                  const teamLogo = getTeamLogoByCode(team.teamCode)

                  return (
                    <div className="surface-muted admin-channel-team-pill" key={team.teamCode}>
                      {teamLogo ? (
                        <img
                          alt={`${team.teamName} logo`}
                          className="admin-team-logo"
                          loading="lazy"
                          src={teamLogo}
                        />
                      ) : null}
                      <span className="admin-channel-team-pill-name">{team.teamName}</span>
                    </div>
                  )
                })}
              </div>
            </article>

            <article className="surface admin-channel-chart-card">
              <div className="admin-panel-header">
                <h2 className="admin-feed-title admin-panel-title">
                  <Users aria-hidden className="admin-panel-title-icon" strokeWidth={2} />
                  <span>팀별 사용자 수</span>
                </h2>
                <span className="admin-panel-badge">현재 기준</span>
              </div>
              <ReactEChartsCore
                className="admin-channel-chart"
                echarts={echarts}
                notMerge
                option={teamMemberOption}
              />
            </article>

            <article className="surface admin-channel-chart-card">
              <div className="admin-panel-header">
                <h2 className="admin-feed-title admin-panel-title">
                  <BarChart3 aria-hidden className="admin-panel-title-icon" strokeWidth={2} />
                  <span>오늘 팀별 활동량</span>
                </h2>
                <span className="admin-panel-badge">게시물 + 댓글</span>
              </div>
              <ReactEChartsCore
                className="admin-channel-chart"
                echarts={echarts}
                notMerge
                option={todayActivityOption}
              />
            </article>

            <article className="surface admin-channel-chart-card">
              <div className="admin-panel-header">
                <h2 className="admin-feed-title admin-panel-title">
                  <TrendingUp aria-hidden className="admin-panel-title-icon" strokeWidth={2} />
                  <span>최근 7일 활동 추이</span>
                </h2>
                <span className="admin-panel-badge">상위 {visibleTrendTeams.length}팀</span>
              </div>
              {isCompactView ? (
                <div className="admin-channel-inline-legend">
                  {visibleTrendTeams.map((team) => (
                    <span className="admin-panel-badge" key={team.teamCode}>{team.teamName}</span>
                  ))}
                </div>
              ) : null}
              <ReactEChartsCore
                className="admin-channel-chart"
                echarts={echarts}
                notMerge
                option={weeklyTrendOption}
              />
            </article>
          </section>

          {teamsByTodayActivity.length > 0 ? (
            <article className="surface admin-channel-table-card">
              <div className="admin-panel-header">
                <h2 className="admin-feed-title admin-panel-title">
                  <Activity aria-hidden className="admin-panel-title-icon" strokeWidth={2} />
                  <span>팀별 상세 지표</span>
                </h2>
              </div>

              <div className="admin-channel-table-wrapper">
                <table className="admin-channel-table">
                  <colgroup>
                    <col className="admin-channel-table-col-team" />
                    <col className="admin-channel-table-col-members" />
                    <col className="admin-channel-table-col-today" />
                    <col className="admin-channel-table-col-weekly" />
                    <col className="admin-channel-table-col-actions" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>팀</th>
                      <th>팀 사용자 수</th>
                      <th>오늘 활동</th>
                      <th>최근 7일 활동</th>
                      <th>바로가기</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamsByTodayActivity.map((team) => {
                      const teamLogo = getTeamLogoByCode(team.teamCode)

                      return (
                        <tr key={team.teamCode}>
                          <td>
                            <div className="admin-channel-team-cell">
                              {teamLogo ? (
                                <img
                                  alt={`${team.teamName} logo`}
                                  className="admin-team-logo"
                                  loading="lazy"
                                  src={teamLogo}
                                />
                              ) : null}
                              <span>{team.teamName}</span>
                            </div>
                          </td>
                          <td>
                            <div className="admin-channel-table-metric">
                              <p className="admin-channel-table-metric-primary">{formatMemberCount(team.memberCount)}</p>
                            </div>
                          </td>
                          <td>
                            <div className="admin-channel-table-metric">
                              <p className="admin-channel-table-metric-primary">{formatCount(team.todayActivityCount)}</p>
                              <p className="admin-channel-table-metric-secondary">
                                게시물 {formatCount(team.todayPostCount)} · 댓글 {formatCount(team.todayCommentCount)}
                              </p>
                            </div>
                          </td>
                          <td>
                            <div className="admin-channel-table-metric">
                              <p className="admin-channel-table-metric-primary">{formatCount(team.weeklyActivityCount)}</p>
                              <p className="admin-channel-table-metric-secondary">
                                게시물 {formatCount(team.weeklyPostCount)} · 댓글 {formatCount(team.weeklyCommentCount)}
                              </p>
                            </div>
                          </td>
                          <td>
                            <div className="admin-channel-actions">
                              <Link className="btn-base btn-neutral admin-channel-action-button" to={`/posts?team=${team.teamCode}`}>
                                게시물 보기
                              </Link>
                              <Link className="btn-base btn-neutral admin-channel-action-button" to={`/comments?team=${team.teamCode}`}>
                                댓글 보기
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="admin-channel-mobile-list">
                {teamsByTodayActivity.map((team) => {
                  const teamLogo = getTeamLogoByCode(team.teamCode)

                  return (
                    <article className="surface-muted admin-channel-mobile-item" key={team.teamCode}>
                      <div className="admin-channel-mobile-header">
                        <div className="admin-channel-team-cell">
                          {teamLogo ? (
                            <img
                              alt={`${team.teamName} logo`}
                              className="admin-team-logo"
                              loading="lazy"
                              src={teamLogo}
                            />
                          ) : null}
                          <span>{team.teamName}</span>
                        </div>
                        <span className="admin-panel-badge">{formatMemberCount(team.memberCount)}</span>
                      </div>

                      <div className="admin-channel-mobile-metrics">
                        <div>
                          <p className="admin-channel-mobile-label">팀 사용자 수</p>
                          <p className="admin-channel-mobile-value">
                            {formatMemberCount(team.memberCount)}
                          </p>
                        </div>
                        <div>
                          <p className="admin-channel-mobile-label">오늘 활동</p>
                          <p className="admin-channel-mobile-value">
                            게시물 {formatCount(team.todayPostCount)} · 댓글 {formatCount(team.todayCommentCount)}
                          </p>
                        </div>
                        <div>
                          <p className="admin-channel-mobile-label">최근 7일 활동</p>
                          <p className="admin-channel-mobile-value">
                            게시물 {formatCount(team.weeklyPostCount)} · 댓글 {formatCount(team.weeklyCommentCount)}
                          </p>
                        </div>
                      </div>

                      <div className="admin-channel-actions admin-channel-mobile-actions">
                        <Link className="btn-base btn-neutral admin-channel-action-button" to={`/posts?team=${team.teamCode}`}>
                          게시물 보기
                        </Link>
                        <Link className="btn-base btn-neutral admin-channel-action-button" to={`/comments?team=${team.teamCode}`}>
                          댓글 보기
                        </Link>
                      </div>
                    </article>
                  )
                })}
              </div>
            </article>
          ) : (
            <ChannelOverviewEmptyState />
          )}
        </>
      ) : null}
    </section>
  )
}
