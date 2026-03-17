export type AdminPageResponse<T> = {
  items: T[]
  page: number
  size: number
  totalCount: number
  totalPages: number
}

export function normalizeAdminPageResponse<T>(
  response: AdminPageResponse<T>,
  normalizeItem: (item: T) => T,
): AdminPageResponse<T> {
  return {
    items: Array.isArray(response.items)
      ? response.items.map(normalizeItem)
      : [],
    page: response.page ?? 0,
    size: response.size ?? 0,
    totalCount: response.totalCount ?? 0,
    totalPages: response.totalPages ?? 0,
  }
}
