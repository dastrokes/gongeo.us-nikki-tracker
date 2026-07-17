type OutfitTranslation = {
  description?: string | null
  language_code?: string | null
}

type OutfitData = {
  id: number
  props?: Array<number | string> | null
  outfit_items?: Array<{
    item_id?: number | null
  }> | null
}

export default defineCachedApiEventHandler(
  async (event) => {
    const id = Number(getRouterParam(event, 'id'))
    const languageCode = resolveRequestLocale(event) || 'en'

    if (!id || Number.isNaN(id)) {
      throw createInvalidIdError('outfit')
    }

    const supabase = useSupabaseDataClient()

    try {
      const { data, error: supabaseError } = await withSupabaseRetry(() =>
        supabase
          .from('outfits')
          .select('id,props,outfit_items(item_id)')
          .eq('id', id)
          .single()
      )

      if (supabaseError) {
        if (supabaseError.code === 'PGRST116') {
          throw createNotFoundError('outfit')
        }
        throw supabaseError
      }

      const outfit = data as OutfitData
      const translationCodes = Array.from(new Set([languageCode, 'en']))
      const { data: translationRows, error: translationError } =
        await withSupabaseRetry(() =>
          supabase
            .from('outfit_translations')
            .select('description,language_code')
            .eq('outfit_id', id)
            .in('language_code', translationCodes)
        )

      if (translationError) {
        throw translationError
      }

      const translations = (translationRows as OutfitTranslation[] | null) ?? []
      const translation = translations.find(
        (row) => row.language_code === languageCode
      )
      const enTranslation = translations.find(
        (row) => row.language_code === 'en'
      )

      return {
        id: outfit.id,
        props: outfit.props,
        description:
          translation?.description || enTranslation?.description || '',
        item_ids: Array.from(
          new Set(
            (outfit.outfit_items ?? [])
              .map((row) => row.item_id)
              .filter((itemId): itemId is number => typeof itemId === 'number')
          )
        ),
      } satisfies OutfitDetailApiResponse
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }
      const message = toErrorMessage(error, `Failed to fetch outfit ${id}`)
      if (isTransientSupabaseError(error)) {
        console.warn(`Failed to fetch outfit ${id}: ${message}`)
        throw createUpstreamUnavailableError('outfit')
      }
      console.error(`Failed to fetch outfit ${id}: ${message}`)
      throw createInternalError('outfit')
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
          CACHE_TAGS.outfitDetails,
          ...(id ? [outfitDetailCacheId(id)] : []),
        ],
      }
    },
    profile: 'detail',
  }
)
