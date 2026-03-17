import { httpClient } from '@shared/api/httpClient'
import { resolveAdminPath } from '@shared/api/adminApiPath'

type AdminActionRequest = {
  reason: string
}

export type AdminActionResponse = {
  success: boolean
  message: string
}

async function patchAdminAction(
  path: string,
  body: AdminActionRequest,
): Promise<AdminActionResponse> {
  const { data } = await httpClient.patch<AdminActionResponse>(
    resolveAdminPath(path),
    body,
  )

  return data
}

export function suspendUser(userId: number, reason: string) {
  return patchAdminAction(
    `/users/${userId}/suspend`,
    { reason },
  )
}

export function unsuspendUser(userId: number, reason: string) {
  return patchAdminAction(
    `/users/${userId}/unsuspend`,
    { reason },
  )
}

export function hidePost(postId: number, reason: string) {
  return patchAdminAction(
    `/posts/${postId}/hide`,
    { reason },
  )
}

export function unhidePost(postId: number, reason: string) {
  return patchAdminAction(
    `/posts/${postId}/unhide`,
    { reason },
  )
}

export function hideComment(commentId: number, reason: string) {
  return patchAdminAction(
    `/comments/${commentId}/hide`,
    { reason },
  )
}

export function unhideComment(commentId: number, reason: string) {
  return patchAdminAction(
    `/comments/${commentId}/unhide`,
    { reason },
  )
}
