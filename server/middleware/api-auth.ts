import { createError } from 'h3'
import { verifyTimestamp, verifySignature } from '../utils/verify'
import type { UserBannerStats } from '~/types/stats'

export default defineEventHandler(async (event) => {
  // Only apply to stats routes
  if (!event.path.startsWith('/api/stats')) {
    return
  }

  // Get signature and timestamp from headers
  const signature = getHeader(event, 'x-signature')
  const timestamp = getHeader(event, 'x-timestamp')

  if (!signature || !timestamp) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden - Missing signature or timestamp',
    })
  }

  const requestTime = parseInt(timestamp)
  if (!verifyTimestamp(requestTime)) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden - Request expired',
    })
  }

  const body = await readBody<UserBannerStats[]>(event)

  if (!verifySignature(signature, requestTime, body)) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden - Invalid signature',
    })
  }
})
