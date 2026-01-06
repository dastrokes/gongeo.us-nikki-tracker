import { useSupabaseClient } from '~/composables/useSupabaseClient'

export default defineEventHandler(async (event) => {
  const supabase = useSupabaseClient('server')

  // Determine target table based on x-target header
  const target = getHeader(event, 'x-target')
  const targetTable =
    target === 'pearpal' ? 'user_banner_stats_pearpal' : 'user_banner_stats'

  try {
    // Get the request body
    const body = await readBody(event)

    // Validate the request body
    if (!Array.isArray(body)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid request body - expected array of banner stats',
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from(targetTable).upsert(body as any, {
      onConflict: 'uid,region,banner_id',
      ignoreDuplicates: false,
    })

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error(`Failed to update banner stats:`, error)
    throw createError({
      statusCode: 500,
      message: 'Failed to update banner stats',
    })
  }
})
