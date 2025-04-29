import type { UserBannerStats } from '~/types'

export const useUserBannerStats = () => {
  const sendUserBannerStats = async (data: UserBannerStats[]) => {
    try {
      await $fetch('/api/stats/banner', {
        method: 'POST',
        body: data,
      })

      return true
    } catch (error) {
      console.error('Error sending banner stats:', error)
      return false
    }
  }

  return {
    sendUserBannerStats,
  }
}
