import { useSupabaseDataClient } from '~/composables/useSupabaseClient'
import { getGameVersion } from '~/utils/gameVersion'

/**
 * API endpoint for fetching a single item by ID
 * App-level caching enabled (7 days), Netlify edge caching disabled via Cache-Control header
 */
export default defineCachedEventHandler(
  async (event) => {
    setResponseHeader(event, 'Cache-Control', 'no-store')
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

      // Extract description from translations if available
      if (data && languageCode) {
        const dataWithTranslations = data as {
          item_translations?: Array<{
            description: string
            language_code: string
          }>
          description?: string
        }

        if (dataWithTranslations.item_translations?.length) {
          const translations = dataWithTranslations.item_translations
          const translation = translations.find(
            (t) => t.language_code === languageCode
          )
          const enTranslation = translations.find(
            (t) => t.language_code === 'en'
          )

          dataWithTranslations.description =
            translation?.description || enTranslation?.description || ''
          delete dataWithTranslations.item_translations
        }
      }

      return data
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
    maxAge: 60 * 60 * 24 * 7, // 7 days
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
