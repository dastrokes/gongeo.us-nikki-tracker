import { isRateLimited } from '../utils/rateLimiter'

interface RequestContext {
  request: Request
}

export function onRequestGet(context: RequestContext) {
  const { request } = context
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

  return new Response(JSON.stringify({ status: 'ok' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const config = {
  path: '/api/ping',
}
