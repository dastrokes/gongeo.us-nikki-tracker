import type { UserBannerStats } from '~/types/stats'
import crypto from 'crypto'

export const useUserBannerStats = () => {
  const generateSignature = (
    timestamp: number,
    method: string,
    path: string
  ) => {
    const secret = process.env.APP_SECRET || 'your-secret-key'
    return crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}:${method}:${path}`)
      .digest('hex')
  }

  const sendUserBannerStats = async (data: UserBannerStats[]) => {
    try {
      const timestamp = Math.floor(Date.now() / 1000)
      const signature = generateSignature(timestamp, 'POST', '/api/stats')

      const response = await $fetch('/api/stats', {
        method: 'POST',
        body: data,
        headers: {
          'Content-Type': 'application/json',
          'X-App-Signature': signature,
          'X-Timestamp': timestamp.toString(),
        },
      })

      return response.success === true
    } catch (error) {
      console.error('Error sending banner stats:', error)
      return false
    }
  }

  return {
    sendUserBannerStats,
  }
}
