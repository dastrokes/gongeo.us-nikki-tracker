import { GAME_VERSION_HEADER } from '~/utils/cacheHeaders'
import { getGameVersion } from '~/utils/gameVersion'
import type { ItemListEntry } from '~/types/items'
import type { ItemWithOutfits } from '~/types/supabase'
import { LOCALE_HEADER } from '~/utils/locale'

export interface ItemFilters {
  search?: string
  quality?: number | null
  type?: string | null
  style?: string | null
  label?: string | null
  page?: number
}

export interface PaginatedItemsResponse {
  data: ItemListEntry[]
  total: number
  page: number
  totalPages: number
}

/**
 * Composable for fetching and managing item data
 * Uses edge-cached API routes to reduce database egress
 */
export const useSupabaseItems = () => {
  const { locale } = useI18n()
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const gameVersionHeader = { [GAME_VERSION_HEADER]: getGameVersion() }

  /**
   * Fetch a single item by ID with its related outfits
   * Uses edge-cached API route (1 hour cache)
   * @param id - The item ID to fetch
   * @returns Promise resolving to item with outfits or null if not found
   */
  const fetchItemById = async (id: number): Promise<ItemWithOutfits | null> => {
    loading.value = true
    error.value = null

    try {
      const data = await $fetch<ItemWithOutfits>(`/api/items/${id}`, {
        headers: { [LOCALE_HEADER]: locale.value },
      })

      return data
    } catch (e) {
      error.value = e as Error
      console.error(`Failed to fetch item ${id}:`, e)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch items with server-side filtering and pagination
   * Uses edge-cached API route (15 minutes cache)
   * @param filters - Object containing search, quality, type, style, label, and page
   * @returns Promise resolving to paginated response with data and metadata
   */
  const fetchItemsPaginated = async (
    filters: ItemFilters = {}
  ): Promise<PaginatedItemsResponse> => {
    loading.value = true
    error.value = null

    const {
      quality = null,
      type = null,
      style = null,
      label = null,
      page = 1,
    } = filters

    try {
      const params: Record<string, string | number> = {
        page,
      }

      if (quality !== null && quality !== undefined) {
        params.quality = quality
      }

      if (type && type !== 'all') {
        params.type = type
      }

      if (style && style !== 'all') {
        params.style = style
      }

      if (label && label !== 'all') {
        params.label = label
      }

      const result = await $fetch<PaginatedItemsResponse>('/api/items', {
        params,
        headers: gameVersionHeader,
      })

      return result
    } catch (e) {
      error.value = e as Error
      console.error('Failed to fetch items:', e)
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
    fetchItemById,
    fetchItemsPaginated,
  }
}
