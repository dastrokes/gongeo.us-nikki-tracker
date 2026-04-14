const createForbiddenError = (type?: string) =>
  createError({
    statusCode: 403,
    message: type ? `Forbidden - ${type}` : 'Forbidden',
  })

const verifyTimestamp = (
  timestamp: number,
  maxAgeSeconds: number = 300
): boolean => {
  const currentTime = Math.floor(Date.now() / 1000)
  return Math.abs(currentTime - timestamp) <= maxAgeSeconds
}

const verifySignature = async (
  signature: string,
  timestamp: number,
  payload: UserBannerStats[]
): Promise<boolean> => {
  const apiKey = useRuntimeConfig().public.gongeousApiKey || 'api-key'
  const expectedSignature = await generateSignature(apiKey, timestamp, payload)
  return signature === expectedSignature
}

export default defineEventHandler(async (event) => {
  // Get signature and timestamp from headers
  const signature = getHeader(event, 'x-signature')
  const timestamp = getHeader(event, 'x-timestamp')

  if (!signature || !timestamp) {
    throw createForbiddenError('missing')
  }

  const requestTime = Number(timestamp)
  if (Number.isNaN(requestTime) || !verifyTimestamp(requestTime)) {
    throw createForbiddenError('expired')
  }

  const supabase = useSupabaseServerClient()

  // Determine target table based on x-target header
  const target = getHeader(event, 'x-target')
  const targetTable =
    target === 'pearpal' ? 'user_banner_stats_pearpal' : 'user_banner_stats'

  try {
    // Get the request body
    const body = await readBody(event)

    // Validate the request body
    if (!Array.isArray(body)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid request body - expected array of banner stats',
      })
    }

    if (!(await verifySignature(signature, requestTime, body))) {
      throw createForbiddenError('invalid')
    }

    const { error } = await supabase.from(targetTable).upsert(body as never, {
      onConflict: 'uid,region,banner_id',
      ignoreDuplicates: false,
    })

    if (error) throw error

    return { success: true }
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'statusCode' in error &&
      typeof (error as { statusCode?: unknown }).statusCode === 'number'
    ) {
      throw error
    }

    console.error(`Failed to update banner stats:`, error)
    throw createError({
      statusCode: 500,
      message: 'Failed to update banner stats',
    })
  }
})
