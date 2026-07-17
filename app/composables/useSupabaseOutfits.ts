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
  const catalogIndex = useCatalogIndex()
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
      const [response] = await Promise.all([
        $fetch.raw<OutfitDetailApiResponse>(`/api/outfits/${id}`, {
          params: {
            lang: locale.value,
          },
          ignoreResponseError: true,
        }),
        catalogIndex.load([
          'items',
          'outfits',
          'makeups',
          'makeupItems',
          'makeupOutfits',
        ]),
      ])

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

      const detail = response._data
      const index = catalogIndex.index.value
      const catalogOutfit = index?.outfitById.get(id)
      if (!detail || !index || !catalogOutfit) {
        throw new Error(`Catalog outfit ${id} is unavailable`)
      }

      return {
        ...toSupabaseOutfit(catalogOutfit),
        props: detail.props,
        description: detail.description,
        outfit_items: detail.item_ids.flatMap((itemId) => {
          const item = index.itemById.get(itemId)
          return item ? [{ items: toSupabaseItem(item) }] : []
        }),
        makeup_outfits: (index.fullMakeupIdsByOutfitId.get(id) ?? []).flatMap(
          (fullMakeupId) => {
            const fullMakeup = index.makeupById.get(fullMakeupId)
            if (!fullMakeup) return []

            const components = sortItemsByCategory(
              (index.makeupItemsById.get(fullMakeupId) ?? []).flatMap(
                (componentId) => {
                  const component = index.makeupById.get(componentId)
                  return component ? [toSupabaseMakeup(component)] : []
                }
              )
            )

            return [
              {
                makeups: {
                  ...toSupabaseMakeup(fullMakeup),
                  components,
                },
              },
            ]
          }
        ),
      }
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
