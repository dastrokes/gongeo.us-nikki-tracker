export const useMomo = () => {
  const { locale } = useI18n()
  const loading = ref(false)
  const error = ref<Error | null>(null)

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

  return {
    loading,
    error,
    fetchMomoById,
  }
}
