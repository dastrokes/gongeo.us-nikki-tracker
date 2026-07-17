export const useMomo = () => {
  const { locale } = useI18n()
  const catalogIndex = useCatalogIndex()
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const fetchMomoById = async (id: number): Promise<MomoDetailEntry | null> => {
    loading.value = true
    error.value = null

    try {
      const [response] = await Promise.all([
        $fetch.raw<MomoDetailApiResponse>(`/api/momo/${id}`, {
          params: { lang: locale.value },
          ignoreResponseError: true,
        }),
        catalogIndex.load(['momo', 'outfits', 'momoOutfits']),
      ])

      if (isNotFoundResponse(response)) {
        return null
      }

      if (response.status >= 400) {
        throw new Error(
          getApiErrorMessage(
            response as { _data?: ApiErrorResponse },
            `Failed to fetch Momo ${id}`
          )
        )
      }

      const detail = response._data
      const index = catalogIndex.index.value
      const catalogMomo = index?.momoById.get(id)
      if (!detail || !index || !catalogMomo) {
        throw new Error(`Catalog Momo ${id} is unavailable`)
      }

      return {
        ...catalogMomo,
        name: detail.name,
        description: detail.description,
        related_outfits: (index.outfitIdsByMomoId.get(id) ?? []).flatMap(
          (outfitId) => {
            const outfit = index.outfitById.get(outfitId)
            return outfit ? [{ id: outfit.id, quality: outfit.quality }] : []
          }
        ),
      }
    } catch (e) {
      const normalizedError = toError(e, `Failed to fetch Momo ${id}`)
      error.value = normalizedError
      console.error(`Failed to fetch Momo ${id}: ${normalizedError.message}`)
      throw normalizedError
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchMomoById,
  }
}
