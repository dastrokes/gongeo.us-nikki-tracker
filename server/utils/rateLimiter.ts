interface RateLimit {
  count: number
  firstRequest: number
}

const rateLimits = new Map<string, RateLimit>()
const WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS = 1 // Maximum requests per minute

export function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const rateLimit = rateLimits.get(ip)

  // Clean up old rate limits
  for (const [storedIp, limit] of rateLimits.entries()) {
    if (now - limit.firstRequest > WINDOW_MS) {
      rateLimits.delete(storedIp)
    }
  }

  if (!rateLimit) {
    rateLimits.set(ip, { count: 1, firstRequest: now })
    return false
  }

  if (now - rateLimit.firstRequest > WINDOW_MS) {
    rateLimits.set(ip, { count: 1, firstRequest: now })
    return false
  }

  rateLimit.count++
  return rateLimit.count > MAX_REQUESTS
}
