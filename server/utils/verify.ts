import type { UserBannerStats } from '~/types/stats'
import { generateSignature } from '~/utils/signature'

export function verifyTimestamp(
  timestamp: number,
  maxAgeSeconds: number = 10
): boolean {
  const currentTime = Math.floor(Date.now() / 1000)
  return Math.abs(currentTime - timestamp) <= maxAgeSeconds
}

export async function verifySignature(
  signature: string,
  timestamp: number,
  payload: UserBannerStats[]
): Promise<boolean> {
  const apiKey = useRuntimeConfig().public.gongeousApiKey || 'api-key'
  const expectedSignature = await generateSignature(apiKey, timestamp, payload)
  return signature === expectedSignature
}
