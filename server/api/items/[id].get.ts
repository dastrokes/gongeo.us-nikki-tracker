import type { H3Event } from 'h3'
import { useSupabaseDataClient } from '~/composables/useSupabaseClient'
import { setCacheHeaders } from '~/utils/cacheHeaders'
import { getGameVersion } from '~/utils/gameVersion'
import { LOCALE_HEADER, resolveLocaleCode } from '~/utils/locale'
import {
  createInternalError,
  createInvalidIdError,
  createNotFoundError,
  createUpstreamUnavailableError,
} from '~/utils/apiErrors'
import { toErrorMessage } from '~/utils/errors'
import {
  isTransientSupabaseError,
  withSupabaseRetry,
} from '~/utils/supabaseRetry'

interface ItemTranslation {
  description: string
  language_code: string
}

interface ItemData {
  id: number
  quality: number
  type: string
  props?: Array<number | string> | null
  tags?: Array<number | string> | null
  obtain_type?: number | null
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

const getRequestLocale = (event: H3Event) => {
  const contextLocale = (event.context as { localeCode?: string })?.localeCode
  const localeHeader = getHeader(event, LOCALE_HEADER)
  const localeCookie = getCookie(event, 'i18n_redirected')

  return resolveLocaleCode(localeHeader || localeCookie || contextLocale)
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
    parseInt(`1023${baseDigits}`), // evo1
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
    '1025': 'evo3',
  }

  return typeMap[variationType] || 'base'
}

/**
 * API endpoint for fetching a single item by ID
 * App-level caching enabled (30 days), Netlify edge caching enabled via Cache-Control header
 */
export default defineCachedEventHandler(
  async (event) => {
    setCacheHeaders(event, {
      varyHeaders: [LOCALE_HEADER],
    })
    const id = Number(getRouterParam(event, 'id'))
    const languageCode = getRequestLocale(event)
    ;(event.context as { localeCode?: string }).localeCode = languageCode

    if (!id || isNaN(id)) {
      throw createInvalidIdError('item')
    }

    const supabase = useSupabaseDataClient()

    try {
      // Build query conditionally to minimize data transfer
      const selectParts = [
        'id',
        'quality',
        'type',
        'props',
        'tags',
        'obtain_type',
      ]

      if (languageCode) {
        selectParts.push('item_translations!left(description,language_code)')
      }

      selectParts.push('outfit_items(outfits(id,quality))')

      const selectQuery = selectParts.join(',')

      const { data, error: supabaseError } = await withSupabaseRetry(() =>
        supabase.from('items').select(selectQuery).eq('id', id).single()
      )

      if (supabaseError) {
        if (supabaseError.code === 'PGRST116') {
          throw createNotFoundError('item')
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

        itemData.description =
          translation?.description || enTranslation?.description || ''
        delete itemData.item_translations
      }

      // Fetch variations if quality is 4★ or 5★
      if (itemData.quality >= 4) {
        const relatedIds = getRelatedItemIds(id, itemData.quality)

        const { data: variations } = await withSupabaseRetry(async () => {
          if (relatedIds.length <= 1) {
            return { data: null, error: null }
          }

          return supabase
            .from('items')
            .select('id, quality, type')
            .in('id', relatedIds)
        })

        if (variations && Array.isArray(variations)) {
          itemData.variations = variations
            .map((v: ItemVariation) => ({
              id: v.id,
              quality: v.quality,
              type: getVariationType(v.id),
            }))
            .sort((a, b) => a.id - b.id)
        }
      }

      return itemData
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }
      const message = toErrorMessage(error, `Failed to fetch item ${id}`)
      if (isTransientSupabaseError(error)) {
        console.warn(`Failed to fetch item ${id}: ${message}`)
        throw createUpstreamUnavailableError('item')
      }
      console.error(`Failed to fetch item ${id}: ${message}`)
      throw createInternalError('item')
    }
  },
  {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    name: 'item-detail',
    getKey: (event) => {
      const id = getRouterParam(event, 'id')
      const version = getGameVersion()
      const languageCode = getRequestLocale(event)
      ;(event.context as { localeCode?: string }).localeCode = languageCode
      return `${version}:item:${id}:${languageCode}`
    },
    swr: true, // Enable stale-while-revalidate
  }
)
