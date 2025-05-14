import type { UserBannerStats } from '~/types/stats'

export const useUserBannerStats = () => {
  const sendUserBannerStats = async (data: UserBannerStats[]) => {
    try {
      const response = await $fetch('/api/stats', {
        method: 'POST',
        body: data,
        headers: {
          'Content-Type': 'application/json',
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
