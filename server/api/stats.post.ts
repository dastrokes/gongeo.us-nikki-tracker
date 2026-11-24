import {
  getBannerStatsWriteMode,
  invalidBannerStats,
  prepareBannerStatsImport,
  readBannerStatsImport,
  writeBannerStatsD1,
} from '../utils/bannerStatsD1'

const createForbiddenError = (type?: string) =>
  createError({
    statusCode: 403,
    statusMessage: type ? `Forbidden - ${type}` : 'Forbidden',
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
  payload: unknown[]
): Promise<boolean> => {
  const apiKey = useRuntimeConfig().public.gongeousApiKey || 'api-key'
  const expectedSignature = await generateSignature(apiKey, timestamp, payload)
  return signature === expectedSignature
}

const verifyStatsUser = async (header: string, deadline: AbortSignal) => {
  const token = /^Bearer (\S+)$/i.exec(header)?.[1]
  if (!token) throw createForbiddenError('invalid')
  deadline.throwIfAborted()
  let abort: (() => void) | undefined
  try {
    const expired = new Promise<never>((_resolve, reject) => {
      abort = () => reject(deadline.reason)
      deadline.addEventListener('abort', abort, { once: true })
    })
    const { data, error } = await Promise.race([
      useSupabaseServerClient().auth.getUser(token),
      expired,
    ])
    if (error && isTransientSupabaseError(error)) throw error
    if (error || !data.user) throw createForbiddenError('invalid')
    return data.user.id
  } finally {
    if (abort) deadline.removeEventListener('abort', abort)
  }
}

export default defineEventHandler(async (event) => {
  const receivedAt = Date.now()
  const deadline = AbortSignal.timeout(40_000)
  const signature = getHeader(event, 'x-signature')
  const timestamp = getHeader(event, 'x-timestamp')

  if (!signature || !timestamp) {
    throw createForbiddenError('missing')
  }

  const requestTime = Number(timestamp)
  if (Number.isNaN(requestTime) || !verifyTimestamp(requestTime)) {
    throw createForbiddenError('expired')
  }

  // Determine target table based on x-target header
  const target = getHeader(event, 'x-target')
  if (target && target !== 'game' && target !== 'pearpal') {
    throw invalidBannerStats()
  }
  const source = target === 'pearpal' ? 'pearpal' : 'game'
  const targetTable =
    source === 'pearpal' ? 'user_banner_stats_pearpal' : 'user_banner_stats'

  try {
    const body = await readBannerStatsImport(event)

    if (!(await verifySignature(signature, requestTime, body))) {
      throw createForbiddenError('invalid')
    }

    const mode = getBannerStatsWriteMode()
    if (mode === 'paused') {
      throw createApiFailureError('update banner stats', { transient: true })
    }

    const authorization = getHeader(event, 'authorization')
    const userId = authorization
      ? await verifyStatsUser(authorization, deadline)
      : undefined
    const upload = prepareBannerStatsImport(body, receivedAt, userId)
    deadline.throwIfAborted()
    if (upload.rows.length && mode === 'supabase') {
      const supabase = useSupabaseServerClient()
      const { error } = await withSupabaseRetry(() => {
        deadline.throwIfAborted()
        return supabase
          .from(targetTable)
          .upsert(upload.rows as never, {
            onConflict: 'uid,region,banner_id',
            ignoreDuplicates: false,
          })
          .abortSignal(deadline)
      })
      if (error) throw error
    } else if (upload.rows.length) {
      await writeBannerStatsD1(source, upload.body, deadline)
    }
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

    const operation = 'update banner stats'
    console.error(`Failed to ${operation}:`, error)
    throw createApiFailureError(operation, {
      transient: deadline.aborted || isTransientSupabaseError(error),
    })
  }
})
