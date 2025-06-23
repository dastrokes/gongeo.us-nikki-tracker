import type { UserBannerStats } from '~/types/stats'

export function verifyTimestamp(
  timestamp: number,
  maxAgeSeconds: number = 10
): boolean {
  const currentTime = Math.floor(Date.now() / 1000)
  return Math.abs(currentTime - timestamp) <= maxAgeSeconds
}

export async function generateSignature(
  timestamp: number,
  payload: UserBannerStats[],
  apiKey: string
): Promise<string> {
  // Convert input to ArrayBuffer
  const encoder = new TextEncoder()
  const data = encoder.encode(`${timestamp}${JSON.stringify(payload)}`)
  const keyData = encoder.encode(apiKey)

  // Import the key
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  // Sign the data
  const signature = await crypto.subtle.sign('HMAC', key, data)

  // Convert to hex string
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function verifySignature(
  signature: string,
  timestamp: number,
  payload: UserBannerStats[],
  apiKey?: string
): Promise<boolean> {
  // Use provided apiKey or default to 'api-key'
  const key = apiKey || 'api-key'
  const expectedSignature = await generateSignature(timestamp, payload, key)
  return signature === expectedSignature
}
