import type { UserBannerStats } from '~/types/stats'
import type { ProcessedBanner } from '~/types/pull'

export const useUserBannerStats = () => {
  const sendUserBannerStats = async (
    processedPulls: Record<string, ProcessedBanner>
  ) => {
    const userStore = useUserStore()
    const uid = userStore.uid
    const region = userStore.region

    if (!uid) return

    // Collect all analytics data first
    const analyticsDataArray = Object.entries(processedPulls)
      .filter(([_, banner]) => banner.stats.totalPulls > 0)
      .map(([bannerId, banner]) => ({
        uid,
        region,
        banner_id: Number(bannerId),
        banner_type: banner.bannerType,
        total_pulls: banner.stats.totalPulls,
        total_4star_items:
          banner.stats.total4StarItems + banner.stats.total4StarOnlyItems,
        total_5star_items: banner.stats.total5StarItems,
        total_4star_pulls:
          banner.stats.total4StarPulls + banner.stats.total4StarOnlyPulls,
        total_5star_pulls: banner.stats.total5StarPulls,
        pulls_4star: banner.pulls
          .filter(
            (pull) =>
              pull.rarity === 4 &&
              pull.pullsToObtain > 0 &&
              pull.obtainedAt !== '' &&
              pull.obtainedAt !== 'manual'
          )
          .map((pull) => ({
            item_id: pull.itemId,
            pulls_to_obtain: pull.pullsToObtain,
            obtained_at: pull.obtainedAt,
            pull_index: pull.pullIndex,
          }))
          .reverse(),
        pulls_5star: banner.pulls
          .filter(
            (pull) =>
              pull.rarity === 5 &&
              pull.pullsToObtain > 0 &&
              pull.obtainedAt !== '' &&
              pull.obtainedAt !== 'manual'
          )
          .map((pull) => ({
            item_id: pull.itemId,
            pulls_to_obtain: pull.pullsToObtain,
            obtained_at: pull.obtainedAt,
            pull_index: pull.pullIndex,
          }))
          .reverse(),
        last_pull_time: banner.stats.lastPull,
        updated_at: new Date().toISOString(),
      }))

    // Send all data in a single batch
    if (analyticsDataArray.length > 0) {
      await sendUserStats(analyticsDataArray)
    }
  }

  const sendUserStats = async (data: UserBannerStats[]) => {
    try {
      const timestamp = Math.floor(Date.now() / 1000)
      const signature = await generateSignature(timestamp, data)

      const response = await $fetch('/api/stats', {
        method: 'POST',
        body: data,
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': signature,
          'X-Timestamp': timestamp.toString(),
          'X-Target': 'game',
        },
      })

      return (response as { success: boolean }).success === true
    } catch (error) {
      console.error('Error sending banner stats:', error)
      return false
    }
  }

  // Import pearpal tracker data to internal API
  const importPearpalTrackerData = async (bannerStats: UserBannerStats[]) => {
    try {
      const timestamp = Math.floor(Date.now() / 1000)
      const signature = await generateSignature(timestamp, bannerStats)

      const response = await $fetch('/api/stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': signature,
          'X-Timestamp': timestamp.toString(),
          'X-Target': 'pearpal',
        },
        body: bannerStats,
      })

      return response
    } catch (err: Error | unknown) {
      const error =
        err instanceof Error
          ? err.message
          : 'Failed to import pearpal tracker data'
      throw new Error(error)
    }
  }

  const generateSignature = async (
    timestamp: number,
    payload: UserBannerStats[]
  ) => {
    const apiKey = useRuntimeConfig().public.gongeousApiKey || 'api-key'
    const encoder = new TextEncoder()
    const keyData = encoder.encode(apiKey)
    const msgData = encoder.encode(`${timestamp}${JSON.stringify(payload)}`)

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signature = await crypto.subtle.sign('HMAC', key, msgData)

    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }

  return {
    sendUserBannerStats,
    importPearpalTrackerData,
  }
}
