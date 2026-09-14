type MakeupTranslation = {
  description?: string | null
  language_code?: string | null
}

type MakeupData = {
  id: number
  makeup_translations?: MakeupTranslation[] | null
}

export default defineCachedApiEventHandler(
  async (event) => {
    const id = Number(getRouterParam(event, 'id'))
    const languageCode = resolveRequestLocale(event) || 'en'

    if (!id || Number.isNaN(id)) {
      throw createInvalidIdError('makeup')
    }

    const supabase = useSupabaseDataClient()

    try {
      const translationCodes = Array.from(new Set([languageCode, 'en']))
      const { data, error } = await withSupabaseRetry(() =>
        supabase
          .from('makeups')
          .select('id,makeup_translations(description,language_code)')
          .eq('id', id)
          .in('makeup_translations.language_code', translationCodes)
          .single()
      )

      if (error) {
        if (error.code === 'PGRST116') {
          throw createNotFoundError('makeup')
        }
        throw error
      }

      const makeup = data as MakeupData
      const translations = makeup.makeup_translations ?? []
      const translation = translations.find(
        (row) => row.language_code === languageCode
      )
      const enTranslation = translations.find(
        (row) => row.language_code === 'en'
      )

      return {
        id: makeup.id,
        description:
          translation?.description || enTranslation?.description || '',
      } satisfies MakeupDetailApiResponse
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }
      const message = toErrorMessage(error, `Failed to fetch makeup ${id}`)
      if (isTransientSupabaseError(error)) {
        console.warn(`Failed to fetch makeup ${id}: ${message}`)
        throw createUpstreamUnavailableError('makeup')
      }
      console.error(`Failed to fetch makeup ${id}: ${message}`)
      throw createInternalError('makeup')
    }
  },
  {
    cache: false,
    headers: (event) => {
      const id = getRouterParam(event, 'id')
      return {
        varyQuery: true,
        varyHeaders: [REQUEST_LOCALE_HEADER],
        varyCookies: [REQUEST_LOCALE_COOKIE],
        cacheIds: [
          CACHE_TAGS.makeupDetails,
          ...(id ? [makeupDetailCacheId(id)] : []),
        ],
      }
    },
    profile: 'detail',
  }
)
