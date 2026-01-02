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
   * Orders results by quality (descending) then by id
   * Note: Names are stored in i18n JSON files, not in the database
   * @returns Promise resolving to array of items
   */
  const fetchItems = async (): Promise<SupabaseItem[]> => {
    loading.value = true
    error.value = null

    try {
      const { data, error: supabaseError } = await supabase
        .from('items')
        .select('id, quality, type')
        .order('quality', { ascending: false })
        .order('id', { ascending: true })

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
   * Optionally fetches description from item_translations table
   * Note: Names are stored in i18n JSON files, not in the database
   * @param id - The item ID to fetch
   * @param languageCode - Optional language code for fetching description
   * @returns Promise resolving to item with outfits or null if not found
   */
  const fetchItemById = async (
    id: number,
    languageCode?: string
  ): Promise<ItemWithOutfits | null> => {
    loading.value = true
    error.value = null

    try {
      let selectQuery = `
        id,
        quality,
        type,
        outfit_items (
          outfits (
            id,
            quality
          )
        )
      `

      // Add description from translations if language code is provided
      if (languageCode) {
        selectQuery = `
          id,
          quality,
          type,
          item_translations!left (
            description,
            language_code
          ),
          outfit_items (
            outfits (
              id,
              quality
            )
          )
        `
      }

      const { data, error: supabaseError } = await supabase
        .from('items')
        .select(selectQuery)
        .eq('id', id)
        .single()

      if (supabaseError) throw supabaseError

      // Extract description from translations if available
      if (data && languageCode) {
        const dataWithTranslations = data as ItemWithOutfits & {
          item_translations?: Array<{
            description: string
            language_code: string
          }>
        }

        if (dataWithTranslations.item_translations) {
          const translations = dataWithTranslations.item_translations
          const translation = translations.find(
            (t) => t.language_code === languageCode
          )
          const enTranslation = translations.find(
            (t) => t.language_code === 'en'
          )

          // Add description to the main object
          const dataWithDescription = data as ItemWithOutfits & {
            description?: string
          }
          dataWithDescription.description =
            translation?.description || enTranslation?.description || ''
          // Remove the translations array from the response
          delete dataWithTranslations.item_translations
        }
      }

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
   * Search items by name using client-side filtering
   * Note: Names are stored in i18n JSON files, search should be done client-side
   * This function is deprecated - use client-side search instead
   * @param _query - The search query string (unused, kept for API compatibility)
   * @returns Promise resolving to array of matching items
   */
  const searchItems = async (_query: string): Promise<SupabaseItem[]> => {
    loading.value = true
    error.value = null

    try {
      // Since names are not in the database, we can't search by name here
      // This should be handled client-side with i18n data
      console.warn(
        'searchItems is deprecated - names are stored in i18n files, use client-side search'
      )

      const { data, error: supabaseError } = await supabase
        .from('items')
        .select('id, quality, type')
        .order('quality', { ascending: false })
        .order('id', { ascending: true })

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
   * Note: Names are stored in i18n JSON files, not in the database
   * @param quality - The quality level to filter by (e.g., 3, 4, 5)
   * @returns Promise resolving to array of items matching the quality
   */
  const filterByQuality = async (quality: number): Promise<SupabaseItem[]> => {
    loading.value = true
    error.value = null

    try {
      const { data, error: supabaseError } = await supabase
        .from('items')
        .select('id, quality, type')
        .eq('quality', quality)
        .order('id', { ascending: true })

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
   * Fetch items with server-side filtering and pagination
   * Note: Names are stored in i18n JSON files, search should be done client-side
   * @param filters - Object containing search, quality, type, page, and pageSize
   * @returns Promise resolving to paginated response with data and metadata
   */
  const fetchItemsPaginated = async (
    filters: ItemFilters = {}
  ): Promise<PaginatedItemsResponse> => {
    loading.value = true
    error.value = null

    const { quality = null, type = null, page = 1, pageSize = 40 } = filters

    try {
      // Build the query
      let query = supabase
        .from('items')
        .select('id, quality, type', { count: 'exact' })
        .order('quality', { ascending: false })
        .order('id', { ascending: true })

      // Note: Search by name is not supported here since names are in i18n files
      // Search should be done client-side after fetching the data

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
