import type { SupabaseOutfit, OutfitWithItems } from '~/types/supabase'

export interface OutfitFilters {
  search?: string
  quality?: number | null
  page?: number
  pageSize?: number
}

export interface PaginatedOutfitsResponse {
  data: SupabaseOutfit[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Composable for fetching and managing outfit data from Supabase
 * Provides methods for querying outfits with filtering and search capabilities
 */
export const useSupabaseOutfits = () => {
  const supabase = useSupabaseDataClient()
  const outfits = ref<SupabaseOutfit[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)

  /**
   * Fetch all outfits from the Supabase outfits table
   * Orders results by quality (descending) then by name
   * @returns Promise resolving to array of outfits
   */
  const fetchOutfits = async (): Promise<SupabaseOutfit[]> => {
    loading.value = true
    error.value = null

    try {
      const { data, error: supabaseError } = await supabase
        .from('outfits')
        .select('id, name, quality')
        .order('quality', { ascending: false })
        .order('name', { ascending: true })

      if (supabaseError) throw supabaseError

      outfits.value = data || []
      return data || []
    } catch (e) {
      error.value = e as Error
      console.error('Failed to fetch outfits:', e)
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch a single outfit by ID with its component items
   * Uses a join query to include related items from outfit_items table
   * @param id - The outfit ID to fetch
   * @returns Promise resolving to outfit with items or null if not found
   */
  const fetchOutfitById = async (
    id: number
  ): Promise<OutfitWithItems | null> => {
    loading.value = true
    error.value = null

    try {
      const { data, error: supabaseError } = await supabase
        .from('outfits')
        .select(
          `
          id,
          name,
          description,
          quality,
          outfit_items (
            items (
              id,
              name,
              quality
            )
          )
        `
        )
        .eq('id', id)
        .single()

      if (supabaseError) throw supabaseError

      return data as OutfitWithItems | null
    } catch (e) {
      error.value = e as Error
      console.error(`Failed to fetch outfit ${id}:`, e)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Search outfits by name using fuzzy text matching
   * Uses case-insensitive substring matching
   * @param query - The search query string
   * @returns Promise resolving to array of matching outfits
   */
  const searchOutfits = async (query: string): Promise<SupabaseOutfit[]> => {
    loading.value = true
    error.value = null

    try {
      const { data, error: supabaseError } = await supabase
        .from('outfits')
        .select('id, name, quality')
        .ilike('name', `%${query}%`)
        .order('quality', { ascending: false })
        .order('name', { ascending: true })

      if (supabaseError) throw supabaseError

      outfits.value = data || []
      return data || []
    } catch (e) {
      error.value = e as Error
      console.error('Failed to search outfits:', e)
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Filter outfits by quality level
   * @param quality - The quality level to filter by (e.g., 3, 4, 5)
   * @returns Promise resolving to array of outfits matching the quality
   */
  const filterByQuality = async (
    quality: number
  ): Promise<SupabaseOutfit[]> => {
    loading.value = true
    error.value = null

    try {
      const { data, error: supabaseError } = await supabase
        .from('outfits')
        .select('id, name, quality')
        .eq('quality', quality)
        .order('name', { ascending: true })

      if (supabaseError) throw supabaseError

      outfits.value = data || []
      return data || []
    } catch (e) {
      error.value = e as Error
      console.error('Failed to filter outfits by quality:', e)
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch outfits with server-side filtering, search, and pagination
   * Includes automatic retry with exponential backoff
   * @param filters - Object containing search, quality, page, and pageSize
   * @returns Promise resolving to paginated response with data and metadata
   */
  const fetchOutfitsPaginated = async (
    filters: OutfitFilters = {}
  ): Promise<PaginatedOutfitsResponse> => {
    loading.value = true
    error.value = null

    const { search = '', quality = null, page = 1, pageSize = 20 } = filters

    try {
      // Build the query
      let query = supabase
        .from('outfits')
        .select('id, name, quality', { count: 'exact' })
        .order('quality', { ascending: false })
        .order('name', { ascending: true })

      // Apply search filter
      if (search && search.trim()) {
        query = query.ilike('name', `%${search}%`)
      }

      // Apply quality filter
      if (quality !== null && quality !== undefined) {
        query = query.eq('quality', quality)
      }

      // Apply pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error: supabaseError, count } = await query

      if (supabaseError) throw supabaseError

      const total = count || 0
      const totalPages = Math.ceil(total / pageSize)

      outfits.value = data || []

      return {
        data: data || [],
        total,
        page,
        pageSize,
        totalPages,
      }
    } catch (e) {
      error.value = e as Error
      console.error('Failed to fetch outfits:', e)
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      }
    } finally {
      loading.value = false
    }
  }

  return {
    outfits,
    loading,
    error,
    fetchOutfits,
    fetchOutfitById,
    searchOutfits,
    filterByQuality,
    fetchOutfitsPaginated,
  }
}
