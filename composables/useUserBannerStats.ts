import type { ProcessedBanner } from '~/types/pull'
import type { UserBannerStats } from '~/types/stats'
import { hashUid } from '~/utils/hash'
import { generateSignature } from '~/utils/signature'

export const useUserBannerStats = () => {
  const runtimeConfig = useRuntimeConfig()
  const apiKey = runtimeConfig.public.gongeousApiKey || 'api-key'

  const sendUserBannerStats = async (
    processedPulls: Record<string, ProcessedBanner>
  ) => {
    const userStore = useUserStore()
    const uid = userStore.uid
    const region = userStore.region

    const supabase = useSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const userId = session?.user?.id

    if (!uid) return

    // Hash the UID on client side
    const hashedUid = await hashUid(uid)

    // Collect all analytics data first
    const analyticsDataArray = Object.entries(processedPulls)
      .filter(([_, banner]) => banner.stats.totalPulls > 0)
      .map(([bannerId, banner]) => ({
        uid: hashedUid,
        region,
        user_id: userId,
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
      const signature = await generateSignature(apiKey, timestamp, data)

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
      const supabase = useSupabaseClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const userId = session?.user?.id

      const payload: UserBannerStats[] = userId
        ? bannerStats.map((s) => ({ ...s, user_id: userId }))
        : bannerStats

      const timestamp = Math.floor(Date.now() / 1000)
      const signature = await generateSignature(apiKey, timestamp, payload)

      const response = await $fetch('/api/stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': signature,
          'X-Timestamp': timestamp.toString(),
          'X-Target': 'pearpal',
        },
        body: payload,
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

  return {
    sendUserBannerStats,
    importPearpalTrackerData,
  }
}
