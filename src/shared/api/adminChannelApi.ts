import { httpClient } from '@shared/api/httpClient'
import { resolveAdminPath } from '@shared/api/adminApiPath'

export type AdminChannelOverviewResponse = {
  todayPeakTeam: AdminChannelPeakTeamResponse
  weeklyPeakTeam: AdminChannelPeakTeamResponse
  teams: AdminChannelTeamActivityResponse[]
}

export type AdminChannelPeakTeamResponse = {
  teamCode: string | null
  teamName: string | null
  activityCount: number
  postCount: number
  commentCount: number
}

export type AdminChannelTeamActivityResponse = {
  teamCode: string
  teamName: string
  userCount: number
  todayPostCount: number
  todayCommentCount: number
  todayActivityCount: number
  weeklyPostCount: number
  weeklyCommentCount: number
  weeklyActivityCount: number
  dailyActivities: AdminChannelDailyActivityResponse[]
}

export type AdminChannelDailyActivityResponse = {
  date: string
  postCount: number
  commentCount: number
  totalActivityCount: number
}

const EMPTY_PEAK_TEAM: AdminChannelPeakTeamResponse = {
  teamCode: null,
  teamName: null,
  activityCount: 0,
  postCount: 0,
  commentCount: 0,
}

function normalizePeakTeam(
  peakTeam: AdminChannelPeakTeamResponse | null | undefined,
): AdminChannelPeakTeamResponse {
  if (!peakTeam) {
    return EMPTY_PEAK_TEAM
  }

  return {
    teamCode: peakTeam.teamCode ?? null,
    teamName: peakTeam.teamName ?? null,
    activityCount: peakTeam.activityCount ?? 0,
    postCount: peakTeam.postCount ?? 0,
    commentCount: peakTeam.commentCount ?? 0,
  }
}

function normalizeDailyActivity(
  activity: AdminChannelDailyActivityResponse,
): AdminChannelDailyActivityResponse {
  return {
    date: activity.date,
    postCount: activity.postCount ?? 0,
    commentCount: activity.commentCount ?? 0,
    totalActivityCount: activity.totalActivityCount ?? 0,
  }
}

function normalizeTeamActivity(
  team: AdminChannelTeamActivityResponse,
): AdminChannelTeamActivityResponse {
  return {
    teamCode: team.teamCode,
    teamName: team.teamName,
    userCount: team.userCount ?? 0,
    todayPostCount: team.todayPostCount ?? 0,
    todayCommentCount: team.todayCommentCount ?? 0,
    todayActivityCount: team.todayActivityCount ?? 0,
    weeklyPostCount: team.weeklyPostCount ?? 0,
    weeklyCommentCount: team.weeklyCommentCount ?? 0,
    weeklyActivityCount: team.weeklyActivityCount ?? 0,
    dailyActivities: Array.isArray(team.dailyActivities)
      ? team.dailyActivities.map(normalizeDailyActivity)
      : [],
  }
}

function normalizeChannelOverviewResponse(
  response: AdminChannelOverviewResponse,
): AdminChannelOverviewResponse {
  return {
    todayPeakTeam: normalizePeakTeam(response.todayPeakTeam),
    weeklyPeakTeam: normalizePeakTeam(response.weeklyPeakTeam),
    teams: Array.isArray(response.teams)
      ? response.teams.map(normalizeTeamActivity)
      : [],
  }
}

export async function getAdminChannelOverview(): Promise<AdminChannelOverviewResponse> {
  const { data } = await httpClient.get<AdminChannelOverviewResponse>(resolveAdminPath('/channels/overview'))
  return normalizeChannelOverviewResponse(data)
}
