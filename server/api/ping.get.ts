import { isRateLimited } from '../utils/rateLimiter'

export default defineEventHandler((event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  // Check rate limit
  if (isRateLimited(ip)) {
    throw createError({
      statusCode: 429,
      message: 'Too many requests. Please try again later.',
    })
  }
  return { status: 'ok' }
})

export const prerender = true
