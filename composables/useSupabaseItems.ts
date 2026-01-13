import { GAME_VERSION_HEADER } from '~/utils/cacheHeaders'
import { getGameVersion } from '~/utils/gameVersion'
import type { ItemListEntry } from '~/types/items'
import type { ItemWithOutfits } from '~/types/supabase'
import { LOCALE_HEADER } from '~/utils/locale'
import { getApiErrorMessage, isNotFoundResponse } from '~/utils/apiFetch'
import { toError } from '~/utils/errors'

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
      const response = await $fetch.raw<ItemWithOutfits>(`/api/items/${id}`, {
        headers: { [LOCALE_HEADER]: locale.value },
        ignoreResponseError: true,
      })

      if (isNotFoundResponse(response)) {
        return null
      }

      if (response.status >= 400) {
        throw new Error(
          getApiErrorMessage(
            response as { _data?: ApiErrorResponse },
            `Failed to fetch item ${id}`
          )
        )
      }

      return response._data ?? null
    } catch (e) {
      const normalizedError = toError(e, `Failed to fetch item ${id}`)
      error.value = normalizedError
      console.error(`Failed to fetch item ${id}:`, normalizedError)
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
      const normalizedError = toError(e, 'Failed to fetch items')
      error.value = normalizedError
      console.error('Failed to fetch items:', normalizedError)
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
