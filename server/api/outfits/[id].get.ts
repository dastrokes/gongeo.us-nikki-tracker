import { useSupabaseDataClient } from '~/composables/useSupabaseClient'
import { getGameVersion } from '~/utils/gameVersion'

/**
 * Edge-cached API endpoint for fetching a single outfit by ID
 * Cached at the edge for 7 days to reduce DB egress
 * Data updates monthly with game updates
 */
export default defineCachedEventHandler(
  async (event) => {
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

      // Extract description from translations if available
      if (data && languageCode) {
        const dataWithTranslations = data as {
          outfit_translations?: Array<{
            description: string
            language_code: string
          }>
          description?: string
        }

        if (dataWithTranslations.outfit_translations?.length) {
          const translations = dataWithTranslations.outfit_translations
          const translation = translations.find(
            (t) => t.language_code === languageCode
          )
          const enTranslation = translations.find(
            (t) => t.language_code === 'en'
          )

          dataWithTranslations.description =
            translation?.description || enTranslation?.description || ''
          delete dataWithTranslations.outfit_translations
        }
      }

      return data
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
      return `${version}:outfit:${id}:${query.lang || 'no-lang'}`
    },
    swr: true, // Enable stale-while-revalidate
  }
)
