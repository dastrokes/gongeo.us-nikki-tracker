export interface OutfitFilters {
  search?: string
  quality?: number | null
  style?: string | null
  label?: string | null
  version?: string | null
  source?: string | number | null
  ids?: number[]
  page?: number
  pageSize?: number
}

/**
 * Composable for fetching and managing outfit data
 */
export const useSupabaseOutfits = () => {
  const { locale } = useI18n()
  const loading = ref(false)
  const error = ref<Error | null>(null)

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

  return {
    loading,
    error,
    fetchOutfitById,
  }
}
