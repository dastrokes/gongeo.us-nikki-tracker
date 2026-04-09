import { useSupabaseDataClient } from '~/composables/useSupabaseClient'

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
  variations?: Array<{ id: number; quality: number; type: string }>
}

interface OutfitVariation {
  id: number
  quality: number
}

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

  const idStr = baseId.toString()

  // Determine base ID
  let baseIdNum = baseId

  // Check if this is a 7-digit ID ending with 01-04 (variation format)
  if (idStr.length === 7 && /0[1-4]$/.test(idStr)) {
    // Extract base ID (first 5 digits)
    baseIdNum = parseInt(idStr.slice(0, 5))
  }

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
 * Determine variation type from outfit ID
 */
function getVariationType(id: number): string {
  const idStr = id.toString()

  if (idStr.endsWith('01')) return 'glowup'
  if (idStr.endsWith('02')) return 'evo1'
  if (idStr.endsWith('03')) return 'evo2'
  if (idStr.endsWith('04')) return 'evo3'

  return 'base'
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
              type: getVariationType(v.id),
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
