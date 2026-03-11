import type { OutfitWithItems } from '~/types/supabase'
import type { OutfitListEntry } from '~/types/outfits'

export interface OutfitFilters {
  search?: string
  quality?: number | null
  style?: string | null
  label?: string | null
  version?: string | null
  source?: string | number | null
  page?: number
  pageSize?: number
}

export interface PaginatedOutfitsResponse {
  data: OutfitListEntry[]
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
      const response = await $fetch.raw<OutfitWithItems>(`/api/outfits/${id}`, {
        params: { lang: locale.value },
        ignoreResponseError: true,
      })

      if (isNotFoundResponse(response)) {
        return null
      }

      if (response.status >= 400) {
        throw new Error(
          getApiErrorMessage(
            response as { _data?: ApiErrorResponse },
            `Failed to fetch outfit ${id}`
          )
        )
      }

      return response._data ?? null
    } catch (e) {
      const normalizedError = toError(e, `Failed to fetch outfit ${id}`)
      error.value = normalizedError
      console.error(`Failed to fetch outfit ${id}: ${normalizedError.message}`)
      throw normalizedError
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

    const {
      quality = null,
      style = null,
      label = null,
      version = null,
      source = null,
      page = 1,
      pageSize,
    } = filters

    try {
      const params: Record<string, string | number> = {
        page,
      }

      if (pageSize !== undefined && Number.isFinite(pageSize) && pageSize > 0) {
        params.pageSize = Math.floor(pageSize)
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

      if (version) {
        params.version = version
      }

      if (source !== null && source !== undefined) {
        params.source = source
      }

      const result = await $fetch<PaginatedOutfitsResponse>('/api/outfits', {
        params,
        headers: gameVersionHeader,
      })

      return result
    } catch (e) {
      const normalizedError = toError(e, 'Failed to fetch outfits')
      error.value = normalizedError
      console.error(`Failed to fetch outfits: ${normalizedError.message}`)
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
