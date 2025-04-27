import { ref } from 'vue'
import { useBannerPullApi } from './useBannerPullApi'
import { usePullStore } from '~/stores/pull'
import type { PullRecord } from '~/types/pull'
import { useRouter } from 'vue-router'

export const useBannerPullData = () => {
  const { fetchPullHistory, progress } = useBannerPullApi()
  const pullStore = usePullStore()
  const router = useRouter()

  const isFetching = ref(false)
  const currentPage = ref(1)
  const error = ref<string | null>(null)

  const processJsonImport = async (jsonData: Record<number, PullRecord[]>) => {
    // Save to IndexedDB asynchronously without awaiting
    const { savePullData } = useIndexedDB()
    savePullData(jsonData)

    await pullStore.processPullsData(jsonData, 'JSON')
    router.push('/tracker')
    return jsonData
  }

  const fetchData = async () => {
    if (isFetching.value) return

    isFetching.value = true
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

      // Save to IndexedDB asynchronously without awaiting
      const { savePullData } = useIndexedDB()
      savePullData(pullsByBanner)

      // Process the data in the store
      await pullStore.processPullsData(pullsByBanner, 'API')
      router.push('/tracker')
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : 'Failed to fetch pull history'
    } finally {
      isFetching.value = false
    }
  }

  const fetchAllData = async () => {
    currentPage.value = 1
    error.value = null
    pullStore.reset()

    await fetchData()
  }

  return {
    isFetching,
    currentPage,
    error,
    fetchData,
    fetchAllData,
    processJsonImport,
    progress,
  }
}
