import { createError } from 'h3'
import crypto from 'crypto'

export default defineEventHandler(async (event) => {
  // Only apply to API routes
  if (!event.path.startsWith('/api/')) {
    return
  }

  // Get signature and timestamp from headers
  const signature = getHeader(event, 'x-app-signature')
  const timestamp = getHeader(event, 'x-timestamp')

  if (!signature || !timestamp) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden - Missing signature or timestamp',
    })
  }

  // Verify timestamp is within 10 seconds
  const requestTime = parseInt(timestamp)
  const currentTime = Math.floor(Date.now() / 1000)
  if (Math.abs(currentTime - requestTime) > 10) {
    // 10 seconds
    throw createError({
      statusCode: 403,
      message: 'Forbidden - Request expired',
    })
  }

  // Verify signature
  const secret = process.env.APP_SECRET || 'your-secret-key'
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}:${event.method}:${event.path}`)
    .digest('hex')

  if (signature !== expectedSignature) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden - Invalid signature',
    })
  }
})
