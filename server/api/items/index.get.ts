import { useSupabaseDataClient } from '~/composables/useSupabaseClient'
import { getGameVersion } from '~/utils/gameVersion'

/**
 * API endpoint for fetching paginated items
 * App-level caching enabled (24h), Netlify edge caching disabled via Cache-Control header
 */
export default defineCachedEventHandler(
  async (event) => {
    setResponseHeader(event, 'Cache-Control', 'no-store')
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
        .select('id, quality, type', { count: 'exact' })

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

      if (supabaseError) throw supabaseError

      const total = count || 0
      const totalPages = Math.ceil(total / pageSize)

      return {
        data: data || [],
        total,
        page,
        totalPages,
      }
    } catch (error) {
      console.error('Failed to fetch items:', error)
      throw createError({
        statusCode: 500,
        message: 'Failed to fetch items',
      })
    }
  },
  {
    maxAge: 60 * 60 * 24, // 24 hours
    name: 'items-list',
    getKey: (event) => {
      const query = getQuery(event)
      const version = getGameVersion()
      // Always use 50 for cache key since pageSize is hardcoded
      return `${version}:items:q${query.quality}:t${query.type}:p${query.page}:s50`
    },
    swr: true, // Enable stale-while-revalidate
  }
)
