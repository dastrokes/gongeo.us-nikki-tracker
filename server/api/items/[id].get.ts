interface ItemTranslation {
  description?: string | null
  language_code?: string | null
}

interface ItemData {
  id: number
  quality: number
  type: string
  props?: Array<number | string> | null
  style_key?: string | null
  tags?: Array<number | string> | null
  obtain_type?: number | null
  item_translations?: ItemTranslation[]
  description?: string
  item_attributes?:
    | {
        item_id?: number
        item_type?: string
        category?: string | null
        subcategory?: string | null
        metadata?: Record<string, unknown> | null
      }
    | Array<{
        item_id?: number
        item_type?: string
        category?: string | null
        subcategory?: string | null
        metadata?: Record<string, unknown> | null
      }>
    | null
  outfit_items?: Array<{
    outfits: {
      id: number
      quality: number
      outfit_items?: Array<{
        items: {
          id: number
          quality: number
          type: string
        }
      }>
    }
  }>
  variations?: Array<{ id: number; quality: number; type: string }>
}

interface ItemVariation {
  id: number
  quality: number
  type: string
}

function compactItemSearchMetadata(
  metadata: ItemSearchMetadata | null,
  excludedKeys: string[] = []
): ItemSearchMetadata | null {
  if (!metadata) return null

  const compactedEntries = Object.entries(metadata).filter(([key, value]) => {
    if (excludedKeys.includes(key)) {
      return false
    }

    if (value === null || value === undefined) {
      return false
    }

    if (Array.isArray(value)) {
      return value.length > 0
    }

    if (typeof value === 'string') {
      return value.trim().length > 0
    }

    return true
  })

  return compactedEntries.length > 0
    ? (Object.fromEntries(compactedEntries) as ItemSearchMetadata)
    : null
}

/**
 * API endpoint for fetching a single item by ID
 * App-level caching enabled (30 days), Netlify edge caching enabled via Cache-Control header
 */
export default defineCachedApiEventHandler(
  async (event) => {
    const id = Number(getRouterParam(event, 'id'))
    const languageCode = resolveRequestLocale(event)

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
        'style_key',
        'tags',
        'obtain_type',
      ]

      selectParts.push('item_attributes(category,subcategory,metadata)')
      selectParts.push(
        'outfit_items(outfits(id,quality,outfit_items(items(id,quality,type))))'
      )

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
      const searchAttributes = Array.isArray(itemData.item_attributes)
        ? (itemData.item_attributes[0] ?? null)
        : itemData.item_attributes

      if (searchAttributes) {
        itemData.item_attributes = {
          category: searchAttributes.category ?? null,
          subcategory: searchAttributes.subcategory ?? null,
          metadata: compactItemSearchMetadata(
            normalizeItemSearchMetadata(searchAttributes.metadata ?? {}),
            ['item_id', 'item_type', 'slot', 'category', 'subcategory']
          ),
        }
      }

      if (languageCode) {
        const translationCodes = Array.from(new Set([languageCode, 'en']))
        const { data: translationRows, error: translationError } =
          await withSupabaseRetry(() =>
            supabase
              .from('item_translations')
              .select('description,language_code')
              .eq('item_id', id)
              .in('language_code', translationCodes)
          )

        if (translationError) {
          throw translationError
        }

        const translations = (translationRows as ItemTranslation[] | null) ?? []
        const translation = translations.find(
          (t) => t.language_code === languageCode
        )
        const enTranslation = translations.find((t) => t.language_code === 'en')

        itemData.description =
          translation?.description || enTranslation?.description || ''
      }

      // Fetch variations if quality is 4★ or 5★
      if (itemData.quality >= 4) {
        const relatedIds = getRelatedItemIds(id, itemData.quality)

        const { data: variations, error: variationsError } =
          await withSupabaseRetry(async () => {
            if (relatedIds.length <= 1) {
              return { data: null, error: null }
            }

            return supabase
              .from('items')
              .select('id, quality, type')
              .in('id', relatedIds)
          })

        if (variationsError) {
          throw variationsError
        }

        if (variations && Array.isArray(variations)) {
          itemData.variations = variations
            .map((v: ItemVariation) => ({
              id: v.id,
              quality: v.quality,
              type: getItemVariantType(v.id),
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
    cache: {
      maxAge: 60 * 60 * 24 * 30,
      staleMaxAge: 60 * 60 * 24 * 7,
      name: 'item-detail',
      getKey: (event) => {
        const id = getRouterParam(event, 'id')
        const languageCode = resolveRequestLocale(event)
        return `item:${id}:${languageCode}`
      },
      swr: true,
    },
    headers: {
      varyQuery: true,
    },
    profile: 'catalog',
  }
)
