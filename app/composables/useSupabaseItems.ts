import type {
  ItemSearchAdvancedField,
  ItemSearchAdvancedFilterValue,
  ItemSearchFacetResponse,
} from '#shared/types/itemSearch'

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
  page?: number
  pageSize?: number
} & Partial<Record<ItemSearchAdvancedField, ItemSearchAdvancedFilterValue>>

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
      category = null,
      subcategory = null,
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

      if (type && type !== 'all') {
        params.type = type
      }

      if (category) {
        params.category = category
      }

      if (subcategory) {
        params.subcategory = subcategory
      }

      appendAdvancedFilterParams(params, filters, type, {
        includeArrayFields: true,
      })

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

      const result = await $fetch<PaginatedItemsResponse>('/api/items', {
        params,
        headers: gameVersionHeader,
      })

      return result
    } catch (e) {
      const normalizedError = toError(e, 'Failed to fetch items')
      error.value = normalizedError
      console.error(`Failed to fetch items: ${normalizedError.message}`)
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

      if (quality !== null && quality !== undefined) {
        params.quality = quality
      }

      if (type && type !== 'all') {
        params.type = type
      }

      if (category) {
        params.category = category
      }

      if (subcategory) {
        params.subcategory = subcategory
      }

      appendAdvancedFilterParams(params, filters, type)

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
    fetchItemsPaginated,
    fetchItemSearchFacets,
  }
}
