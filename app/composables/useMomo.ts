export type MomoFilters = {
  quality?: number | null
  version?: string | null
  source?: string | number | null
  page?: number
  pageSize?: number
}

export const useMomo = () => {
  const { locale } = useI18n()
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const gameVersionHeader = { [GAME_VERSION_HEADER]: getGameVersion() }

  const fetchMomoById = async (id: number): Promise<MomoDetailEntry | null> => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch.raw<MomoDetailEntry>(`/api/momo/${id}`, {
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
            `Failed to fetch Momo ${id}`
          )
        )
      }

      return response._data ?? null
    } catch (e) {
      const normalizedError = toError(e, `Failed to fetch Momo ${id}`)
      error.value = normalizedError
      console.error(`Failed to fetch Momo ${id}: ${normalizedError.message}`)
      throw normalizedError
    } finally {
      loading.value = false
    }
  }

  const fetchMomoPaginated = async (
    filters: MomoFilters = {}
  ): Promise<PaginatedMomoResponse> => {
    loading.value = true
    error.value = null

    const {
      quality = null,
      version = null,
      source = null,
      page = 1,
      pageSize,
    } = filters

    try {
      const params: Record<string, string | number> = {
        page,
        lang: locale.value,
      }

      if (pageSize !== undefined && Number.isFinite(pageSize) && pageSize > 0) {
        params.pageSize = Math.floor(pageSize)
      }

      if (quality !== null && quality !== undefined) {
        params.quality = quality
      }

      if (version) {
        params.version = version
      }

      if (source !== null && source !== undefined) {
        params.source = source
      }

      return await $fetch<PaginatedMomoResponse>('/api/momo', {
        params,
        headers: gameVersionHeader,
      })
    } catch (e) {
      const normalizedError = toError(e, 'Failed to fetch Momo')
      error.value = normalizedError
      console.error(`Failed to fetch Momo: ${normalizedError.message}`)
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
    fetchMomoById,
    fetchMomoPaginated,
  }
}
