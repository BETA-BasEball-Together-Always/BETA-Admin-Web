import { httpClient } from '@shared/api/httpClient'
import { resolveAdminPath } from '@shared/api/adminApiPath'

export type AdminLogAction =
  | 'MEMBER_SUSPEND'
  | 'MEMBER_UNSUSPEND'
  | 'POST_HIDE'
  | 'POST_UNHIDE'
  | 'COMMENT_HIDE'
  | 'COMMENT_UNHIDE'

export type AdminLogTargetType = 'MEMBER' | 'POST' | 'COMMENT'

export type AdminLogItemResponse = {
  logId: number
  actorAdminId: number
  actorAdminNickname: string
  targetType: AdminLogTargetType
  targetId: number
  action: AdminLogAction
  beforeStatus: string | null
  afterStatus: string | null
  reason: string | null
  createdAt: string
}

export type AdminLogListResponse = {
  items: AdminLogItemResponse[]
  page: number
  size: number
  totalCount: number
  totalPages: number
}

type GetAdminLogsParams = {
  page: number
  size: number
  action?: AdminLogAction
  from?: string
  to?: string
}

function normalizeAdminLog(item: AdminLogItemResponse): AdminLogItemResponse {
  return {
    logId: item.logId,
    actorAdminId: item.actorAdminId,
    actorAdminNickname: item.actorAdminNickname,
    targetType: item.targetType,
    targetId: item.targetId,
    action: item.action,
    beforeStatus: item.beforeStatus ?? null,
    afterStatus: item.afterStatus ?? null,
    reason: item.reason ?? null,
    createdAt: item.createdAt,
  }
}

function normalizeAdminLogListResponse(
  response: AdminLogListResponse,
): AdminLogListResponse {
  return {
    items: Array.isArray(response.items)
      ? response.items.map(normalizeAdminLog)
      : [],
    page: response.page,
    size: response.size,
    totalCount: response.totalCount,
    totalPages: response.totalPages,
  }
}

export async function getAdminLogs(
  params: GetAdminLogsParams,
): Promise<AdminLogListResponse> {
  const { data } = await httpClient.get<AdminLogListResponse>(
    resolveAdminPath('/action-logs'),
    { params },
  )

  return normalizeAdminLogListResponse(data)
}
