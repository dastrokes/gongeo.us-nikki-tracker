import { GAME_VERSION_HEADER } from '~/utils/cacheHeaders'
import { getGameVersion } from '~/utils/gameVersion'
import type { SupabaseOutfit, OutfitWithItems } from '~/types/supabase'
import { LOCALE_HEADER } from '~/utils/locale'

export interface OutfitFilters {
  search?: string
  quality?: number | null
  style?: string | null
  label?: string | null
  page?: number
}

export interface PaginatedOutfitsResponse {
  data: SupabaseOutfit[]
  total: number
  page: number
  totalPages: number
}

/**
 * Composable for fetching and managing outfit data
 * Uses edge-cached API routes to reduce database egress
 */
export const useSupabaseOutfits = () => {
  const { locale } = useI18n()
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const gameVersionHeader = { [GAME_VERSION_HEADER]: getGameVersion() }

  /**
   * Fetch a single outfit by ID with its component items
   * Uses edge-cached API route (1 hour cache)
   * @param id - The outfit ID to fetch
   * @returns Promise resolving to outfit with items or null if not found
   */
  const fetchOutfitById = async (
    id: number
  ): Promise<OutfitWithItems | null> => {
    loading.value = true
    error.value = null

    try {
      const data = await $fetch<OutfitWithItems>(`/api/outfits/${id}`, {
        headers: { [LOCALE_HEADER]: locale.value },
      })

      return data
    } catch (e) {
      error.value = e as Error
      console.error(`Failed to fetch outfit ${id}:`, e)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch outfits with server-side filtering and pagination
   * Uses edge-cached API route (15 minutes cache)
   * @param filters - Object containing search, quality, and page
   * @returns Promise resolving to paginated response with data and metadata
   */
  const fetchOutfitsPaginated = async (
    filters: OutfitFilters = {}
  ): Promise<PaginatedOutfitsResponse> => {
    loading.value = true
    error.value = null

    const { quality = null, style = null, label = null, page = 1 } = filters

    try {
      const params: Record<string, string | number> = {
        page,
      }

      if (quality !== null && quality !== undefined) {
        params.quality = quality
      }

      if (style && style !== 'all') {
        params.style = style
      }

      if (label && label !== 'all') {
        params.label = label
      }

      const result = await $fetch<PaginatedOutfitsResponse>('/api/outfits', {
        params,
        headers: gameVersionHeader,
      })

      return result
    } catch (e) {
      error.value = e as Error
      console.error('Failed to fetch outfits:', e)
      return {
        data: [],
        total: 0,
        page,
        totalPages: 0,
      }
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchOutfitById,
    fetchOutfitsPaginated,
  }
}
