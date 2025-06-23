import { isRateLimited } from '../utils/rateLimiter'
import { hashUid } from '../utils/hash'
import { verifyTimestamp, verifySignature } from '../utils/verify'
import type { UserBannerStats } from '../../types/stats'
import { createClient } from '@supabase/supabase-js'

interface RequestContext {
  request: Request
  env: {
    SUPABASE_DATABASE_URL: string
    SUPABASE_SERVICE_ROLE_KEY: string
    [key: string]: string
  }
}

export async function onRequestPost(context: RequestContext) {
  const { request, env } = context
  const ip = request.headers.get('x-forwarded-for') || 'unknown'

  // Check rate limit
  if (isRateLimited(ip)) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests. Please try again later.',
      }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  // Get signature and timestamp from headers
  const signature = request.headers.get('x-signature')
  const timestamp = request.headers.get('x-timestamp')

  if (!signature || !timestamp) {
    return new Response(
      JSON.stringify({
        error: 'Forbidden - Missing signature or timestamp',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  const requestTime = parseInt(timestamp)
  if (!verifyTimestamp(requestTime)) {
    return new Response(
      JSON.stringify({
        error: 'Forbidden - Request expired',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  try {
    // Get the request body
    const body = (await request.json()) as UserBannerStats[]

    // Verify signature
    if (!(await verifySignature(signature, requestTime, body))) {
      return new Response(
        JSON.stringify({
          error: 'Forbidden - Invalid signature',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate the request body
    if (!Array.isArray(body)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request body - expected array of banner stats',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Create Supabase client
    const supabase = createClient(
      env.SUPABASE_DATABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    )

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

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error sending to banner_stats:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to update banner stats',
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

export const config = {
  path: '/api/stats',
}
