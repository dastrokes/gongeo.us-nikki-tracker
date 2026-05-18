type MomoDetailRow = {
  id: number
  quality: number
  obtain_type?: number | null
  version?: string | null
}

type MomoDetailTranslation = {
  language_code?: string | null
  name?: string | null
  description?: string | null
}

type MomoOutfitRow = {
  outfit_id?: number | null
}

type OutfitRow = {
  id: number
  quality: number | null
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
          .select('id,quality,obtain_type,version')
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
      const { data: relationRows, error: relationError } =
        await withSupabaseRetry(() =>
          supabase.from('momo_outfits').select('outfit_id').eq('momo_id', id)
        )

      if (relationError) {
        throw relationError
      }

      const relatedOutfitIds = Array.from(
        new Set(
          ((relationRows as MomoOutfitRow[] | null) ?? [])
            .map((row) => row.outfit_id)
            .filter(
              (outfitId): outfitId is number => typeof outfitId === 'number'
            )
        )
      )
      let relatedOutfits: OutfitRow[] = []

      if (relatedOutfitIds.length > 0) {
        const { data: outfitRows, error: outfitError } =
          await withSupabaseRetry(() =>
            supabase
              .from('outfits')
              .select('id,quality')
              .in('id', relatedOutfitIds)
          )

        if (outfitError) {
          throw outfitError
        }

        relatedOutfits = ((outfitRows as OutfitRow[] | null) ?? []).sort(
          (left, right) => left.id - right.id
        )
      }

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
        related_outfits: relatedOutfits.map((outfit) => ({
          id: outfit.id,
          quality: outfit.quality ?? 5,
        })),
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
        return `${version}:momo-relations-v1:${id}:${languageCode}`
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
