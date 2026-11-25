export const useUserBannerStats = () => {
  const sendUserBannerStats = async (
    processedPulls: Record<string, ProcessedBanner>
  ) => {
    const userStore = useUserStore()
    const uid = userStore.uid
    const region = userStore.region

    if (!uid) return

    // Hash the UID on client side
    const hashedUid = await hashUid(uid)

    // Collect all analytics data first
    const analyticsDataArray = Object.entries(processedPulls)
      .filter(([_, banner]) => banner.stats.totalPulls > 0)
      .map(([bannerId, banner]) => ({
        uid: hashedUid,
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
              pull.quality === 4 &&
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
              pull.quality === 5 &&
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

    try {
      return (await sendUserStats('game', analyticsDataArray)).success
    } catch (error) {
      console.error(
        'Error sending banner stats:',
        error instanceof Error ? error.message : 'Unknown error'
      )
      return false
    }
  }

  const sendUserStats = async (
    source: 'game' | 'pearpal',
    data: UserBannerStats[]
  ) => {
    if (!data.length) return { success: true }

    const supabase = useSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const userId = session?.user.id
    const payload = JSON.stringify(
      data.map((row) => ({ ...row, user_id: userId }))
    )

    const endpoint = import.meta.dev
      ? getDataApiUrl('/stats')
      : 'https://data.gongeo.us/v1/stats'
    return $fetch<{ success: boolean }>(endpoint, {
      method: 'POST',
      body: payload,
      credentials: 'omit',
      redirect: 'error',
      headers: {
        'Content-Type': 'application/json',
        'X-Target': source,
      },
      timeout: 15_000,
      retry: 1,
      retryStatusCodes: [500, 502, 503, 504],
    })
  }

  const importPearpalTrackerData = (bannerStats: UserBannerStats[]) =>
    sendUserStats('pearpal', bannerStats)

  return {
    sendUserBannerStats,
    importPearpalTrackerData,
  }
}
