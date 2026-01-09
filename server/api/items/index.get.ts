import { useSupabaseDataClient } from '~/composables/useSupabaseClient'
import { GAME_VERSION_HEADER, setCacheHeaders } from '~/utils/cacheHeaders'
import { getGameVersion } from '~/utils/gameVersion'

/**
 * API endpoint for fetching paginated items
 * App-level caching enabled (30d), Netlify edge caching enabled via Cache-Control header
 */
export default defineCachedEventHandler(
  async (event) => {
    setCacheHeaders(event, {
      varyQuery: ['page', 'quality', 'type'],
      varyHeaders: [GAME_VERSION_HEADER],
    })
    const query = getQuery(event)
    const quality = query.quality ? Number(query.quality) : null
    const type = query.type?.toString() || null
    const page = query.page ? Number(query.page) : 1
    const pageSize = 40

    const supabase = useSupabaseDataClient()

    try {
      // Build the query with only necessary fields
      let dbQuery = supabase
        .from('items')
        .select('id, quality', { count: 'exact' })

      // Apply quality filter
      if (quality !== null && quality !== undefined) {
        dbQuery = dbQuery.eq('quality', quality)
      }

      // Apply type filter
      if (type && type !== 'all') {
        dbQuery = dbQuery.eq('type', type)
      }

      // Apply sorting and pagination
      dbQuery = dbQuery
        .order('quality', { ascending: false })
        .order('id', { ascending: true })

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      dbQuery = dbQuery.range(from, to)

      const { data, error: supabaseError, count } = await dbQuery

      if (supabaseError) {
        const status = (supabaseError as { status?: number }).status
        const code = (supabaseError as { code?: string }).code
        const details = (supabaseError as { details?: string }).details
        const isRangeError =
          status === 416 ||
          code === 'PGRST103' ||
          (details && details.includes('Requested range not satisfiable'))

        if (isRangeError) {
          const total = count || 0
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

      const total = count || 0
      const totalPages = Math.ceil(total / pageSize)

      return {
        data: data || [],
        total,
        page,
        totalPages,
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }
      console.error('Failed to fetch items:', error)
      throw createError({
        statusCode: 500,
        message: 'Failed to fetch items',
      })
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
      return `${version}:items:p${page}:q${quality}:t${type}`
    },
    swr: true, // Enable stale-while-revalidate
  }
)
