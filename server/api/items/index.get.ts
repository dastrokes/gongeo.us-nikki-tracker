import { useSupabaseDataClient } from '~/composables/useSupabaseClient'
import { GAME_VERSION_HEADER, setCacheHeaders } from '~/utils/cacheHeaders'
import { getGameVersion } from '~/utils/gameVersion'
import {
  createInternalError,
  createUpstreamUnavailableError,
} from '~/utils/apiErrors'
import { toErrorMessage } from '~/utils/errors'
import {
  normalizeTraitKey,
  resolveStyleI18nKeyFromProps,
  resolveTagI18nKeys,
  STYLE_BY_KEY,
  TAG_BY_KEY,
} from '~/utils/itemInfo'
import {
  isTransientSupabaseError,
  withSupabaseRetry,
} from '~/utils/supabaseRetry'
import {
  getVersionFromId,
  getVersionPrefixRange,
  getVersionRangeFromPrefix,
} from '~/utils/contentVersion'
import { resolveObtainIdsFromValue } from '~/utils/obtainGroups'

type ItemSortRow = {
  id: number
  quality: number
  obtain_type?: number | null
}

type ItemRow = {
  id: number
  quality: number
  type: string
  props: Array<number | string> | null
  style_key?: string | null
  tags: Array<number | string> | null
  obtain_type?: number | null
}

const BASE_ITEM_PREFIX_RANGES = [
  [1020000000, 1020999999],
  [1021000000, 1021999999],
  [1027000000, 1027999999],
  [1028000000, 1028999999],
  [1029000000, 1029999999],
] as const

const DEFAULT_PAGE_SIZE = 18
const TIERLIST_PAGE_SIZE = 200
const ALLOWED_PAGE_SIZES = new Set([DEFAULT_PAGE_SIZE, TIERLIST_PAGE_SIZE])

const parsePageSize = (value: unknown): number => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return DEFAULT_PAGE_SIZE
  const normalized = Math.floor(parsed)
  return ALLOWED_PAGE_SIZES.has(normalized) ? normalized : DEFAULT_PAGE_SIZE
}

const compareVersion = (a: string, b: string) => {
  const parseVersion = (value: string) => {
    const [majorRaw, minorRaw] = value.split('.')
    const major = Number(majorRaw)
    const minor = Number(minorRaw)
    return {
      major: Number.isNaN(major) ? 0 : major,
      minor: Number.isNaN(minor) ? 0 : minor,
    }
  }
  const aVersion = parseVersion(a)
  const bVersion = parseVersion(b)
  if (aVersion.major !== bVersion.major) {
    return aVersion.major - bVersion.major
  }
  return aVersion.minor - bVersion.minor
}

const getSortVersion = (obtainType?: number | null) =>
  obtainType ? getVersionFromId(obtainType) : null

const compareItemSortOrder = (a: ItemSortRow, b: ItemSortRow) => {
  if (a.quality !== b.quality) {
    return b.quality - a.quality
  }
  const versionA = getSortVersion(a.obtain_type)
  const versionB = getSortVersion(b.obtain_type)
  if (versionA && versionB && versionA !== versionB) {
    return compareVersion(versionB, versionA)
  }
  if (versionA && !versionB) return -1
  if (!versionA && versionB) return 1
  const obtainA = a.obtain_type ?? Number.POSITIVE_INFINITY
  const obtainB = b.obtain_type ?? Number.POSITIVE_INFINITY
  if (obtainA !== obtainB) return obtainA - obtainB
  return a.id - b.id
}

/**
 * API endpoint for fetching paginated items
 * App-level caching enabled (30d), Netlify edge caching enabled via Cache-Control header
 */
export default defineCachedEventHandler(
  async (event) => {
    setCacheHeaders(event, {
      varyQuery: true,
      varyHeaders: [GAME_VERSION_HEADER],
    })
    const query = getQuery(event)
    const qualityParam = query.quality?.toString().trim() ?? ''
    const qualityParsed = qualityParam ? Number(qualityParam) : null
    const invalidQuality =
      qualityParam.length > 0 && !Number.isFinite(qualityParsed)
    const quality = invalidQuality ? null : qualityParsed
    const type = query.type?.toString() || null
    const styleParam = query.style?.toString() || null
    const labelParam = query.label?.toString() || null
    const versionParam = query.version?.toString() || null
    const sourceParam = query.source
      ? query.source.toString()
      : query.obtain
        ? query.obtain.toString()
        : null
    const page =
      Number.isNaN(Number(query.page)) || Number(query.page) < 1
        ? 1
        : Number(query.page ?? 1)
    const pageSize = parsePageSize(query.pageSize ?? query.page_size)
    const useCompactPayload = pageSize === TIERLIST_PAGE_SIZE
    const from = (page - 1) * pageSize
    const toExclusive = from + pageSize
    const normalizedStyle = styleParam ? normalizeTraitKey(styleParam) : null
    const normalizedLabel = labelParam ? normalizeTraitKey(labelParam) : null
    const styleFilter = normalizedStyle
      ? STYLE_BY_KEY.get(normalizedStyle)
      : null
    const labelFilter = normalizedLabel ? TAG_BY_KEY.get(normalizedLabel) : null
    const versionPrefixRange = versionParam
      ? getVersionPrefixRange(versionParam)
      : null
    const obtainTypeRange = versionPrefixRange
      ? {
          min: getVersionRangeFromPrefix(versionPrefixRange.min, 2).min,
          max: getVersionRangeFromPrefix(versionPrefixRange.max, 2).max,
        }
      : null
    const obtainIds = sourceParam
      ? resolveObtainIdsFromValue(sourceParam)
      : null

    if (
      invalidQuality ||
      (styleParam && !styleFilter) ||
      (labelParam && !labelFilter) ||
      (versionParam && obtainTypeRange === null) ||
      (sourceParam && (!obtainIds || obtainIds.length === 0))
    ) {
      return {
        data: [],
        total: 0,
        page,
        totalPages: 0,
      }
    }

    const supabase = useSupabaseDataClient()

    try {
      const baseItemRangeFilters = BASE_ITEM_PREFIX_RANGES.map(
        ([min, max]) => `and(id.gte.${min},id.lte.${max})`
      ).join(',')

      let sortSeedQuery = supabase
        .from('items')
        .select('id, quality, obtain_type')
        .or(baseItemRangeFilters)

      if (obtainTypeRange) {
        sortSeedQuery = sortSeedQuery
          .gte('obtain_type', obtainTypeRange.min)
          .lte('obtain_type', obtainTypeRange.max)
      }

      if (quality !== null && quality !== undefined) {
        sortSeedQuery = sortSeedQuery.eq('quality', quality)
      }

      if (type && type !== 'all') {
        sortSeedQuery = sortSeedQuery.eq('type', type)
      }

      if (obtainIds) {
        sortSeedQuery = sortSeedQuery.in('obtain_type', obtainIds)
      }

      if (styleFilter) {
        sortSeedQuery = sortSeedQuery.eq('style_key', styleFilter.key)
      }

      if (labelFilter) {
        sortSeedQuery = sortSeedQuery.contains('tags', [labelFilter.id])
      }

      const { data: sortSeedData, error: sortSeedError } =
        await withSupabaseRetry(() => sortSeedQuery)

      if (sortSeedError) {
        throw sortSeedError
      }

      const sortedRows = ((sortSeedData as ItemSortRow[] | null) ?? [])
        .slice()
        .sort(compareItemSortOrder)
      const total = sortedRows.length
      const totalPages = total ? Math.ceil(total / pageSize) : 0
      const pageRows = sortedRows.slice(from, toExclusive)

      if (pageRows.length === 0) {
        return {
          data: [],
          total,
          page,
          totalPages,
        }
      }

      if (useCompactPayload) {
        return {
          data: pageRows.map((row) => ({
            id: row.id,
            quality: row.quality,
          })),
          total,
          page,
          totalPages,
        }
      }

      const pageIds = pageRows.map((row) => row.id)
      const { data: detailData, error: detailError } = await withSupabaseRetry(
        () =>
          supabase
            .from('items')
            .select('id, quality, type, props, style_key, tags, obtain_type')
            .in('id', pageIds)
      )

      if (detailError) {
        throw detailError
      }

      const detailRows = (detailData as ItemRow[] | null) ?? []
      const detailById = new Map<number, ItemRow>(
        detailRows.map((row) => [row.id, row])
      )
      const orderedRows = pageIds
        .map((id) => detailById.get(id))
        .filter((row): row is ItemRow => Boolean(row))

      return {
        data: orderedRows.map((item) => ({
          id: item.id,
          quality: item.quality,
          type: item.type,
          obtain_type: item.obtain_type ?? null,
          style: item.style_key
            ? resolveStyleI18nKeyFromProps(item.props)
            : null,
          labels: resolveTagI18nKeys(item.tags),
        })),
        total,
        page,
        totalPages,
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }
      const message = toErrorMessage(error, 'Failed to fetch items')
      if (isTransientSupabaseError(error)) {
        console.warn(`Failed to fetch items: ${message}`)
        throw createUpstreamUnavailableError('items')
      }
      console.error(`Failed to fetch items: ${message}`)
      throw createInternalError('items')
    }
  },
  {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    name: 'items-list',
    getKey: (event) => {
      const version = getGameVersion()
      const query = getQuery(event)
      const page = query.page ? Number(query.page) : 1
      const pageSize = parsePageSize(query.pageSize ?? query.page_size)
      const qualityParam = query.quality?.toString().trim() ?? ''
      const qualityParsed = qualityParam ? Number(qualityParam) : null
      const quality = qualityParam
        ? Number.isFinite(qualityParsed)
          ? qualityParsed
          : 'invalid'
        : 'all'
      const type = query.type?.toString() || 'all'
      const style = query.style?.toString() || 'all'
      const label = query.label?.toString() || 'all'
      const itemVersion = query.version?.toString() || 'all'
      const source = query.source
        ? query.source.toString()
        : query.obtain
          ? query.obtain.toString()
          : 'all'
      return `${version}:items:p${page}:ps${pageSize}:q${quality}:t${type}:s${style}:l${label}:v${itemVersion}:src${source}`
    },
    swr: true, // Enable stale-while-revalidate
  }
)
