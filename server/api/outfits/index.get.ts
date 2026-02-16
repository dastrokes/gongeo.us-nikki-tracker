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
  resolveStyleKeyFromProps,
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

type OutfitSortRow = {
  id: number
  quality: number
  obtain_type?: number | null
}

type OutfitRow = {
  id: number
  quality: number
  props: Array<number | string> | null
  style_key?: string | null
  tags: Array<number | string> | null
  obtain_type?: number | null
}

const BASE_OUTFIT_ID_MIN = 10000
const BASE_OUTFIT_ID_MAX = 99999
const DEFAULT_PAGE_SIZE = 18
const MAX_PAGE_SIZE = 200

const parsePageSize = (value: unknown): number => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_PAGE_SIZE
  return Math.min(Math.floor(parsed), MAX_PAGE_SIZE)
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

const compareOutfitSortOrder = (a: OutfitSortRow, b: OutfitSortRow) => {
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
 * API endpoint for fetching paginated outfits
 * App-level caching enabled (30d), Netlify edge caching enabled via Cache-Control header
 */
export default defineCachedEventHandler(
  async (event) => {
    setCacheHeaders(event, {
      varyQuery: true,
      varyHeaders: [GAME_VERSION_HEADER],
    })
    const query = getQuery(event)
    const quality = query.quality ? Number(query.quality) : null
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
      let sortSeedQuery = supabase
        .from('outfits')
        .select('id, quality, obtain_type')
        .gte('id', BASE_OUTFIT_ID_MIN)
        .lte('id', BASE_OUTFIT_ID_MAX)

      if (obtainTypeRange) {
        sortSeedQuery = sortSeedQuery
          .gte('obtain_type', obtainTypeRange.min)
          .lte('obtain_type', obtainTypeRange.max)
      }

      if (quality !== null && quality !== undefined) {
        sortSeedQuery = sortSeedQuery.eq('quality', quality)
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

      const sortedRows = ((sortSeedData as OutfitSortRow[] | null) ?? [])
        .slice()
        .sort(compareOutfitSortOrder)
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

      const pageIds = pageRows.map((row) => row.id)
      const { data: detailData, error: detailError } = await withSupabaseRetry(
        () =>
          supabase
            .from('outfits')
            .select('id, quality, props, style_key, tags, obtain_type')
            .in('id', pageIds)
      )

      if (detailError) {
        throw detailError
      }

      const detailRows = (detailData as OutfitRow[] | null) ?? []
      const detailById = new Map<number, OutfitRow>(
        detailRows.map((row) => [row.id, row])
      )
      const orderedRows = pageIds
        .map((id) => detailById.get(id))
        .filter((row): row is OutfitRow => Boolean(row))

      return {
        data: orderedRows.map((row) => {
          const styleKey = row.style_key ?? resolveStyleKeyFromProps(row.props)
          return {
            id: row.id,
            quality: row.quality,
            style: styleKey
              ? (STYLE_BY_KEY.get(styleKey)?.i18nKey ?? null)
              : null,
            labels: resolveTagI18nKeys(row.tags),
            obtain_type: row.obtain_type ?? null,
          }
        }),
        total,
        page,
        totalPages,
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }
      const message = toErrorMessage(error, 'Failed to fetch outfits')
      if (isTransientSupabaseError(error)) {
        console.warn(`Failed to fetch outfits: ${message}`)
        throw createUpstreamUnavailableError('outfits')
      }
      console.error(`Failed to fetch outfits: ${message}`)
      throw createInternalError('outfits')
    }
  },
  {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    name: 'outfits-list',
    getKey: (event) => {
      const version = getGameVersion()
      const query = getQuery(event)
      const page = query.page ? Number(query.page) : 1
      const pageSize = parsePageSize(query.pageSize ?? query.page_size)
      const quality = query.quality ? Number(query.quality) : 'all'
      const style = query.style?.toString() || 'all'
      const label = query.label?.toString() || 'all'
      const outfitVersion = query.version?.toString() || 'all'
      const source = query.source
        ? query.source.toString()
        : query.obtain
          ? query.obtain.toString()
          : 'all'
      return `${version}:outfits:p${page}:ps${pageSize}:q${quality}:s${style}:l${label}:v${outfitVersion}:src${source}`
    },
    swr: true, // Enable stale-while-revalidate
  }
)
