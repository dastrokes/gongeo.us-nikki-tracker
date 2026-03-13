// Constants
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 1000

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Helper function for exponential backoff retries
const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  retryCount = 0
): Promise<T> => {
  try {
    return await requestFn()
  } catch (error) {
    if (retryCount >= MAX_RETRIES) {
      throw error
    }

    const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount)
    await sleep(delay)
    return retryRequest(requestFn, retryCount + 1)
  }
}

export { retryRequest, sleep }
