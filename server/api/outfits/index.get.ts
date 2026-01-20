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
  getVersionPrefix,
  getVersionRangeFromPrefix,
} from '~/utils/contentVersion'
import { resolveObtainIdsFromValue } from '~/utils/obtainGroups'

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

/**
 * API endpoint for fetching paginated outfits
 * App-level caching enabled (30d), Netlify edge caching enabled via Cache-Control header
 */
export default defineCachedEventHandler(
  async (event) => {
    setCacheHeaders(event, {
      varyQuery: ['page', 'quality', 'style', 'label', 'version', 'source'],
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
    const pageSize = 18
    const normalizedStyle = styleParam ? normalizeTraitKey(styleParam) : null
    const normalizedLabel = labelParam ? normalizeTraitKey(labelParam) : null
    const styleFilter = normalizedStyle
      ? STYLE_BY_KEY.get(normalizedStyle)
      : null
    const labelFilter = normalizedLabel ? TAG_BY_KEY.get(normalizedLabel) : null
    const versionPrefix = versionParam ? getVersionPrefix(versionParam) : null
    const obtainIds = sourceParam
      ? resolveObtainIdsFromValue(sourceParam)
      : null

    if (
      (styleParam && !styleFilter) ||
      (labelParam && !labelFilter) ||
      (versionParam && versionPrefix === null) ||
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
      // Build the query - always fetch props and tags for style/label display
      const selectFields = 'id, quality, props, style_key, tags, obtain_type'

      let dbQuery = supabase
        .from('outfits')
        .select(selectFields, { count: 'exact' })
        .gte('id', BASE_OUTFIT_ID_MIN)
        .lte('id', BASE_OUTFIT_ID_MAX)

      if (versionPrefix !== null) {
        const { min, max } = getVersionRangeFromPrefix(versionPrefix, 2)
        dbQuery = dbQuery.gte('obtain_type', min).lte('obtain_type', max)
      }

      // Apply quality filter
      if (quality !== null && quality !== undefined) {
        dbQuery = dbQuery.eq('quality', quality)
      }

      if (obtainIds) {
        dbQuery = dbQuery.in('obtain_type', obtainIds)
      }

      if (styleFilter) {
        dbQuery = dbQuery.eq('style_key', styleFilter.key)
      }

      if (labelFilter) {
        dbQuery = dbQuery.contains('tags', [labelFilter.id])
      }

      // Apply sorting and pagination
      dbQuery = dbQuery.order('id', { ascending: true })

      const {
        data,
        error: supabaseError,
        count,
        status,
      } = await withSupabaseRetry(() => dbQuery)

      if (supabaseError) {
        const responseStatus =
          status ?? (supabaseError as { status?: number }).status
        const code = (supabaseError as { code?: string }).code
        const details = (supabaseError as { details?: string }).details
        const isRangeError =
          responseStatus === 416 ||
          code === 'PGRST103' ||
          (details && details.includes('Requested range not satisfiable'))
        if (isRangeError) {
          let total = count || 0
          if (!total) {
            let countQuery = supabase
              .from('outfits')
              .select('id', { count: 'exact', head: true })
              .gte('id', BASE_OUTFIT_ID_MIN)
              .lte('id', BASE_OUTFIT_ID_MAX)

            if (versionPrefix !== null) {
              const { min, max } = getVersionRangeFromPrefix(versionPrefix, 2)
              countQuery = countQuery
                .gte('obtain_type', min)
                .lte('obtain_type', max)
            }

            if (quality !== null && quality !== undefined) {
              countQuery = countQuery.eq('quality', quality)
            }

            if (obtainIds) {
              countQuery = countQuery.in('obtain_type', obtainIds)
            }

            if (styleFilter) {
              countQuery = countQuery.eq('style_key', styleFilter.key)
            }

            if (labelFilter) {
              countQuery = countQuery.contains('tags', [labelFilter.id])
            }

            const { count: fallbackCount, error: countError } =
              await withSupabaseRetry(() => countQuery)
            if (!countError && typeof fallbackCount === 'number') {
              total = fallbackCount
            }
          }
          const totalPages = total ? Math.ceil(total / pageSize) : 0
          return {
            data: [],
            total,
            page,
            totalPages,
          }
        }

        throw supabaseError
      }

      const rows = (data as OutfitRow[] | null) ?? []
      const outfits = rows.map((row) => {
        const styleKey = row.style_key ?? resolveStyleKeyFromProps(row.props)
        const tagIds = (row.tags || [])
          .map((value: number | string) => Number(value))
          .filter((value: number) => !Number.isNaN(value))
        return {
          id: row.id,
          quality: row.quality,
          style: styleKey
            ? (STYLE_BY_KEY.get(styleKey)?.i18nKey ?? null)
            : null,
          labels: resolveTagI18nKeys(row.tags),
          obtain_type: row.obtain_type ?? null,
          styleKey,
          tagIds,
        }
      })

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

      const getSortVersion = (_id: number, obtainType?: number | null) =>
        obtainType ? getVersionFromId(obtainType) : null

      const sortedOutfits = outfits.slice().sort((a, b) => {
        if (a.quality !== b.quality) {
          return b.quality - a.quality
        }
        const versionA = getSortVersion(a.id, a.obtain_type)
        const versionB = getSortVersion(b.id, b.obtain_type)
        if (versionA && versionB && versionA !== versionB) {
          return compareVersion(versionB, versionA)
        }
        if (versionA && !versionB) return -1
        if (!versionA && versionB) return 1
        const obtainA = a.obtain_type ?? Number.POSITIVE_INFINITY
        const obtainB = b.obtain_type ?? Number.POSITIVE_INFINITY
        if (obtainA !== obtainB) return obtainA - obtainB
        return a.id - b.id
      })

      const total = sortedOutfits.length
      const totalPages = total ? Math.ceil(total / pageSize) : 0
      const from = (page - 1) * pageSize
      const to = from + pageSize
      const pagedOutfits = sortedOutfits.slice(from, to)

      return {
        data: pagedOutfits.map(
          ({ styleKey: _styleKey, tagIds: _tagIds, ...outfit }) => outfit
        ),
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
      const quality = query.quality ? Number(query.quality) : 'all'
      const style = query.style?.toString() || 'all'
      const label = query.label?.toString() || 'all'
      const outfitVersion = query.version?.toString() || 'all'
      const source = query.source
        ? query.source.toString()
        : query.obtain
          ? query.obtain.toString()
          : 'all'
      return `${version}:outfits:p${page}:q${quality}:s${style}:l${label}:v${outfitVersion}:src${source}`
    },
    swr: true, // Enable stale-while-revalidate
  }
)
