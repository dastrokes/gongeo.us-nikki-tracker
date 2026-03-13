const TRANSIENT_ERROR_HINTS = [
  'connection reset',
  'econnreset',
  'timeout',
  'timed out',
  'etimedout',
  'eai_again',
  'network',
  'fetch failed',
  'client error',
  'sendrequest',
]

export const isTransientSupabaseError = (error: unknown): boolean => {
  if (!error) return false
  const details =
    typeof (error as { details?: unknown }).details === 'string'
      ? (error as { details?: string }).details
      : ''
  const message = toErrorMessage(error, '')
  const haystack = `${message} ${details}`.toLowerCase()
  return TRANSIENT_ERROR_HINTS.some((hint) => haystack.includes(hint))
}

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

export const withSupabaseRetry = async <T extends { error?: unknown }>(
  operation: () => PromiseLike<T> | T,
  options: { retries?: number; baseDelayMs?: number } = {}
): Promise<T> => {
  const retries = options.retries ?? 2
  const baseDelayMs = options.baseDelayMs ?? 150
  let attempt = 0

  while (true) {
    try {
      const result = await operation()
      if (result?.error && isTransientSupabaseError(result.error)) {
        if (attempt < retries) {
          const delay = baseDelayMs * Math.pow(2, attempt)
          attempt += 1
          await sleep(delay)
          continue
        }
      }
      return result
    } catch (error) {
      if (isTransientSupabaseError(error) && attempt < retries) {
        const delay = baseDelayMs * Math.pow(2, attempt)
        attempt += 1
        await sleep(delay)
        continue
      }
      throw error
    }
  }
}
