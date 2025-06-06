import { ref } from 'vue'
import { useBannerPullApi } from './useBannerPullApi'
import { usePullStore } from '~/stores/pull'
import type { PullRecord } from '~/types/pull'
import { useRouter } from 'vue-router'

export const useBannerPullData = () => {
  const { fetchPullHistory, progress } = useBannerPullApi()
  const pullStore = usePullStore()
  const router = useRouter()
  const localePath = useLocalePath()

  const isFetching = ref(false)

  const processJsonImport = async (jsonData: Record<number, PullRecord[]>) => {
    const { loadPullData, savePullData, mergePullData } = useIndexedDB()
    const existingData = (await loadPullData()) || {}

    const mergedData = mergePullData(existingData, jsonData)
    savePullData(mergedData)

    await pullStore.processPullsData(mergedData)
    router.push(localePath('/tracker'))
  }

  const fetchPullData = async (selectedBannerIds?: number[]) => {
    if (isFetching.value) return

    isFetching.value = true

    try {
      // First, load existing data from IndexedDB
      const { loadPullData, savePullData, mergePullData } = useIndexedDB()
      const existingData = (await loadPullData()) || {}

      const responses = await fetchPullHistory(selectedBannerIds)
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

      // Merge the new data with existing data from IndexedDB
      const mergedData = mergePullData(existingData, pullsByBanner)

      savePullData(mergedData)

      // Process the merged data in the store
      await pullStore.processPullsData(mergedData)

      router.push(localePath('/tracker'))
    } catch (error) {
      console.error(error)
    } finally {
      isFetching.value = false
    }
  }

  return {
    isFetching,
    fetchPullData,
    processJsonImport,
    progress,
  }
}
