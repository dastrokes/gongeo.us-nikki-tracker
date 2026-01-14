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

type OutfitRow = {
  id: number
  quality: number
  props: Array<number | string> | null
  tags: Array<number | string> | null
  outfit_items?: Array<{
    items?: {
      props: Array<number | string> | null
      tags: Array<number | string> | null
    } | null
  }>
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
      varyQuery: ['page', 'quality', 'style', 'label'],
      varyHeaders: [GAME_VERSION_HEADER],
    })
    const query = getQuery(event)
    const quality = query.quality ? Number(query.quality) : null
    const styleParam = query.style?.toString() || null
    const labelParam = query.label?.toString() || null
    const page = query.page ? Number(query.page) : 1
    const pageSize = 18
    const normalizedStyle = styleParam ? normalizeTraitKey(styleParam) : null
    const normalizedLabel = labelParam ? normalizeTraitKey(labelParam) : null
    const styleFilter = normalizedStyle
      ? STYLE_BY_KEY.get(normalizedStyle)
      : null
    const labelFilter = normalizedLabel ? TAG_BY_KEY.get(normalizedLabel) : null

    if ((styleParam && !styleFilter) || (labelParam && !labelFilter)) {
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
      const selectFields =
        styleFilter || labelFilter
          ? 'id, quality, props, tags, outfit_items(items(props,tags))'
          : 'id, quality, props, tags'

      let dbQuery = supabase
        .from('outfits')
        .select(selectFields, { count: 'exact' })
        .gte('id', BASE_OUTFIT_ID_MIN)
        .lte('id', BASE_OUTFIT_ID_MAX)

      // Apply quality filter
      if (quality !== null && quality !== undefined) {
        dbQuery = dbQuery.eq('quality', quality)
      }

      // Apply sorting and pagination
      dbQuery = dbQuery
        .order('quality', { ascending: false })
        .order('id', { ascending: true })

      const shouldPaginateInDb = !styleFilter && !labelFilter
      if (shouldPaginateInDb) {
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1
        dbQuery = dbQuery.range(from, to)
      }

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

            if (quality !== null && quality !== undefined) {
              countQuery = countQuery.eq('quality', quality)
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
      const filteredOutfits = rows.filter((outfit) => {
        if (!styleFilter && !labelFilter) return true

        let matchesStyle = !styleFilter
        let matchesLabel = !labelFilter

        for (const entry of outfit.outfit_items || []) {
          const item = entry.items
          if (!item) continue

          if (!matchesStyle && styleFilter) {
            const styleKey = resolveStyleKeyFromProps(item.props)
            if (styleKey === styleFilter.key) {
              matchesStyle = true
            }
          }

          if (!matchesLabel && labelFilter) {
            const tagIds = (item.tags || [])
              .map((value: number | string) => Number(value))
              .filter((value: number) => !Number.isNaN(value))
            if (tagIds.includes(labelFilter.id)) {
              matchesLabel = true
            }
          }

          if (matchesStyle && matchesLabel) {
            return true
          }
        }

        return matchesStyle && matchesLabel
      })

      const total =
        styleFilter || labelFilter ? filteredOutfits.length : count || 0
      const totalPages = total ? Math.ceil(total / pageSize) : 0
      const from = (page - 1) * pageSize
      const to = from + pageSize
      const pagedOutfits =
        styleFilter || labelFilter
          ? filteredOutfits.slice(from, to)
          : filteredOutfits

      return {
        data: pagedOutfits.map(({ id, quality, props, tags }) => {
          const styleKey = resolveStyleKeyFromProps(props)
          const styleI18nKey = styleKey
            ? (STYLE_BY_KEY.get(styleKey)?.i18nKey ?? null)
            : null
          const labelI18nKeys = resolveTagI18nKeys(tags) || []
          return {
            id,
            quality,
            style: styleI18nKey,
            labels: labelI18nKeys,
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
      const quality = query.quality ? Number(query.quality) : 'all'
      const style = query.style?.toString() || 'all'
      const label = query.label?.toString() || 'all'
      return `${version}:outfits:p${page}:q${quality}:s${style}:l${label}`
    },
    swr: true, // Enable stale-while-revalidate
  }
)
