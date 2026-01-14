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
  STYLE_BY_KEY,
  TAG_BY_KEY,
} from '~/utils/itemInfo'
import {
  isTransientSupabaseError,
  withSupabaseRetry,
} from '~/utils/supabaseRetry'

type ItemRow = {
  id: number
  quality: number
  type: string
  props: Array<number | string> | null
  tags: Array<number | string> | null
}

const BASE_ITEM_PREFIX_RANGES = [
  [1020000000, 1020999999],
  [1021000000, 1021999999],
  [1026000000, 1026999999],
  [1027000000, 1027999999],
  [1028000000, 1028999999],
  [1029000000, 1029999999],
] as const

/**
 * API endpoint for fetching paginated items
 * App-level caching enabled (30d), Netlify edge caching enabled via Cache-Control header
 */
export default defineCachedEventHandler(
  async (event) => {
    setCacheHeaders(event, {
      varyQuery: ['page', 'quality', 'type', 'style', 'label'],
      varyHeaders: [GAME_VERSION_HEADER],
    })
    const query = getQuery(event)
    const quality = query.quality ? Number(query.quality) : null
    const type = query.type?.toString() || null
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
      // Build the query with only necessary fields
      const baseItemRangeFilters = BASE_ITEM_PREFIX_RANGES.map(
        ([min, max]) => `and(id.gte.${min},id.lte.${max})`
      ).join(',')

      let dbQuery = supabase
        .from('items')
        .select('id, quality, type, props, tags', { count: 'exact' })
        .or(baseItemRangeFilters)

      // Apply quality filter
      if (quality !== null && quality !== undefined) {
        dbQuery = dbQuery.eq('quality', quality)
      }

      // Apply type filter
      if (type && type !== 'all') {
        dbQuery = dbQuery.eq('type', type)
      }

      if (labelFilter) {
        dbQuery = dbQuery.contains('tags', [labelFilter.id])
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
            const baseItemCountFilters = BASE_ITEM_PREFIX_RANGES.map(
              ([min, max]) => `and(id.gte.${min},id.lte.${max})`
            ).join(',')

            let countQuery = supabase
              .from('items')
              .select('id', { count: 'exact', head: true })
              .or(baseItemCountFilters)

            if (quality !== null && quality !== undefined) {
              countQuery = countQuery.eq('quality', quality)
            }

            if (type && type !== 'all') {
              countQuery = countQuery.eq('type', type)
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

      const rows = (data as ItemRow[] | null) ?? []
      const items = rows.map((item) => {
        const styleKey = resolveStyleKeyFromProps(item.props)
        const tagIds = (item.tags || [])
          .map((value: number | string) => Number(value))
          .filter((value: number) => !Number.isNaN(value))
        return {
          id: item.id,
          quality: item.quality,
          type: item.type,
          style: styleKey,
          tags: tagIds.map((tagId) => tagId.toString()),
          styleKey,
          tagIds,
        }
      })

      let filteredItems = items
      if (styleFilter) {
        filteredItems = filteredItems.filter(
          (item) => item.styleKey === styleFilter.key
        )
      }

      if (labelFilter) {
        filteredItems = filteredItems.filter((item) =>
          item.tagIds.includes(labelFilter.id)
        )
      }

      const total =
        styleFilter || labelFilter ? filteredItems.length : count || 0
      const totalPages = total ? Math.ceil(total / pageSize) : 0
      const from = (page - 1) * pageSize
      const to = from + pageSize
      const pagedItems =
        styleFilter || labelFilter
          ? filteredItems.slice(from, to)
          : filteredItems

      return {
        data: pagedItems.map(
          ({ styleKey: _styleKey, tagIds: _tagIds, ...item }) => item
        ),
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
      const quality = query.quality ? Number(query.quality) : 'all'
      const type = query.type?.toString() || 'all'
      const style = query.style?.toString() || 'all'
      const label = query.label?.toString() || 'all'
      return `${version}:items:p${page}:q${quality}:t${type}:s${style}:l${label}`
    },
    swr: true, // Enable stale-while-revalidate
  }
)
