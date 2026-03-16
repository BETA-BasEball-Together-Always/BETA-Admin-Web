import { httpClient } from '@shared/api/httpClient'
import { type AdminPageResponse, normalizeAdminPageResponse } from '@shared/api/adminPage'
import { resolveAdminPath } from '@shared/api/adminApiPath'

export type AdminPostStatus = 'PENDING' | 'ACTIVE' | 'DELETED' | 'HIDDEN' | 'REPORTED'
export type AdminPostChannel =
  | 'DOOSAN'
  | 'LG'
  | 'KIWOOM'
  | 'KT'
  | 'SSG'
  | 'KIA'
  | 'SAMSUNG'
  | 'NC'
  | 'HANWHA'
  | 'LOTTE'
  | 'ALL'

export type AdminPostItemResponse = {
  postId: number
  authorUserId: number
  authorNickname: string | null
  content: string
  channel: AdminPostChannel
  status: AdminPostStatus
  createdAt: string
}

type GetAdminPostsParams = {
  page: number
  size: number
  status?: AdminPostStatus
  channel?: AdminPostChannel
  keyword?: string
}

function normalizeAdminPost(item: AdminPostItemResponse): AdminPostItemResponse {
  return {
    postId: item.postId,
    authorUserId: item.authorUserId,
    authorNickname: item.authorNickname ?? null,
    content: item.content,
    channel: item.channel,
    status: item.status,
    createdAt: item.createdAt,
  }
}

export async function getAdminPosts(
  params: GetAdminPostsParams,
): Promise<AdminPageResponse<AdminPostItemResponse>> {
  const { data } = await httpClient.get<AdminPageResponse<AdminPostItemResponse>>(
    resolveAdminPath('/posts'),
    {
      params,
    },
  )

  return normalizeAdminPageResponse(data, normalizeAdminPost)
}
