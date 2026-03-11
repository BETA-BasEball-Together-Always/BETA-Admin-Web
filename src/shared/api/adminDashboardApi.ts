import { httpClient } from '@shared/api/httpClient'
import { resolveAdminPath } from '@shared/api/adminApiPath'

export type AdminDashboardMetricResponse = {
  totalMemberCount: number
  totalMemberDelta: number
  todayPostCount: number
  todayPostDelta: number
  todayNewSignupCount: number
  todayNewSignupDelta: number
  pendingReportCount: number | null
  realtimeFeeds: AdminRealtimeFeedItemResponse[]
  popularTopics: AdminPopularTopicItemResponse[]
}

export type AdminRealtimeFeedItemResponse = {
  postId: number
  authorNickname: string
  contentPreview: string
  channel: string
  createdAt: string
  likeCount: number
  commentCount: number
  thumbnailUrl: string | null
}

export type AdminPopularTopicItemResponse = {
  hashtagId: number
  hashtag: string
  usageCount: number
}

export async function getAdminDashboard(): Promise<AdminDashboardMetricResponse> {
  const { data } = await httpClient.get<AdminDashboardMetricResponse>(resolveAdminPath('/dashboard'))
  return data
}
