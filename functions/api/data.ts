import { isRateLimited } from '../utils/rateLimiter'

interface RequestContext {
  request: Request
  env: {
    SUPABASE_DATABASE_URL: string
    SUPABASE_STORAGE_TOKEN: string
    [key: string]: string
  }
}

// Define an interface for errors with status property
interface ErrorWithStatus extends Error {
  status: number
}

// Cache control for daily updates (24 hours)
const CACHE_CONTROL = 'public, max-age=86400, immutable'

const fetchJsonData = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      'Cache-Control': CACHE_CONTROL,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.statusText}`)
  }

  return response.json()
}

export async function onRequestGet(context: RequestContext) {
  try {
    const { request, env } = context

    // Get client IP address
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'

    // Check rate limit
    if (isRateLimited(clientIp)) {
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

    // Validate environment variables
    if (!env.SUPABASE_DATABASE_URL) {
      throw new Error(
        'SUPABASE_DATABASE_URL environment variable is not defined'
      )
    }

    if (!env.SUPABASE_STORAGE_TOKEN) {
      throw new Error(
        'SUPABASE_STORAGE_TOKEN environment variable is not defined'
      )
    }

    // Construct the data URL
    const dataUrl = `${env.SUPABASE_DATABASE_URL}/storage/v1/object/sign/infinitynikkitracker/data.json?token=${env.SUPABASE_STORAGE_TOKEN}`

    // Validate URL
    try {
      new URL(dataUrl)
    } catch (error: unknown) {
      console.error('Invalid URL constructed:', dataUrl)
      throw new Error(
        `Malformed URL: ${error instanceof Error ? error.message : 'Invalid URL format'}`
      )
    }

    // Set response headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers':
        'authorization, x-client-info, apikey, content-type',
      'Content-Type': 'application/json',
      'Cache-Control': CACHE_CONTROL,
    }

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(JSON.stringify({ message: 'ok' }), {
        headers,
      })
    }

    const jsonData = await fetchJsonData(dataUrl)
    return new Response(JSON.stringify(jsonData), {
      headers,
    })
  } catch (error) {
    console.error('API error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status:
          error instanceof Error && 'status' in error
            ? (error as ErrorWithStatus).status
            : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

export const config = {
  path: '/api/data',
}
