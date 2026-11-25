import { createHmac } from 'node:crypto'

import { verifyStatsUser } from '../../utils/bannerStatsAuth'

export default defineEventHandler(async (event) => {
  const authorization = getHeader(event, 'authorization')
  if (!authorization || authorization.length > 4_096) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  if (Number(getHeader(event, 'content-length')) > 1_024) {
    throw createError({ statusCode: 413, statusMessage: 'Request too large' })
  }
  const raw = await readRawBody(event, false)
  if (!raw || raw.byteLength > 1_024) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid ticket request',
    })
  }
  let input: { source?: unknown; bodyHash?: unknown } | null
  try {
    input = JSON.parse(raw.toString('utf8'))
  } catch {
    input = null
  }
  if (
    (input?.source !== 'game' && input?.source !== 'pearpal') ||
    typeof input.bodyHash !== 'string' ||
    !/^[a-f0-9]{64}$/.test(input.bodyHash)
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid ticket request',
    })
  }

  const secret = process.env.CLOUDFLARE_INGEST_TOKEN?.trim()
  if (!secret) {
    throw createApiFailureError('authorize stats upload', { transient: true })
  }
  const deadline = AbortSignal.timeout(8_000)
  let userId: string
  try {
    userId = await verifyStatsUser(authorization, deadline)
  } catch (error) {
    if (!deadline.aborted && !isTransientSupabaseError(error)) throw error
    throw createApiFailureError('authorize stats upload', { transient: true })
  }
  const claims = Buffer.from(
    JSON.stringify({
      userId,
      source: input.source,
      bodyHash: input.bodyHash,
      expiresAt: Math.floor(Date.now() / 1000) + 120,
    })
  ).toString('base64url')
  const unsigned = 'st1.' + claims
  const signature = createHmac('sha256', secret).update(unsigned).digest('hex')
  setHeader(event, 'Cache-Control', 'no-store')
  return { ticket: unsigned + '.' + signature }
})
