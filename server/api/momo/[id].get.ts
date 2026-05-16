type MomoDetailRow = {
  id: number
  quality: number
  obtain_type?: number | null
}

type MomoDetailTranslation = {
  language_code?: string | null
  name?: string | null
  description?: string | null
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
      const { data, error: supabaseError } = await withSupabaseRetry(() =>
        supabase
          .from('momo')
          .select('id,quality,obtain_type')
          .eq('id', id)
          .single()
      )

      if (supabaseError) {
        if (supabaseError.code === 'PGRST116') {
          throw createNotFoundError('momo')
        }
        throw supabaseError
      }

      const momoData = data as MomoDetailRow
      const translationCodes = Array.from(new Set([languageCode, 'en']))
      const { data: translationRows, error: translationError } =
        await withSupabaseRetry(() =>
          supabase
            .from('momo_translations')
            .select('language_code,name,description')
            .eq('momo_id', id)
            .in('language_code', translationCodes)
        )

      if (translationError) {
        throw translationError
      }

      const translations =
        (translationRows as MomoDetailTranslation[] | null) ?? []
      const translation = translations.find(
        (row) => row.language_code === languageCode
      )
      const enTranslation = translations.find(
        (row) => row.language_code === 'en'
      )

      return {
        ...momoData,
        name: translation?.name || enTranslation?.name || `Momo's Cloak ${id}`,
        description:
          translation?.description || enTranslation?.description || '',
      }
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
    cache: {
      maxAge: 60 * 60 * 24 * 30,
      staleMaxAge: 60 * 60 * 24 * 7,
      name: 'momo-detail',
      getKey: (event) => {
        const version = getGameVersion()
        const id = getRouterParam(event, 'id')
        const languageCode = resolveRequestLocale(event) || 'en'
        return `${version}:momo:${id}:${languageCode}`
      },
      swr: true,
    },
    headers: {
      varyQuery: true,
      varyHeaders: [GAME_VERSION_HEADER],
    },
    profile: 'catalog',
  }
)
