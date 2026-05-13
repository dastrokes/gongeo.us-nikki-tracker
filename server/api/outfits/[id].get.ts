interface OutfitTranslation {
  description?: string | null
  language_code?: string | null
}

interface OutfitData {
  id: number
  quality: number
  props?: Array<number | string> | null
  style_key?: string | null
  tags?: Array<number | string> | null
  obtain_type?: number | null
  outfit_translations?: OutfitTranslation[]
  description?: string
  outfit_items?: Array<{
    items: {
      id: number
      quality: number
      type: string
    }
  }>
  makeup_outfits?: Array<{
    makeups: {
      id: number
      quality: number
      type: string
      components?: Array<{
        id: number
        quality: number
        type: string
      }>
    }
  }>
  variations?: Array<{ id: number; quality: number; type: string }>
}

interface OutfitVariation {
  id: number
  quality: number
}

interface MakeupOutfitRow {
  full_makeup_id: number
}

interface MakeupRow {
  id: number
  quality: number
  type: string
}

interface MakeupItemRow {
  full_makeup_id: number
  makeup_id: number
}

const MAKEUP_TYPE_ORDER = new Map([
  ['baseMakeup', 1],
  ['eyebrows', 2],
  ['eyelashes', 3],
  ['contactLenses', 4],
  ['lips', 5],
  ['fullMakeup', 99],
])

const sortMakeupsByType = (rows: MakeupRow[]): MakeupRow[] =>
  [...rows].sort((left, right) => {
    const leftOrder = MAKEUP_TYPE_ORDER.get(left.type) ?? 999
    const rightOrder = MAKEUP_TYPE_ORDER.get(right.type) ?? 999
    return leftOrder - rightOrder || left.id - right.id
  })

/**
 * Calculate related outfit variation IDs
 * Only 4★ and 5★ outfits can have variations
 *
 * Logic:
 * - If ID length is 7 and ends with 01-04, it's a variation (e.g., 1000101)
 * - Base ID is the first 5 digits (e.g., 10001)
 * - Otherwise, the ID itself is the base
 */
function getRelatedOutfitIds(baseId: number, quality: number): number[] {
  if (quality < 4) return [baseId]

  const baseIdNum = parseInt(getBaseOutfitId(baseId.toString()))

  const variations = [
    baseIdNum, // base
    parseInt(`${baseIdNum}01`), // glowup
    parseInt(`${baseIdNum}02`), // evo1
  ]

  if (quality === 5) {
    variations.push(parseInt(`${baseIdNum}03`)) // evo2
    variations.push(parseInt(`${baseIdNum}04`)) // evo3
  }

  return variations
}

/**
 * API endpoint for fetching a single outfit by ID
 * App-level caching enabled (30 days), Netlify edge caching enabled via Cache-Control header
 */
export default defineCachedApiEventHandler(
  async (event) => {
    const id = Number(getRouterParam(event, 'id'))
    const languageCode = resolveRequestLocale(event)
    if (!id || isNaN(id)) {
      throw createInvalidIdError('outfit')
    }

    const supabase = useSupabaseDataClient()

    try {
      // Build query conditionally to minimize data transfer
      const selectParts = [
        'id',
        'quality',
        'props',
        'style_key',
        'tags',
        'obtain_type',
      ]

      selectParts.push('outfit_items(items(id,quality,type))')

      const selectQuery = selectParts.join(',')

      const { data, error: supabaseError } = await withSupabaseRetry(() =>
        supabase.from('outfits').select(selectQuery).eq('id', id).single()
      )

      if (supabaseError) {
        if (supabaseError.code === 'PGRST116') {
          throw createNotFoundError('outfit')
        }
        throw supabaseError
      }

      const outfitData = data as OutfitData

      const { data: makeupOutfitRows, error: makeupOutfitError } =
        await withSupabaseRetry(() =>
          supabase
            .from('makeup_outfits')
            .select('full_makeup_id')
            .eq('outfit_id', id)
        )

      if (makeupOutfitError) {
        throw makeupOutfitError
      }

      const fullMakeupIds = (
        (makeupOutfitRows as MakeupOutfitRow[] | null) ?? []
      )
        .map((row) => row.full_makeup_id)
        .filter((makeupId) => typeof makeupId === 'number')

      if (fullMakeupIds.length > 0) {
        const { data: fullMakeups, error: fullMakeupsError } =
          await withSupabaseRetry(() =>
            supabase
              .from('makeups')
              .select('id,quality,type')
              .in('id', fullMakeupIds)
          )

        if (fullMakeupsError) {
          throw fullMakeupsError
        }

        const { data: relationRows, error: relationRowsError } =
          await withSupabaseRetry(() =>
            supabase
              .from('makeup_items')
              .select('full_makeup_id,makeup_id')
              .in('full_makeup_id', fullMakeupIds)
          )

        if (relationRowsError) {
          throw relationRowsError
        }

        const relations = (relationRows as MakeupItemRow[] | null) ?? []
        const componentIds = Array.from(
          new Set(relations.map((row) => row.makeup_id))
        )
        const componentMap = new Map<number, MakeupRow>()

        if (componentIds.length > 0) {
          const { data: components, error: componentsError } =
            await withSupabaseRetry(() =>
              supabase
                .from('makeups')
                .select('id,quality,type')
                .in('id', componentIds)
            )

          if (componentsError) {
            throw componentsError
          }

          for (const component of (components as MakeupRow[] | null) ?? []) {
            componentMap.set(component.id, component)
          }
        }

        outfitData.makeup_outfits = ((fullMakeups as MakeupRow[] | null) ?? [])
          .sort((left, right) => left.id - right.id)
          .map((makeup) => ({
            makeups: {
              ...makeup,
              components: sortMakeupsByType(
                relations
                  .filter((row) => row.full_makeup_id === makeup.id)
                  .map((row) => componentMap.get(row.makeup_id))
                  .filter(
                    (component): component is MakeupRow =>
                      component !== undefined
                  )
              ),
            },
          }))
      }

      if (languageCode) {
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

        const translations =
          (translationRows as OutfitTranslation[] | null) ?? []
        const translation = translations.find(
          (t) => t.language_code === languageCode
        )
        const enTranslation = translations.find((t) => t.language_code === 'en')

        outfitData.description =
          translation?.description || enTranslation?.description || ''
      }

      // Fetch variations if quality is 4★ or 5★
      if (outfitData.quality >= 4) {
        const relatedIds = getRelatedOutfitIds(id, outfitData.quality)

        const { data: variations, error: variationsError } =
          await withSupabaseRetry(async () => {
            if (relatedIds.length <= 1) {
              return { data: null, error: null }
            }

            return supabase
              .from('outfits')
              .select('id, quality')
              .in('id', relatedIds)
          })

        if (variationsError) {
          throw variationsError
        }

        if (variations && Array.isArray(variations)) {
          outfitData.variations = variations
            .map((v: OutfitVariation) => ({
              id: v.id,
              quality: v.quality,
              type: getOutfitVariantType(v.id.toString()),
            }))
            .sort((a, b) => a.id - b.id)
        }
      }

      return outfitData
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
    cache: {
      maxAge: 60 * 60 * 24 * 30,
      staleMaxAge: 60 * 60 * 24 * 7,
      name: 'outfit-detail',
      getKey: (event) => {
        const id = getRouterParam(event, 'id')
        const languageCode = resolveRequestLocale(event)
        return `outfit:${id}:${languageCode}`
      },
      swr: true,
    },
    headers: {
      varyQuery: true,
    },
    profile: 'catalog',
  }
)
