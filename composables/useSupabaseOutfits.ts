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
   * Orders results by quality (descending) then by id
   * Note: Names are stored in i18n JSON files, not in the database
   * @returns Promise resolving to array of outfits
   */
  const fetchOutfits = async (): Promise<SupabaseOutfit[]> => {
    loading.value = true
    error.value = null

    try {
      const { data, error: supabaseError } = await supabase
        .from('outfits')
        .select('id, quality')
        .order('quality', { ascending: false })
        .order('id', { ascending: true })

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
   * Optionally fetches description from outfit_translations table
   * Note: Names are stored in i18n JSON files, not in the database
   * @param id - The outfit ID to fetch
   * @param languageCode - Optional language code for fetching description
   * @returns Promise resolving to outfit with items or null if not found
   */
  const fetchOutfitById = async (
    id: number,
    languageCode?: string
  ): Promise<OutfitWithItems | null> => {
    loading.value = true
    error.value = null

    try {
      let selectQuery = `
        id,
        quality,
        outfit_items (
          items (
            id,
            quality,
            type
          )
        )
      `

      // Add description from translations if language code is provided
      if (languageCode) {
        selectQuery = `
          id,
          quality,
          outfit_translations!left (
            description,
            language_code
          ),
          outfit_items (
            items (
              id,
              quality,
              type
            )
          )
        `
      }

      const { data, error: supabaseError } = await supabase
        .from('outfits')
        .select(selectQuery)
        .eq('id', id)
        .single()

      if (supabaseError) throw supabaseError

      // Extract description from translations if available
      if (data && languageCode) {
        const dataWithTranslations = data as OutfitWithItems & {
          outfit_translations?: Array<{
            description: string
            language_code: string
          }>
        }

        if (dataWithTranslations.outfit_translations) {
          const translations = dataWithTranslations.outfit_translations
          const translation = translations.find(
            (t) => t.language_code === languageCode
          )
          const enTranslation = translations.find(
            (t) => t.language_code === 'en'
          )

          // Add description to the main object
          const dataWithDescription = data as OutfitWithItems & {
            description?: string
          }
          dataWithDescription.description =
            translation?.description || enTranslation?.description || ''
          // Remove the translations array from the response
          delete dataWithTranslations.outfit_translations
        }
      }

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
   * Search outfits by name using client-side filtering
   * Note: Names are stored in i18n JSON files, search should be done client-side
   * This function is deprecated - use client-side search instead
   * @param _query - The search query string (unused, kept for API compatibility)
   * @returns Promise resolving to array of matching outfits
   */
  const searchOutfits = async (_query: string): Promise<SupabaseOutfit[]> => {
    loading.value = true
    error.value = null

    try {
      // Since names are not in the database, we can't search by name here
      // This should be handled client-side with i18n data
      console.warn(
        'searchOutfits is deprecated - names are stored in i18n files, use client-side search'
      )

      const { data, error: supabaseError } = await supabase
        .from('outfits')
        .select('id, quality')
        .order('quality', { ascending: false })
        .order('id', { ascending: true })

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
   * Note: Names are stored in i18n JSON files, not in the database
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
        .select('id, quality')
        .eq('quality', quality)
        .order('id', { ascending: true })

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
   * Fetch outfits with server-side filtering and pagination
   * Note: Names are stored in i18n JSON files, search should be done client-side
   * @param filters - Object containing search, quality, page, and pageSize
   * @returns Promise resolving to paginated response with data and metadata
   */
  const fetchOutfitsPaginated = async (
    filters: OutfitFilters = {}
  ): Promise<PaginatedOutfitsResponse> => {
    loading.value = true
    error.value = null

    const { quality = null, page = 1, pageSize = 20 } = filters

    try {
      // Build the query
      let query = supabase
        .from('outfits')
        .select('id, quality', { count: 'exact' })
        .order('quality', { ascending: false })
        .order('id', { ascending: true })

      // Note: Search by name is not supported here since names are in i18n files
      // Search should be done client-side after fetching the data

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
