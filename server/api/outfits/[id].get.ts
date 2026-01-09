import { useSupabaseDataClient } from '~/composables/useSupabaseClient'
import { setCacheHeaders } from '~/utils/cacheHeaders'
import { getGameVersion } from '~/utils/gameVersion'

interface OutfitTranslation {
  description: string
  language_code: string
}

interface OutfitData {
  id: number
  quality: number
  outfit_translations?: OutfitTranslation[]
  description?: string
  outfit_items?: Array<{ items: { id: number; quality: number; type: string } }>
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
export default defineCachedEventHandler(
  async (event) => {
    setCacheHeaders(event, {
      varyQuery: ['lang'],
    })
    const id = Number(getRouterParam(event, 'id'))
    const query = getQuery(event)
    const languageCode = query.lang?.toString()

    if (!id || isNaN(id)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid outfit ID',
      })
    }

    const supabase = useSupabaseDataClient()

    try {
      // Build query conditionally to minimize data transfer
      const selectParts = ['id', 'quality']

      if (languageCode) {
        selectParts.push('outfit_translations!left(description,language_code)')
      }

      selectParts.push('outfit_items(items(id,quality,type))')

      const selectQuery = selectParts.join(',')

      const { data, error: supabaseError } = await supabase
        .from('outfits')
        .select(selectQuery)
        .eq('id', id)
        .single()

      if (supabaseError) {
        if (supabaseError.code === 'PGRST116') {
          throw createError({
            statusCode: 404,
            message: 'Outfit not found',
          })
        }
        throw supabaseError
      }

      const outfitData = data as OutfitData

      // Extract description from translations if available
      if (languageCode && outfitData.outfit_translations?.length) {
        const translation = outfitData.outfit_translations.find(
          (t) => t.language_code === languageCode
        )
        const enTranslation = outfitData.outfit_translations.find(
          (t) => t.language_code === 'en'
        )

        outfitData.description =
          translation?.description || enTranslation?.description || ''
        delete outfitData.outfit_translations
      }

      // Fetch variations if quality is 4★ or 5★
      if (outfitData.quality >= 4) {
        const relatedIds = getRelatedOutfitIds(id, outfitData.quality)

        const { data: variations } = await supabase
          .from('outfits')
          .select('id, quality')
          .in('id', relatedIds)

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
      console.error(`Failed to fetch outfit ${id}:`, error)
      throw createError({
        statusCode: 500,
        message: 'Failed to fetch outfit',
      })
    }
  },
  {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    name: 'outfit-detail',
    getKey: (event) => {
      const id = getRouterParam(event, 'id')
      const query = getQuery(event)
      const version = getGameVersion()
      return `${version}:outfit:${id}:${query.lang || 'en'}`
    },
    swr: true, // Enable stale-while-revalidate
  }
)
