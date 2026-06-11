export type ItemFilters = {
  search?: string
  quality?: number | null
  type?: string | null
  category?: string | null
  subcategory?: string | null
  style?: string | null
  label?: string | null
  version?: string | null
  source?: string | number | null
  ids?: number[]
  page?: number
  pageSize?: number
} & Partial<Record<ItemSearchAdvancedField, ItemSearchAdvancedFilterValue>>

/**
 * Composable for fetching and managing item data
 */
export const useSupabaseItems = () => {
  const { locale } = useI18n()
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const gameVersionHeader = { [GAME_VERSION_HEADER]: getGameVersion() }
  const appendCanonicalFilterParam = (
    params: Record<string, string | number>,
    key: 'category' | 'subcategory' | 'style' | 'label' | 'version' | 'source',
    value: string | number | null | undefined
  ) => {
    if (value === null || value === undefined || value === '') return
    if (value === 'all') return

    params[key] = value
  }

  const appendCanonicalQualityParam = (
    params: Record<string, string | number>,
    quality: number | null | undefined
  ) => {
    if (quality === null || quality === undefined) return

    params.quality = quality
  }

  const appendCanonicalTypeParam = (
    params: Record<string, string | number>,
    type: string | null | undefined
  ) => {
    if (!type || type === 'all') return

    params.type = type
  }

  const appendAdvancedFilterParams = (
    params: Record<string, string | number>,
    filters: ItemFilters,
    type?: string | null,
    options: { includeArrayFields?: boolean } = {}
  ) => {
    Object.assign(
      params,
      buildItemSearchAdvancedFilterQuery(
        filters,
        type,
        options.includeArrayFields
          ? getItemSearchCompendiumAdvancedFields(type)
          : getItemSearchAdvancedScalarFields(type)
      )
    )
  }

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
        params: {
          lang: locale.value,
        },
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
      console.error(`Failed to fetch item ${id}: ${normalizedError.message}`)
      throw normalizedError
    } finally {
      loading.value = false
    }
  }

  const fetchMakeupById = async (
    id: number
  ): Promise<MakeupWithRelations | null> => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch.raw<MakeupWithRelations>(
        `/api/makeups/${id}`,
        {
          params: {
            lang: locale.value,
          },
          ignoreResponseError: true,
        }
      )

      if (isNotFoundResponse(response)) {
        return null
      }

      if (response.status >= 400) {
        throw new Error(
          getApiErrorMessage(
            response as { _data?: ApiErrorResponse },
            `Failed to fetch makeup ${id}`
          )
        )
      }

      return response._data ?? null
    } catch (e) {
      const normalizedError = toError(e, `Failed to fetch makeup ${id}`)
      error.value = normalizedError
      console.error(`Failed to fetch makeup ${id}: ${normalizedError.message}`)
      throw normalizedError
    } finally {
      loading.value = false
    }
  }

  const fetchItemSearchFacets = async (
    filters: ItemFilters = {}
  ): Promise<ItemSearchFacetResponse> => {
    loading.value = true
    error.value = null

    const {
      quality = null,
      type = null,
      category = null,
      subcategory = null,
      style = null,
      label = null,
      version = null,
      source = null,
    } = filters

    try {
      const params: Record<string, string | number> = {}

      appendCanonicalQualityParam(params, quality)

      appendCanonicalTypeParam(params, type)

      appendCanonicalFilterParam(params, 'category', category)

      appendCanonicalFilterParam(params, 'subcategory', subcategory)

      appendAdvancedFilterParams(params, filters, type)

      appendCanonicalFilterParam(params, 'style', style)

      appendCanonicalFilterParam(params, 'label', label)

      appendCanonicalFilterParam(params, 'version', version)

      appendCanonicalFilterParam(params, 'source', source)

      return await $fetch<ItemSearchFacetResponse>('/api/items/facets', {
        params,
        headers: gameVersionHeader,
      })
    } catch (e) {
      const normalizedError = toError(e, 'Failed to fetch item facets')
      error.value = normalizedError
      console.error(`Failed to fetch item facets: ${normalizedError.message}`)
      return {
        categories: [],
        subcategories: [],
        advanced: {},
      }
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchItemById,
    fetchMakeupById,
    fetchItemSearchFacets,
  }
}
