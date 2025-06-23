import { isRateLimited } from '../utils/rateLimiter'
import { hashUid } from '../utils/hash'
import { useSupabaseClient } from '../../composables/useSupabaseClient'
import { verifyTimestamp, verifySignature } from '../utils/verify'
import type { UserBannerStats } from '~/types/stats'

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  // Check rate limit
  if (isRateLimited(ip)) {
    throw createError({
      statusCode: 429,
      message: 'Too many requests. Please try again later.',
    })
  }

  // Get signature and timestamp from headers
  const signature = getHeader(event, 'x-signature')
  const timestamp = getHeader(event, 'x-timestamp')

  if (!signature || !timestamp) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden - Missing signature or timestamp',
    })
  }

  const requestTime = parseInt(timestamp)
  if (!verifyTimestamp(requestTime)) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden - Request expired',
    })
  }

  try {
    // Get the request body
    const body = await readBody<UserBannerStats[]>(event)

    // Verify signature
    if (!verifySignature(signature, requestTime, body)) {
      throw createError({
        statusCode: 403,
        message: 'Forbidden - Invalid signature',
      })
    }

    // Validate the request body
    if (!Array.isArray(body)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid request body - expected array of banner stats',
      })
    }

    // Use the shared Supabase client with server key
    const supabase = useSupabaseClient('server')

    // Hash UIDs server-side
    const hashedDataPromises = body.map(async (item) => ({
      ...item,
      uid: await hashUid(item.uid),
    }))
    const hashedData = await Promise.all(hashedDataPromises)

    const { error } = await supabase
      .from('user_banner_stats')
      .upsert(hashedData, {
        onConflict: 'uid,region,banner_id',
        ignoreDuplicates: false,
      })

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error sending to banner_stats:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to update banner stats',
    })
  }
})

export const prerender = true
