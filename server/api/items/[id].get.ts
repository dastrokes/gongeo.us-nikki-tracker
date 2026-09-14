type ItemTranslation = {
  description?: string | null
  language_code?: string | null
}

type ItemAttributeRow = {
  category?: string | null
  subcategory?: string | null
  metadata?: Record<string, unknown> | null
}

type ItemData = {
  id: number
  props?: Array<number | string> | null
  item_attributes?: ItemAttributeRow | ItemAttributeRow[] | null
  item_translations?: ItemTranslation[] | null
}

function compactItemSearchMetadata(
  metadata: ItemSearchMetadata | null,
  excludedKeys: string[] = []
): ItemSearchMetadata | null {
  if (!metadata) return null

  const compactedEntries = Object.entries(metadata).filter(([key, value]) => {
    if (excludedKeys.includes(key)) return false
    if (value === null || value === undefined) return false
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'string') return value.trim().length > 0
    return true
  })

  return compactedEntries.length > 0
    ? (Object.fromEntries(compactedEntries) as ItemSearchMetadata)
    : null
}

export default defineCachedApiEventHandler(
  async (event) => {
    const id = Number(getRouterParam(event, 'id'))
    const languageCode = resolveRequestLocale(event) || 'en'

    if (!id || Number.isNaN(id)) {
      throw createInvalidIdError('item')
    }

    const supabase = useSupabaseDataClient()

    try {
      const translationCodes = Array.from(new Set([languageCode, 'en']))
      const { data, error: supabaseError } = await withSupabaseRetry(() =>
        supabase
          .from('items')
          .select(
            'id,props,item_attributes(category,subcategory,metadata),item_translations(description,language_code)'
          )
          .eq('id', id)
          .in('item_translations.language_code', translationCodes)
          .maybeSingle()
      )

      if (supabaseError) {
        if (supabaseError.code === 'PGRST116') {
          throw createNotFoundError('item')
        }
        throw supabaseError
      }

      if (!data) {
        throw createNotFoundError('item')
      }

      const item = data as ItemData
      const rawAttributes = Array.isArray(item.item_attributes)
        ? (item.item_attributes[0] ?? null)
        : (item.item_attributes ?? null)
      const itemAttributes = rawAttributes
        ? {
            category: rawAttributes.category ?? null,
            subcategory: rawAttributes.subcategory ?? null,
            metadata: compactItemSearchMetadata(
              normalizeItemSearchMetadata(rawAttributes.metadata ?? {}),
              ['item_id', 'item_type', 'slot', 'category', 'subcategory']
            ),
          }
        : null

      const translations = item.item_translations ?? []
      const translation = translations.find(
        (row) => row.language_code === languageCode
      )
      const enTranslation = translations.find(
        (row) => row.language_code === 'en'
      )

      return {
        id: item.id,
        props: item.props,
        description:
          translation?.description || enTranslation?.description || '',
        item_attributes: itemAttributes,
      } satisfies ItemDetailApiResponse
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
    cache: false,
    headers: (event) => {
      const id = getRouterParam(event, 'id')
      return {
        varyQuery: true,
        varyHeaders: [REQUEST_LOCALE_HEADER],
        varyCookies: [REQUEST_LOCALE_COOKIE],
        cacheIds: [
          CACHE_TAGS.itemDetails,
          ...(id ? [itemDetailCacheId(id)] : []),
        ],
      }
    },
    profile: 'detail',
  }
)
