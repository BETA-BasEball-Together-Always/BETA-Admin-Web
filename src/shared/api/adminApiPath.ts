import { httpClient } from '@shared/api/httpClient'

export function resolveAdminPath(path: string): string {
  const baseUrl = (httpClient.defaults.baseURL ?? '').replace(/\/+$/, '')
  return baseUrl.endsWith('/admin') ? path : `/admin${path}`
}
