const TRANSIENT_ERROR_HINTS = [
  'connection reset',
  'econnreset',
  'service unavailable',
  'upstream connect',
  'database connection',
  'internal server error',
  'server error',
  'bad gateway',
  'gateway timeout',
  'socket hang up',
  'enotfound',
  'epipe',
  'econnrefused',
  'timeout',
  'timed out',
  'etimedout',
  'eai_again',
  'network',
  'fetch failed',
  'client error',
  'sendrequest',
  'pgrst000',
  'pgrst001',
  'pgrst002',
  'pgrst003',
  'pgrstx00',
]

const TRANSIENT_HTTP_STATUS_CODES = new Set([408, 500, 502, 503, 504, 520])

const DEFAULT_RETRIES = 3
const DEFAULT_BASE_DELAY_MS = 500
const MAX_RETRY_DELAY_MS = 5000
const RETRY_JITTER_MIN = 0.75
const RETRY_JITTER_RANGE = 0.5

const isTransientSupabaseErrorValue = (
  error: unknown,
  seen: WeakSet<object>
): boolean => {
  if (!error) return false

  if (typeof error === 'object') {
    if (seen.has(error)) return false
    seen.add(error)

    const status = (error as { status?: unknown }).status
    const statusCode = (error as { statusCode?: unknown }).statusCode
    if (
      (typeof status === 'number' && TRANSIENT_HTTP_STATUS_CODES.has(status)) ||
      (typeof statusCode === 'number' &&
        TRANSIENT_HTTP_STATUS_CODES.has(statusCode))
    ) {
      return true
    }
  }

  const details =
    typeof (error as { details?: unknown }).details === 'string'
      ? (error as { details?: string }).details
      : ''
  const code =
    typeof (error as { code?: unknown }).code === 'string'
      ? (error as { code?: string }).code
      : ''
  const message = toErrorMessage(error, '')
  const haystack = `${message} ${details} ${code}`.toLowerCase()
  if (TRANSIENT_ERROR_HINTS.some((hint) => haystack.includes(hint))) {
    return true
  }

  const cause =
    typeof error === 'object' ? (error as { cause?: unknown }).cause : undefined
  return cause ? isTransientSupabaseErrorValue(cause, seen) : false
}

export const isTransientSupabaseError = (error: unknown): boolean =>
  isTransientSupabaseErrorValue(error, new WeakSet())

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

const getRetryDelay = (baseDelayMs: number, attempt: number): number => {
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt)
  const jitterMultiplier = RETRY_JITTER_MIN + Math.random() * RETRY_JITTER_RANGE
  return Math.min(
    Math.round(exponentialDelay * jitterMultiplier),
    MAX_RETRY_DELAY_MS
  )
}

// PostgREST builders expose retry(false); Auth and other promises pass through.
// Keeping this here prevents SDK retries from stacking with our custom policy.
const disableBuiltInRetry = <T>(operation: PromiseLike<T> | T) => {
  const retry = (operation as { retry?: unknown } | null)?.retry
  if (typeof retry !== 'function') return operation

  return retry.call(operation, false) as PromiseLike<T>
}

export const withSupabaseRetry = async <T extends { error?: unknown }>(
  operation: () => PromiseLike<T> | T,
  options: { retries?: number; baseDelayMs?: number } = {}
): Promise<T> => {
  const retries = options.retries ?? DEFAULT_RETRIES
  const baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS
  let attempt = 0

  while (true) {
    try {
      const result = await disableBuiltInRetry(operation())
      if (result?.error && isTransientSupabaseError(result.error)) {
        if (attempt < retries) {
          const delay = getRetryDelay(baseDelayMs, attempt)
          attempt += 1
          await sleep(delay)
          continue
        }
      }
      return result
    } catch (error) {
      if (isTransientSupabaseError(error) && attempt < retries) {
        const delay = getRetryDelay(baseDelayMs, attempt)
        attempt += 1
        await sleep(delay)
        continue
      }
      throw error
    }
  }
}
