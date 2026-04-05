export const normalizeSearchQuery = (value: unknown): string => {
  if (typeof value !== 'string') return ''

  return value.trim().replace(/\s+/gu, ' ').toLowerCase()
}

export const normalizeSearchCacheKey = (value: unknown): string =>
  normalizeSearchQuery(value)
