import { createError } from 'h3'
import type { UserBannerStats } from '~/types/stats'
import { generateSignature } from '~/utils/signature'

const createForbiddenError = (type?: string) =>
  createError({
    statusCode: 403,
    message: type ? `Forbidden - ${type}` : 'Forbidden',
  })

const verifyTimestamp = (
  timestamp: number,
  maxAgeSeconds: number = 10
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
  // Only apply to stats routes
  if (!event.path.startsWith('/api/stats')) {
    return
  }

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

  const body = await readBody<UserBannerStats[]>(event)

  if (!(await verifySignature(signature, requestTime, body))) {
    throw createForbiddenError('invalid')
  }
})
