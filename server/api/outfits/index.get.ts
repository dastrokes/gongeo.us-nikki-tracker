import { useSupabaseDataClient } from '~/composables/useSupabaseClient'
import { getGameVersion } from '~/utils/gameVersion'

/**
 * API endpoint for fetching paginated outfits
 * App-level caching enabled (30d), Netlify edge caching enabled via Cache-Control header
 */
export default defineCachedEventHandler(
  async (event) => {
    const version = getGameVersion()
    setResponseHeader(
      event,
      'Cache-Control',
      'public, max-age=0, s-maxage=2592000, stale-while-revalidate=86400'
    )
    setResponseHeader(event, 'Netlify-Vary', 'query=page,quality')
    setResponseHeader(event, 'X-Data-Version', version)
    const query = getQuery(event)
    const quality = query.quality ? Number(query.quality) : null
    const page = query.page ? Number(query.page) : 1
    const pageSize = 40

    const supabase = useSupabaseDataClient()

    try {
      // Build the query with only necessary fields
      let dbQuery = supabase
        .from('outfits')
        .select('id, quality', { count: 'exact' })

      // Apply quality filter
      if (quality !== null && quality !== undefined) {
        dbQuery = dbQuery.eq('quality', quality)
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
      console.error('Failed to fetch outfits:', error)
      throw createError({
        statusCode: 500,
        message: 'Failed to fetch outfits',
      })
    }
  },
  {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    name: 'outfits-list',
    getKey: (event) => {
      const version = getGameVersion()
      const query = getQuery(event)
      const page = query.page ? Number(query.page) : 1
      const quality = query.quality ? Number(query.quality) : 'all'
      return `${version}:outfits:p${page}:q${quality}`
    },
    swr: true, // Enable stale-while-revalidate
  }
)
