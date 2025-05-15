import crypto from 'crypto'
import type { UserBannerStats } from '~/types/stats'

export function verifyTimestamp(
  timestamp: number,
  maxAgeSeconds: number = 10
): boolean {
  const currentTime = Math.floor(Date.now() / 1000)
  return Math.abs(currentTime - timestamp) <= maxAgeSeconds
}

export function generateSignature(
  timestamp: number,
  payload: UserBannerStats[],
  apiKey: string
): string {
  return crypto
    .createHmac('sha256', apiKey)
    .update(`${timestamp}${JSON.stringify(payload)}`)
    .digest('hex')
}

export function verifySignature(
  signature: string,
  timestamp: number,
  payload: UserBannerStats[]
): boolean {
  const config = useRuntimeConfig()
  const apiKey = config.public.gongeousApiKey || 'api-key'
  const expectedSignature = generateSignature(timestamp, payload, apiKey)
  return signature === expectedSignature
}
