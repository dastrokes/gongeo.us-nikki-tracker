import { isRateLimited } from '../utils/rateLimiter'
import { hashUid } from '../utils/hash'
import { useSupabaseClient } from '../../composables/useSupabaseClient'

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  // Check rate limit
  if (isRateLimited(ip)) {
    throw createError({
      statusCode: 429,
      message: 'Too many requests. Please try again later.',
    })
  }

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

    // Use the shared Supabase client with server key
    const supabase = useSupabaseClient('server')

    // Hash UIDs
    const uid = body[0]?.uid
    const hashedUid = await hashUid(uid)
    const hashedData = body.map((item: { uid: string }) => ({
      ...item,
      uid: hashedUid,
    }))

    const { error } = await supabase.from(targetTable).upsert(hashedData, {
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
