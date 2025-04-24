import { ref } from 'vue'
import { useBannerPullApi } from './useBannerPullApi'
import { usePullStore } from '~/stores/pull'

export const useBannerPullData = () => {
  const { fetchPullHistory } = useBannerPullApi()
  const pullStore = usePullStore()

  const isLoading = ref(false)
  const currentPage = ref(1)
  const hasMoreData = ref(true)
  const error = ref<string | null>(null)

  const fetchData = async () => {
    if (!hasMoreData.value || isLoading.value) return

    isLoading.value = true
    error.value = null

    try {
      const response = await fetchPullHistory(currentPage.value)

      if (response && response.code === 0 && response.data?.datas) {
        // Transform the data into the format expected by the store
        const pullsByBanner: Record<
          string,
          Array<{ time: string; itemId: string; bannerId: string }>
        > = {}

        // Process the data for each banner
        const bannerData = response.data.datas

        // Initialize the banner entry if it doesn't exist
        if (!pullsByBanner[response.banner_id]) {
          pullsByBanner[response.banner_id] = []
        }

        // Add all pulls from this response to the banner
        bannerData.forEach(([time, itemId]: [string, string]) => {
          pullsByBanner[response.banner_id].push({
            time: new Date(time).toISOString(),
            itemId,
            bannerId: response.banner_id,
          })
        })

        // Process the data in the store
        await pullStore.processPullsData(pullsByBanner)

        // Check if we have more data to fetch
        hasMoreData.value = !response.data.end
        if (hasMoreData.value) {
          currentPage.value++
        }
      } else {
        hasMoreData.value = false
      }
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : 'Failed to fetch pull history'
      hasMoreData.value = false
    } finally {
      isLoading.value = false
    }
  }

  const fetchAllData = async () => {
    currentPage.value = 1
    hasMoreData.value = true
    error.value = null
    pullStore.reset()

    while (hasMoreData.value && !error.value) {
      await fetchData()
      if (hasMoreData.value) {
        // Wait for 1 second before the next request
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }
  }

  return {
    isLoading,
    currentPage,
    hasMoreData,
    error,
    fetchData,
    fetchAllData,
  }
}
