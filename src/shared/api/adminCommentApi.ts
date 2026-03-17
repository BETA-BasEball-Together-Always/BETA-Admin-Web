import { httpClient } from '@shared/api/httpClient'
import { type AdminPageResponse, normalizeAdminPageResponse } from '@shared/api/adminPage'
import { resolveAdminPath } from '@shared/api/adminApiPath'

export type AdminCommentStatus = 'PENDING' | 'ACTIVE' | 'DELETED' | 'HIDDEN' | 'REPORTED'

export type AdminCommentItemResponse = {
  commentId: number
  authorUserId: number
  authorNickname: string | null
  postId: number
  content: string
  depth: number
  status: AdminCommentStatus
  createdAt: string
}

type GetAdminCommentsParams = {
  page: number
  size: number
  status?: AdminCommentStatus
  keyword?: string
}

function normalizeAdminComment(item: AdminCommentItemResponse): AdminCommentItemResponse {
  return {
    commentId: item.commentId,
    authorUserId: item.authorUserId,
    authorNickname: item.authorNickname ?? null,
    postId: item.postId,
    content: item.content,
    depth: item.depth,
    status: item.status,
    createdAt: item.createdAt,
  }
}

export async function getAdminComments(
  params: GetAdminCommentsParams,
): Promise<AdminPageResponse<AdminCommentItemResponse>> {
  const { data } = await httpClient.get<AdminPageResponse<AdminCommentItemResponse>>(
    resolveAdminPath('/comments'),
    {
      params,
    },
  )

  return normalizeAdminPageResponse(data, normalizeAdminComment)
}
