import type { H3Event } from 'h3'
import { getRequestIP } from 'h3'
import { isRateLimited } from '../utils/rateLimiter'

const dataUrl =
  'https://fimzdbqulflilnnopibz.supabase.co/storage/v1/object/sign/infinitynikkitracker/data.json?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1OTJmMWYxLWVhNWMtNDg3Ni1iYzk1LWRhNmVmOTU0YTE4MiJ9.eyJ1cmwiOiJpbmZpbml0eW5pa2tpdHJhY2tlci9kYXRhLmpzb24iLCJpYXQiOjE3NDYxNDEyMjIsImV4cCI6NDg2ODIwNTIyMn0.x2Fmx61_lNTHaqO1OsOxHRJYS9y3EXBi0wWry25z0rU'

// Cache control for daily updates (24 hours)
const CACHE_CONTROL = 'public, max-age=86400'

const fetchJsonData = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      'Cache-Control': CACHE_CONTROL,
    },
  })

  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      message: `Failed to fetch data: ${response.statusText}`,
    })
  }

  return response.json()
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Get client IP address
    const clientIp = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

    // Check rate limit
    if (isRateLimited(clientIp)) {
      throw createError({
        statusCode: 429,
        message: 'Too many requests. Please try again later.',
      })
    }

    // Set CORS headers
    setHeader(event, 'Access-Control-Allow-Origin', '*')
    setHeader(
      event,
      'Access-Control-Allow-Headers',
      'authorization, x-client-info, apikey, content-type'
    )
    setHeader(event, 'Content-Type', 'application/json')

    // Handle preflight requests
    if (event.method === 'OPTIONS') {
      return { message: 'ok' }
    }

    const jsonData = await fetchJsonData(dataUrl)
    setHeader(event, 'Cache-Control', CACHE_CONTROL)
    return jsonData
  } catch (error) {
    console.error('API error:', error)
    throw createError({
      statusCode:
        error instanceof Error && 'statusCode' in error
          ? (error as { statusCode: number }).statusCode
          : 500,
      message: error instanceof Error ? error.message : 'Internal server error',
    })
  }
})
