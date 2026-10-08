import type { VariantType } from './variants'

export type CommunityVariationFilter = VariantType | 'all' | 'all-evos'

export type CommunityScopeType =
  'banners' | 'outfits' | 'items' | 'momo' | 'props'

export type CommunityScopeFilters = {
  quality?: 2 | 3 | 4 | 5 | 6
  version?: string
  style?: string
  label?: string
  source?: string
  sourceDetail?: string
  type?: string
  variations?: CommunityVariationFilter
}

export type CommunityScope = {
  scopeType: CommunityScopeType
  scopeFilters: CommunityScopeFilters
}

export type TierMode =
  'banners' | 'outfits' | 'items' | 'makeups' | 'momo' | 'props'

export type CommunityScopeFromTierlistInput = {
  mode: TierMode
  bannerQualityFilter: number | null
  qualityFilter: number | null
  itemTypeFilter: string | null
  versionFilter: string | null
  styleFilter: string | null
  labelFilter: string | null
  obtainFilter: string | null
  sourceDetailFilter: string | null
  variationFilter: CommunityVariationFilter
}

export const COMMUNITY_TIER_KEYS = ['S', 'A', 'B', 'C', 'D', 'F'] as const

const COMMUNITY_VARIATION_FILTERS = new Set<CommunityVariationFilter>([
  'base',
  'all',
  'glowup',
  'evo1',
  'evo2',
  'evo3',
  'all-evos',
])

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const normalizeCommunityQuality = (
  value: unknown
): CommunityScopeFilters['quality'] | null => {
  if (value === 2 || value === 3 || value === 4 || value === 5 || value === 6) {
    return value
  }
  return null
}

const normalizeCommunityStringFilter = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  if (!normalized) return null
  if (normalized.length > 64) return null
  return normalized
}

export const resolveCommunityScope = (
  scopeType: unknown,
  scopeFilters: unknown
): CommunityScope | null => {
  if (
    scopeType !== 'banners' &&
    scopeType !== 'outfits' &&
    scopeType !== 'items' &&
    scopeType !== 'momo' &&
    scopeType !== 'props'
  )
    return null
  if (!isRecord(scopeFilters)) return null

  const keys = Object.keys(scopeFilters)
  const supportedKeys =
    scopeType === 'banners'
      ? ['quality', 'version']
      : scopeType === 'momo' || scopeType === 'props'
        ? ['quality', 'version', 'source']
        : scopeType === 'outfits'
          ? [
              'quality',
              'version',
              'style',
              'label',
              'source',
              'sourceDetail',
              'variations',
            ]
          : [
              'quality',
              'version',
              'style',
              'label',
              'source',
              'sourceDetail',
              'type',
              'variations',
            ]
  const supportedKeySet = new Set(supportedKeys)
  const unsupportedKeys = keys.filter((key) => !supportedKeySet.has(key))
  if (unsupportedKeys.length > 0) return null

  const normalizedFilters: CommunityScopeFilters = {}

  if ('quality' in scopeFilters) {
    const quality = normalizeCommunityQuality(scopeFilters.quality)
    if (!quality) return null
    if (scopeType === 'banners' && quality !== 4 && quality !== 5) return null
    if (
      scopeType === 'props' &&
      quality !== 6 &&
      quality !== 5 &&
      quality !== 4 &&
      quality !== 3
    ) {
      return null
    }
    if (scopeType !== 'props' && quality === 6) return null
    normalizedFilters.quality = quality
  }

  if ('version' in scopeFilters) {
    const version = normalizeCommunityStringFilter(scopeFilters.version)
    if (!version) return null
    normalizedFilters.version = version
  }

  if (scopeType === 'outfits' || scopeType === 'items') {
    if ('style' in scopeFilters) {
      const style = normalizeCommunityStringFilter(scopeFilters.style)
      if (!style) return null
      normalizedFilters.style = style
    }

    if ('label' in scopeFilters) {
      const label = normalizeCommunityStringFilter(scopeFilters.label)
      if (!label) return null
      normalizedFilters.label = label
    }

    if ('source' in scopeFilters) {
      const source = normalizeCommunityStringFilter(scopeFilters.source)
      if (!source) return null
      normalizedFilters.source = source
    }

    if ('sourceDetail' in scopeFilters) {
      const sourceDetail = normalizeCommunityStringFilter(
        scopeFilters.sourceDetail
      )
      if (!sourceDetail) return null
      normalizedFilters.sourceDetail = sourceDetail
    }
  }

  if (
    (scopeType === 'momo' || scopeType === 'props') &&
    'source' in scopeFilters
  ) {
    const source = normalizeCommunityStringFilter(scopeFilters.source)
    if (!source) return null
    normalizedFilters.source = source
  }

  if ('variations' in scopeFilters) {
    const variations = scopeFilters.variations
    if (
      typeof variations !== 'string' ||
      !COMMUNITY_VARIATION_FILTERS.has(variations as CommunityVariationFilter)
    ) {
      return null
    }
    normalizedFilters.variations = variations as CommunityVariationFilter
  }

  if (scopeType === 'items' && 'type' in scopeFilters) {
    const type = normalizeCommunityStringFilter(scopeFilters.type)
    if (!type) return null
    normalizedFilters.type = type
  }

  return {
    scopeType,
    scopeFilters: normalizedFilters,
  }
}

export const resolveCommunityScopeFromTierlistFilters = (
  input: CommunityScopeFromTierlistInput
): CommunityScope | null => {
  if (
    (input.mode === 'outfits' ||
      input.mode === 'items' ||
      input.mode === 'makeups') &&
    !COMMUNITY_VARIATION_FILTERS.has(input.variationFilter)
  ) {
    return null
  }

  if (input.mode === 'banners') {
    const scopeFilters: CommunityScopeFilters = {}
    if (input.bannerQualityFilter === 5 || input.bannerQualityFilter === 4) {
      scopeFilters.quality = input.bannerQualityFilter
    } else if (input.bannerQualityFilter !== null) {
      return null
    }
    if (input.versionFilter) {
      scopeFilters.version = input.versionFilter
    }

    return {
      scopeType: 'banners',
      scopeFilters,
    }
  }

  if (input.mode === 'outfits') {
    const scopeFilters: CommunityScopeFilters = {
      variations: input.variationFilter,
    }
    if (
      input.qualityFilter === 5 ||
      input.qualityFilter === 4 ||
      input.qualityFilter === 3 ||
      input.qualityFilter === 2
    ) {
      scopeFilters.quality = input.qualityFilter
    } else if (input.qualityFilter !== null) {
      return null
    }
    if (input.versionFilter) {
      scopeFilters.version = input.versionFilter
    }
    if (input.styleFilter) {
      scopeFilters.style = input.styleFilter
    }
    if (input.labelFilter) {
      scopeFilters.label = input.labelFilter
    }
    if (input.obtainFilter) {
      scopeFilters.source = input.obtainFilter
    }
    if (input.sourceDetailFilter) {
      scopeFilters.sourceDetail = input.sourceDetailFilter
    }

    return {
      scopeType: 'outfits',
      scopeFilters,
    }
  }

  if (input.mode === 'items' || input.mode === 'makeups') {
    const scopeFilters: CommunityScopeFilters = {
      variations: input.variationFilter,
    }
    if (
      input.qualityFilter === 5 ||
      input.qualityFilter === 4 ||
      input.qualityFilter === 3 ||
      input.qualityFilter === 2
    ) {
      scopeFilters.quality = input.qualityFilter
    } else if (input.qualityFilter !== null) {
      return null
    }
    if (input.versionFilter) {
      scopeFilters.version = input.versionFilter
    }
    if (input.styleFilter) {
      scopeFilters.style = input.styleFilter
    }
    if (input.labelFilter) {
      scopeFilters.label = input.labelFilter
    }
    if (input.obtainFilter) {
      scopeFilters.source = input.obtainFilter
    }
    if (input.sourceDetailFilter) {
      scopeFilters.sourceDetail = input.sourceDetailFilter
    }
    if (input.itemTypeFilter) {
      scopeFilters.type = input.itemTypeFilter
    }

    return {
      scopeType: 'items',
      scopeFilters,
    }
  }

  if (input.mode === 'momo') {
    const scopeFilters: CommunityScopeFilters = {}
    if (
      input.qualityFilter === 5 ||
      input.qualityFilter === 4 ||
      input.qualityFilter === 3 ||
      input.qualityFilter === 2
    ) {
      scopeFilters.quality = input.qualityFilter
    } else if (input.qualityFilter !== null) {
      return null
    }
    if (input.versionFilter) {
      scopeFilters.version = input.versionFilter
    }
    if (input.obtainFilter) {
      scopeFilters.source = input.obtainFilter
    }

    return {
      scopeType: 'momo',
      scopeFilters,
    }
  }

  if (input.mode === 'props') {
    const scopeFilters: CommunityScopeFilters = {}
    if (
      input.qualityFilter === 6 ||
      input.qualityFilter === 5 ||
      input.qualityFilter === 4 ||
      input.qualityFilter === 3
    ) {
      scopeFilters.quality = input.qualityFilter
    } else if (input.qualityFilter !== null) {
      return null
    }
    if (input.versionFilter) {
      scopeFilters.version = input.versionFilter
    }
    if (input.obtainFilter) {
      scopeFilters.source = input.obtainFilter
    }

    return {
      scopeType: 'props',
      scopeFilters,
    }
  }

  return null
}
