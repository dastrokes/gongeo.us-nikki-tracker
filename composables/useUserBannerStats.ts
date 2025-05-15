import type { UserBannerStats } from '~/types/stats'

export const useUserBannerStats = () => {
  const generateSignature = async (timestamp: number) => {
    const config = useRuntimeConfig()
    const apiKey = config.public.gongeousApiKey || 'api-key'
    const encoder = new TextEncoder()
    const keyData = encoder.encode(apiKey)
    const msgData = encoder.encode(`${timestamp}`)

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signature = await crypto.subtle.sign('HMAC', key, msgData)

    // Convert to hex string in the same format as Node's crypto
    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }

  const sendUserBannerStats = async (data: UserBannerStats[]) => {
    try {
      const timestamp = Math.floor(Date.now() / 1000)
      const signature = await generateSignature(timestamp)

      const response = await $fetch('/api/stats', {
        method: 'POST',
        body: data,
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': signature,
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
