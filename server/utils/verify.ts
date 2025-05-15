import crypto from 'crypto'

// Verifies if a request timestamp is within the allowed time window
export function verifyTimestamp(
  timestamp: number,
  maxAgeSeconds: number = 10
): boolean {
  const currentTime = Math.floor(Date.now() / 1000)
  return Math.abs(currentTime - timestamp) <= maxAgeSeconds
}

// Generates an HMAC signature for API request verification
export function generateSignature(timestamp: number, apiKey: string): string {
  return crypto
    .createHmac('sha256', apiKey)
    .update(`${timestamp}`)
    .digest('hex')
}

// Verifies if a request signature is valid
export function verifySignature(signature: string, timestamp: number): boolean {
  const config = useRuntimeConfig()
  const apiKey = config.public.gongeousApiKey || 'api-key'
  const expectedSignature = generateSignature(timestamp, apiKey)
  return signature === expectedSignature
}
