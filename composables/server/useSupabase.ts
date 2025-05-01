import type { UserBannerStats } from '~/types/stats'

export const useUserBannerStats = () => {
  const generateSignature = async (
    timestamp: number,
    method: string,
    path: string
  ) => {
    const config = useRuntimeConfig()
    const secret = config.gongeousSecretKey || 'secret-key'
    console.log('secret', secret)

    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret as string),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(`${timestamp}:${method}:${path}`)
    )
    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }

  const sendUserBannerStats = async (data: UserBannerStats[]) => {
    try {
      const timestamp = Math.floor(Date.now() / 1000)
      const signature = await generateSignature(timestamp, 'POST', '/api/stats')

      const response = await $fetch('/api/stats', {
        method: 'POST',
        body: data,
        headers: {
          'Content-Type': 'application/json',
          'X-App-Signature': signature,
          'X-Timestamp': timestamp.toString(),
        },
      })

      return (response as { success: boolean }).success === true
    } catch (error) {
      console.error('Error sending banner stats:', error)
      return false
    }
  }

  return {
    sendUserBannerStats,
  }
}
