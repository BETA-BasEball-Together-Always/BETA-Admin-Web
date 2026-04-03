import { httpClient } from '@shared/api/httpClient'
import { type AdminPageResponse, normalizeAdminPageResponse } from '@shared/api/adminPage'
import { resolveAdminPath } from '@shared/api/adminApiPath'

export type AdminUserStatus = 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN'
export type AdminUserSocialProvider = 'APPLE' | 'KAKAO' | 'NAVER'
export type AdminUserGenderCategory = 'FEMALE' | 'MALE' | 'UNSPECIFIED'
export type AdminUserAgeGroup =
  | 'TEENS'
  | 'TWENTIES'
  | 'THIRTIES'
  | 'FORTIES'
  | 'FIFTIES'
  | 'OTHERS'
  | 'UNSPECIFIED'

export type AdminUserItemResponse = {
  userId: number
  nickname: string
  email: string
  joinedAt: string
  socialProvider: AdminUserSocialProvider
  favoriteTeamName: string | null
  bio: string | null
  status: AdminUserStatus
}

export type AdminUserGenderStatResponse = {
  gender: AdminUserGenderCategory
  count: number
}

export type AdminUserAgeStatResponse = {
  ageGroup: AdminUserAgeGroup
  count: number
}

export type AdminUserStatisticsResponse = {
  totalUserCount: number
  genderStats: AdminUserGenderStatResponse[]
  ageStats: AdminUserAgeStatResponse[]
}

type GetAdminUsersParams = {
  page: number
  size: number
  status?: AdminUserStatus
  keyword?: string
}

type GetAdminUserStatisticsParams = {
  status?: AdminUserStatus
}

const DEFAULT_GENDER_STATS: AdminUserGenderStatResponse[] = [
  { gender: 'FEMALE', count: 0 },
  { gender: 'MALE', count: 0 },
  { gender: 'UNSPECIFIED', count: 0 },
]

const DEFAULT_AGE_STATS: AdminUserAgeStatResponse[] = [
  { ageGroup: 'TEENS', count: 0 },
  { ageGroup: 'TWENTIES', count: 0 },
  { ageGroup: 'THIRTIES', count: 0 },
  { ageGroup: 'FORTIES', count: 0 },
  { ageGroup: 'FIFTIES', count: 0 },
  { ageGroup: 'OTHERS', count: 0 },
  { ageGroup: 'UNSPECIFIED', count: 0 },
]

function normalizeAdminUser(item: AdminUserItemResponse): AdminUserItemResponse {
  return {
    userId: item.userId,
    nickname: item.nickname,
    email: item.email,
    joinedAt: item.joinedAt,
    socialProvider: item.socialProvider,
    favoriteTeamName: item.favoriteTeamName ?? null,
    bio: item.bio ?? null,
    status: item.status,
  }
}

function normalizeGenderStats(
  stats: AdminUserGenderStatResponse[] | null | undefined,
): AdminUserGenderStatResponse[] {
  const countByGender = new Map<AdminUserGenderCategory, number>()

  if (Array.isArray(stats)) {
    stats.forEach((item) => {
      countByGender.set(item.gender, item.count ?? 0)
    })
  }

  return DEFAULT_GENDER_STATS.map((item) => ({
    gender: item.gender,
    count: countByGender.get(item.gender) ?? 0,
  }))
}

function normalizeAgeStats(
  stats: AdminUserAgeStatResponse[] | null | undefined,
): AdminUserAgeStatResponse[] {
  const countByAgeGroup = new Map<AdminUserAgeGroup, number>()

  if (Array.isArray(stats)) {
    stats.forEach((item) => {
      countByAgeGroup.set(item.ageGroup, item.count ?? 0)
    })
  }

  return DEFAULT_AGE_STATS.map((item) => ({
    ageGroup: item.ageGroup,
    count: countByAgeGroup.get(item.ageGroup) ?? 0,
  }))
}

function normalizeAdminUserStatistics(
  response: AdminUserStatisticsResponse,
): AdminUserStatisticsResponse {
  return {
    totalUserCount: response.totalUserCount ?? 0,
    genderStats: normalizeGenderStats(response.genderStats),
    ageStats: normalizeAgeStats(response.ageStats),
  }
}

export async function getAdminUsers(
  params: GetAdminUsersParams,
): Promise<AdminPageResponse<AdminUserItemResponse>> {
  const { data } = await httpClient.get<AdminPageResponse<AdminUserItemResponse>>(
    resolveAdminPath('/users'),
    {
      params,
    },
  )

  return normalizeAdminPageResponse(data, normalizeAdminUser)
}

export async function getAdminUserStatistics(
  params: GetAdminUserStatisticsParams = {},
): Promise<AdminUserStatisticsResponse> {
  const { data } = await httpClient.get<AdminUserStatisticsResponse>(
    resolveAdminPath('/users/statistics'),
    {
      params,
    },
  )

  return normalizeAdminUserStatistics(data)
}
