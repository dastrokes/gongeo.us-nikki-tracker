export const SEARCH_MAX_QUERY_LENGTH = 100

export const isSearchQueryWithinLimit = (value: string): boolean =>
  value.length <= SEARCH_MAX_QUERY_LENGTH

export const normalizeSearchQuery = (value: unknown): string => {
  if (typeof value !== 'string') return ''

  return value.trim().replace(/\s+/gu, ' ').toLowerCase()
}

export const normalizeSearchCacheKey = (value: unknown): string =>
  normalizeSearchQuery(value)
