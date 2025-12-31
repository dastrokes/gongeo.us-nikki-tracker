import type { SupabaseItem, ItemWithOutfits } from '~/types/supabase'

export interface ItemFilters {
  search?: string
  quality?: number | null
  type?: string | null
  page?: number
  pageSize?: number
}

export interface PaginatedItemsResponse {
  data: SupabaseItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Composable for fetching and managing item data from Supabase
 * Provides methods for querying items with filtering and search capabilities
 */
export const useSupabaseItems = () => {
  const supabase = useSupabaseDataClient()
  const items = ref<SupabaseItem[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)

  /**
   * Fetch all items from the Supabase items table
   * Orders results by quality (descending) then by name
   * @returns Promise resolving to array of items
   */
  const fetchItems = async (): Promise<SupabaseItem[]> => {
    loading.value = true
    error.value = null

    try {
      const { data, error: supabaseError } = await supabase
        .from('items')
        .select('id, name, quality, type')
        .order('quality', { ascending: false })
        .order('name', { ascending: true })

      if (supabaseError) throw supabaseError

      items.value = data || []
      return data || []
    } catch (e) {
      error.value = e as Error
      console.error('Failed to fetch items:', e)
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch a single item by ID with its related outfits
   * Uses a join query to include related outfits from outfit_items table
   * @param id - The item ID to fetch
   * @returns Promise resolving to item with outfits or null if not found
   */
  const fetchItemById = async (id: number): Promise<ItemWithOutfits | null> => {
    loading.value = true
    error.value = null

    try {
      const { data, error: supabaseError } = await supabase
        .from('items')
        .select(
          `
          id,
          name,
          description,
          quality,
          outfit_items (
            outfits (
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

      return data as ItemWithOutfits | null
    } catch (e) {
      error.value = e as Error
      console.error(`Failed to fetch item ${id}:`, e)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Search items by name using fuzzy text matching
   * Uses case-insensitive substring matching
   * @param query - The search query string
   * @returns Promise resolving to array of matching items
   */
  const searchItems = async (query: string): Promise<SupabaseItem[]> => {
    loading.value = true
    error.value = null

    try {
      const { data, error: supabaseError } = await supabase
        .from('items')
        .select('id, name, quality, type')
        .ilike('name', `%${query}%`)
        .order('quality', { ascending: false })
        .order('name', { ascending: true })

      if (supabaseError) throw supabaseError

      items.value = data || []
      return data || []
    } catch (e) {
      error.value = e as Error
      console.error('Failed to search items:', e)
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Filter items by quality level
   * @param quality - The quality level to filter by (e.g., 3, 4, 5)
   * @returns Promise resolving to array of items matching the quality
   */
  const filterByQuality = async (quality: number): Promise<SupabaseItem[]> => {
    loading.value = true
    error.value = null

    try {
      const { data, error: supabaseError } = await supabase
        .from('items')
        .select('id, name, quality, type')
        .eq('quality', quality)
        .order('name', { ascending: true })

      if (supabaseError) throw supabaseError

      items.value = data || []
      return data || []
    } catch (e) {
      error.value = e as Error
      console.error('Failed to filter items by quality:', e)
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch items with server-side filtering, search, and pagination
   * Includes automatic retry with exponential backoff
   * @param filters - Object containing search, quality, type, page, and pageSize
   * @returns Promise resolving to paginated response with data and metadata
   */
  const fetchItemsPaginated = async (
    filters: ItemFilters = {}
  ): Promise<PaginatedItemsResponse> => {
    loading.value = true
    error.value = null

    const {
      search = '',
      quality = null,
      type = null,
      page = 1,
      pageSize = 40,
    } = filters

    try {
      // Build the query
      let query = supabase
        .from('items')
        .select('id, name, quality, type', { count: 'exact' })
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

      // Apply type filter - simple equality check!
      if (type && type !== 'all') {
        query = query.eq('type', type)
      }

      // Apply pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error: supabaseError, count } = await query

      if (supabaseError) throw supabaseError

      const total = count || 0
      const totalPages = Math.ceil(total / pageSize)

      items.value = data || []

      return {
        data: data || [],
        total,
        page,
        pageSize,
        totalPages,
      }
    } catch (e) {
      error.value = e as Error
      console.error('Failed to fetch items:', e)
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
    items,
    loading,
    error,
    fetchItems,
    fetchItemById,
    searchItems,
    filterByQuality,
    fetchItemsPaginated,
  }
}
