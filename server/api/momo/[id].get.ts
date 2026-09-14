type MomoDetailTranslation = {
  language_code?: string | null
  description?: string | null
}

type MomoData = {
  id: number
  momo_translations?: MomoDetailTranslation[] | null
}

export default defineCachedApiEventHandler(
  async (event) => {
    const id = Number(getRouterParam(event, 'id'))
    const languageCode = resolveRequestLocale(event) || 'en'

    if (!id || Number.isNaN(id)) {
      throw createInvalidIdError('momo')
    }

    const supabase = useSupabaseDataClient()

    try {
      const translationCodes = Array.from(new Set([languageCode, 'en']))
      const { data, error: supabaseError } = await withSupabaseRetry(() =>
        supabase
          .from('momo')
          .select('id,momo_translations(language_code,description)')
          .eq('id', id)
          .in('momo_translations.language_code', translationCodes)
          .single()
      )

      if (supabaseError) {
        if (supabaseError.code === 'PGRST116') {
          throw createNotFoundError('momo')
        }
        throw supabaseError
      }

      const momo = data as MomoData
      const translations = momo.momo_translations ?? []
      const translation = translations.find(
        (row) => row.language_code === languageCode
      )
      const enTranslation = translations.find(
        (row) => row.language_code === 'en'
      )

      return {
        id: momo.id,
        description:
          translation?.description || enTranslation?.description || '',
      } satisfies MomoDetailApiResponse
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }
      const message = toErrorMessage(error, `Failed to fetch Momo ${id}`)
      if (isTransientSupabaseError(error)) {
        console.warn(`Failed to fetch Momo ${id}: ${message}`)
        throw createUpstreamUnavailableError('momo')
      }
      console.error(`Failed to fetch Momo ${id}: ${message}`)
      throw createInternalError('momo')
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
          CACHE_TAGS.momoDetails,
          ...(id ? [momoDetailCacheId(id)] : []),
        ],
      }
    },
    profile: 'detail',
  }
)
