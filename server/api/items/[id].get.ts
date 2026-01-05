import { useSupabaseDataClient } from '~/composables/useSupabaseClient'
import { getGameVersion } from '~/utils/gameVersion'

interface ItemTranslation {
  description: string
  language_code: string
}

interface ItemData {
  id: number
  quality: number
  type: string
  item_translations?: ItemTranslation[]
  description?: string
  outfit_items?: Array<{ outfits: { id: number; quality: number } }>
  variations?: Array<{ id: number; quality: number; type: string }>
}

interface ItemVariation {
  id: number
  quality: number
  type: string
}

/**
 * Calculate related item variation IDs
 * Only 4★ and 5★ items can have variations
 */
function getRelatedItemIds(baseId: number, quality: number): number[] {
  if (quality < 4) return [baseId]
  
  const idStr = baseId.toString()
  if (idStr.length !== 10) return [baseId]
  
  const baseDigits = idStr.substring(4)
  const variations = [
    parseInt(`1020${baseDigits}`), // base
    parseInt(`1022${baseDigits}`), // glowup
    parseInt(`1023${baseDigits}`)  // evo1
  ]
  
  if (quality === 5) {
    variations.push(parseInt(`1024${baseDigits}`)) // evo2
    variations.push(parseInt(`1025${baseDigits}`)) // evo3
  }
  
  return variations
}

/**
 * Determine variation type from item ID
 */
function getVariationType(id: number): string {
  const idStr = id.toString()
  const variationType = idStr.substring(0, 4)
  
  const typeMap: Record<string, string> = {
    '1022': 'glowup',
    '1023': 'evo1',
    '1024': 'evo2',
    '1025': 'evo3'
  }
  
  return typeMap[variationType] || 'base'
}

/**
 * API endpoint for fetching a single item by ID
 * App-level caching enabled (30 days), Netlify edge caching enabled via Cache-Control header
 */
export default defineCachedEventHandler(
  async (event) => {
    const version = getGameVersion()
    setResponseHeader(
      event,
      'Cache-Control',
      'public, max-age=0, s-maxage=2592000, stale-while-revalidate=86400'
    )
    setResponseHeader(event, 'Netlify-Vary', 'query=lang')
    setResponseHeader(event, 'X-Data-Version', version)
    const id = Number(getRouterParam(event, 'id'))
    const query = getQuery(event)
    const languageCode = query.lang?.toString()

    if (!id || isNaN(id)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid item ID',
      })
    }

    const supabase = useSupabaseDataClient()

    try {
      // Build query conditionally to minimize data transfer
      const selectParts = ['id', 'quality', 'type']

      if (languageCode) {
        selectParts.push('item_translations!left(description,language_code)')
      }

      selectParts.push('outfit_items(outfits(id,quality))')

      const selectQuery = selectParts.join(',')

      const { data, error: supabaseError } = await supabase
        .from('items')
        .select(selectQuery)
        .eq('id', id)
        .single()

      if (supabaseError) {
        if (supabaseError.code === 'PGRST116') {
          throw createError({
            statusCode: 404,
            message: 'Item not found',
          })
        }
        throw supabaseError
      }

      const itemData = data as ItemData

      // Extract description from translations if available
      if (languageCode && itemData.item_translations?.length) {
        const translation = itemData.item_translations.find(
          (t) => t.language_code === languageCode
        )
        const enTranslation = itemData.item_translations.find(
          (t) => t.language_code === 'en'
        )

        itemData.description = translation?.description || enTranslation?.description || ''
        delete itemData.item_translations
      }

      // Fetch variations if quality is 4★ or 5★
      if (itemData.quality >= 4) {
        const relatedIds = getRelatedItemIds(id, itemData.quality)
        
        const { data: variations } = await supabase
          .from('items')
          .select('id, quality, type')
          .in('id', relatedIds)
        
        if (variations && Array.isArray(variations)) {
          itemData.variations = variations
            .map((v: ItemVariation) => ({
              id: v.id,
              quality: v.quality,
              type: getVariationType(v.id)
            }))
            .sort((a, b) => a.id - b.id)
        }
      }

      return itemData
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }
      console.error(`Failed to fetch item ${id}:`, error)
      throw createError({
        statusCode: 500,
        message: 'Failed to fetch item',
      })
    }
  },
  {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    name: 'item-detail',
    getKey: (event) => {
      const id = getRouterParam(event, 'id')
      const query = getQuery(event)
      const version = getGameVersion()
      return `${version}:item:${id}:${query.lang || 'no-lang'}`
    },
    swr: true, // Enable stale-while-revalidate
  }
)
