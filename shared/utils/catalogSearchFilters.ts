export type CatalogSearchFilters = {
  query: string
  itemTypes: string[]
  version: string | null
  quality: number | null
  style: string | null
  label: string | null
  source: string | null
}

export type CatalogSearchFilterQuery = Record<string, unknown>

const readFirstQueryValue = (value: unknown): unknown =>
  Array.isArray(value) ? value[0] : value

const normalizeString = (value: unknown) => {
  const firstValue = readFirstQueryValue(value)
  if (
    firstValue === null ||
    firstValue === undefined ||
    typeof firstValue === 'object'
  )
    return null

  const normalized = String(firstValue).trim()
  return normalized || null
}

const normalizeTrait = (value: unknown) => {
  const normalized = normalizeString(value)
  return normalized ? normalized.toLowerCase().replace(/[\s-]+/g, '_') : null
}

const normalizeQuality = (value: unknown) => {
  const normalized = normalizeString(value)
  if (!normalized || normalized === 'all') return null

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? Math.floor(parsed) : null
}

const normalizeItemTypes = (value: unknown) => {
  const normalized = normalizeString(value)
  if (!normalized || normalized === 'all') return []

  return Array.from(
    new Set(
      normalized
        .split(',')
        .map((entry) => normalizeItemSearchItemType(entry.trim()))
        .filter((entry) => entry && entry !== 'unknown')
    )
  ).sort((left, right) => left.localeCompare(right))
}

export const normalizeCatalogSearchFilters = (
  query: CatalogSearchFilterQuery
): CatalogSearchFilters => ({
  query: normalizeSearchQuery(normalizeString(query.q) ?? ''),
  itemTypes: normalizeItemTypes(query.type ?? query.item_type ?? query.slot),
  version: normalizeString(query.version),
  quality: normalizeQuality(query.quality),
  style: normalizeTrait(query.style),
  label: normalizeTrait(query.label),
  source: normalizeString(query.source ?? query.obtain),
})

export const buildCatalogSearchFilterQuery = (
  filters: CatalogSearchFilters
): Record<string, string | number> => ({
  ...(filters.query && { q: filters.query }),
  ...(filters.itemTypes.length > 0 && {
    type: [...filters.itemTypes]
      .sort((left, right) => left.localeCompare(right))
      .join(','),
  }),
  ...(filters.version && { version: filters.version }),
  ...(filters.quality !== null && { quality: filters.quality }),
  ...(filters.style && { style: filters.style }),
  ...(filters.label && { label: filters.label }),
  ...(filters.source && { source: filters.source }),
})

export const getCatalogSearchFilterKey = (filters: CatalogSearchFilters) =>
  [
    filters.query,
    filters.itemTypes.join(','),
    filters.version ?? '',
    filters.quality ?? '',
    filters.style ?? '',
    filters.label ?? '',
    filters.source ?? '',
  ].join(':')
