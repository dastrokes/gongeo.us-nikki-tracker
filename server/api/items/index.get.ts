import { useSupabaseDataClient } from '~/composables/useSupabaseClient'
import { getGameVersion } from '~/utils/gameVersion'

/**
 * Edge-cached API endpoint for fetching paginated items
 * Cached at the edge for 24 hours to reduce DB egress
 * Data updates monthly with game updates
 */
export default defineCachedEventHandler(
  async (event) => {
    const query = getQuery(event)
    const quality = query.quality ? Number(query.quality) : null
    const type = query.type?.toString() || null
    const page = query.page ? Number(query.page) : 1
    const pageSize = query.pageSize ? Number(query.pageSize) : 40

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
        pageSize,
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
      return `${version}:items:q${query.quality}:t${query.type}:p${query.page}:s${query.pageSize}`
    },
    swr: true, // Enable stale-while-revalidate
  }
)
