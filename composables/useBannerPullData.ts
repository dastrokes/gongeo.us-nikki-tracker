import { ref } from 'vue'
import { useBannerPullApi } from './useBannerPullApi'
import { usePullStore } from '~/stores/pull'
import type { PullRecord } from '~/types/pull'

export const useBannerPullData = () => {
  const { fetchPullHistory } = useBannerPullApi()
  const pullStore = usePullStore()

  const isLoading = ref(false)
  const currentPage = ref(1)
  const error = ref<string | null>(null)

  const fetchData = async () => {
    if (isLoading.value) return

    isLoading.value = true
    error.value = null

    try {
      const responses = await fetchPullHistory()
      // Transform the data into the format expected by the store
      const pullsByBanner: Record<number, PullRecord[]> = {}

      responses?.forEach((response) => {
        const resps = response.results
        if (Array.isArray(resps) && resps.length > 0) {
          resps.forEach((resp) => {
            const { data, banner_id } = resp
            if (Array.isArray(data.datas) && data.datas.length > 0) {
              if (!pullsByBanner[banner_id]) {
                pullsByBanner[banner_id] = data.datas
              } else {
                pullsByBanner[banner_id].push(...data.datas)
              }
            }
          })
        }
      })

      // Process the data in the store
      await pullStore.processPullsData(pullsByBanner)
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : 'Failed to fetch pull history'
    } finally {
      isLoading.value = false
    }
  }

  const fetchAllData = async () => {
    currentPage.value = 1
    error.value = null
    pullStore.reset()

    await fetchData()
  }

  return {
    isLoading,
    currentPage,
    error,
    fetchData,
    fetchAllData,
  }
}
