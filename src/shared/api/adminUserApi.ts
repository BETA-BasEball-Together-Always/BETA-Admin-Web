import { httpClient } from '@shared/api/httpClient'
import { type AdminPageResponse, normalizeAdminPageResponse } from '@shared/api/adminPage'
import { resolveAdminPath } from '@shared/api/adminApiPath'

export type AdminUserStatus = 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN'
export type AdminUserGender = 'M' | 'F'
export type AdminUserSocialProvider = 'APPLE' | 'KAKAO'

export type AdminUserItemResponse = {
  userId: number
  nickname: string
  email: string
  joinedAt: string
  socialProvider: AdminUserSocialProvider
  favoriteTeamName: string | null
  gender: AdminUserGender | null
  age: number | null
  bio: string | null
  status: AdminUserStatus
}

type GetAdminUsersParams = {
  page: number
  size: number
  status?: AdminUserStatus
  keyword?: string
}

function normalizeAdminUser(item: AdminUserItemResponse): AdminUserItemResponse {
  return {
    userId: item.userId,
    nickname: item.nickname,
    email: item.email,
    joinedAt: item.joinedAt,
    socialProvider: item.socialProvider,
    favoriteTeamName: item.favoriteTeamName ?? null,
    gender: item.gender ?? null,
    age: item.age ?? null,
    bio: item.bio ?? null,
    status: item.status,
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
