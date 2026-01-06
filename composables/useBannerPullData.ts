import type {
  PullRecord,
  ProcessedBanner,
  PullItem,
  EditRecord,
  EvoRecord,
  PearpalTrackerItem,
} from '~/types/pull'
import type { BannerData } from '~/types/banner'
import { BANNER_DATA } from '~/data/banners'

export const useBannerPullData = () => {
  const isFetching = ref(false)
  const { progress, fetchPullHistory } = useBannerPullApi()
  const pullStore = usePullStore()

  const processJsonImport = async (
    jsonData:
      | Record<number, PullRecord[]>
      | {
          pulls?: Record<number, PullRecord[]>
          edits?: Record<number, EditRecord[]>
          evo?: Record<number, EvoRecord[]>
          pearpal?: Record<number, PearpalTrackerItem[]>
        }
  ) => {
    const {
      loadData,
      saveData,
      mergePullData,
      mergeEditData,
      savePearpalData,
    } = useIndexedDB()
    const {
      pulls: existingPullData,
      edits: existingEditData,
      evo: existingEvoData,
      pearpal: existingPearpalData,
    } = await loadData()

    // Handle the new export format that can include pulls, edits, evo, and pearpal
    let pullsData: Record<number, PullRecord[]> = {}
    let editsData: Record<number, EditRecord[]> = {}
    let evoData: Record<number, EvoRecord[]> = {}
    let pearpalData: Record<number, PearpalTrackerItem[]> = {}

    if ('pulls' in jsonData || 'edits' in jsonData || 'pearpal' in jsonData) {
      // New format: { pulls: {...}, edits: {...}, evo: {...}, pearpal: {...} }
      pullsData =
        (jsonData as { pulls?: Record<number, PullRecord[]> }).pulls || {}
      editsData =
        (jsonData as { edits?: Record<number, EditRecord[]> }).edits || {}
      evoData = (jsonData as { evo?: Record<number, EvoRecord[]> }).evo || {}
      pearpalData =
        (jsonData as { pearpal?: Record<number, PearpalTrackerItem[]> })
          .pearpal || {}
    } else {
      // Legacy format: Record<number, PullRecord[]>
      pullsData = jsonData as Record<number, PullRecord[]>
      editsData = {}
      evoData = {}
      pearpalData = {}
    }

    const mergedPullsData = mergePullData(existingPullData, pullsData)
    const mergedEditsData = mergeEditData(existingEditData, editsData)
    const mergedEvoData = { ...existingEvoData, ...evoData }
    const mergedPearpalData = { ...existingPearpalData, ...pearpalData }

    // Save all data, including pearpal if present
    saveData(mergedPullsData, mergedEditsData, mergedEvoData)
    savePearpalData(mergedPearpalData)
  }

  const fetchBannerPullData = async (selectedBannerIds?: number[]) => {
    if (isFetching.value) return

    isFetching.value = true
    const pullsByBanner: Record<number, PullRecord[]> = {}

    try {
      const responses = await fetchPullHistory(selectedBannerIds)
      // Transform the data into the format expected by the store

      responses?.forEach((response) => {
        const resps = response.results
        if (Array.isArray(resps) && resps.length > 0) {
          resps.forEach((resp) => {
            const { data, banner_id } = resp
            if (Array.isArray(data.datas) && data.datas.length > 0) {
              if (!pullsByBanner[banner_id]) {
                pullsByBanner[banner_id] = data.datas
              } else {
                pullsByBanner[banner_id]!.push(...data.datas)
              }
            }
          })
        }
      })

      const { loadData, saveData, mergePullData } = useIndexedDB()
      const {
        pulls: existingPullData,
        edits: existingEditData,
        evo: existingEvoData,
      } = await loadData()

      const mergedData = mergePullData(existingPullData, pullsByBanner)
      saveData(mergedData, existingEditData, existingEvoData)

      await pullStore.processPullData(mergedData, existingEditData)
    } catch (error) {
      console.error(error)
    } finally {
      isFetching.value = false
    }

    return pullsByBanner
  }

  const processBannerPullData = (
    pullsByBanner: Record<number, PullRecord[]>,
    editsByBanner?: Record<number, EditRecord[]>
  ) => {
    const calculateStats = !!editsByBanner
    const processedPulls: Record<string, ProcessedBanner> = {}
    const currentPity: Record<string, Record<number, number>> = {}

    // Process each banner
    Object.values(BANNER_DATA as BannerData).forEach((bannerInfo) => {
      const bannerId = bannerInfo.bannerId
      const bannerType = bannerInfo.bannerType || 1

      // Get outfit IDs for this banner
      const { outfit4StarId, outfit5StarId } = getBannerOutfitIds(bannerId)
      const outfit4StarSet = new Set(outfit4StarId)
      const outfit5StarSet = new Set(outfit5StarId)

      // Initialize banner data structures
      currentPity[bannerId] = { 4: 0, 5: 0 }
      const currentBanner: ProcessedBanner = {
        pulls: [],
        outfits: [],
        stats: {
          lastPull: new Date(0).toISOString(),
          totalPulls: 0,
          totalItems: 0,
          pity4Star: 0,
          pity5Star: 0,
          avg4StarPulls: 0,
          avg5StarPulls: 0,
          avg4StarOnlyPulls: 0,
          total4StarItems: 0,
          total5StarItems: 0,
          total4StarOnlyItems: 0,
          total4StarPulls: 0,
          total5StarPulls: 0,
          total4StarOnlyPulls: 0,
          completion: 0,
        },
        bannerId: bannerId,
        bannerType: bannerInfo.bannerType,
      }
      processedPulls[bannerId] = currentBanner

      // Pre-populate outfit data
      for (const outfitId of [...outfit5StarId, ...outfit4StarId]) {
        const outfitData = getOutfitData(outfitId)
        if (outfitData) {
          currentBanner.outfits.push({
            id: outfitId,
            quality: outfit5StarSet.has(outfitId) ? 5 : 4,
            items: outfitData.items,
            completion: 0,
            totalItems: outfitData.items.length,
            obtainedItems: 0,
          })
        }
      }

      // Process pulls for this banner
      const pulls = pullsByBanner[bannerId] || []
      const pullsArray: PullItem[] = []
      let pullIndex = 0

      // Stats tracking variables
      let fourStarCount = 0
      let fiveStarCount = 0
      let fourStarPullsSum = 0
      let fiveStarPullsSum = 0
      let fourStarOnlyCount = 0
      let fourStarOnlyPullsSum = 0

      // Process pulls in reverse chronological order
      for (let i = pulls.length - 1; i >= 0; i--) {
        const pull = pulls[i]
        if (!pull) continue

        const [time, itemId] = pull

        // Increment stats for actual pulls
        currentBanner.stats.totalPulls++
        const pityRecord = currentPity[bannerId]!
        pityRecord[4] = (pityRecord[4] ?? 0) + 1
        pityRecord[5] = (pityRecord[5] ?? 0) + 1
        pullIndex++

        const outfitId = getOutfitIdFromItemId(itemId)
        let quality = 0

        if (outfit5StarSet.has(outfitId)) {
          quality = 5
        } else if (outfit4StarSet.has(outfitId)) {
          quality = 4
        }

        if (quality !== 0) {
          const pullsToObtain = pityRecord[quality] ?? 0
          pityRecord[quality] = 0

          const pullInfo: PullItem = {
            pullIndex,
            itemId,
            outfitId,
            quality,
            pullsToObtain,
            obtainedAt: time,
            bannerId: bannerId,
            count: 0,
          }

          pullsArray.push(pullInfo)
          currentBanner.stats.totalItems++

          // Track stats for this pull
          if (quality === 4) {
            if (bannerType === 3) {
              fourStarOnlyCount++
              fourStarOnlyPullsSum += pullsToObtain
            } else {
              fourStarCount++
              fourStarPullsSum += pullsToObtain
            }
          } else if (quality === 5) {
            fiveStarCount++
            fiveStarPullsSum += pullsToObtain
          }
        }

        currentBanner.stats.lastPull = time || currentBanner.stats.lastPull
      }

      // Reverse array once to get newest first
      currentBanner.pulls = pullsArray.reverse()

      // Set stats based on banner type
      const stats = currentBanner.stats
      if (bannerType === 1 || bannerType === 2) {
        stats.total4StarItems = fourStarCount
        stats.total5StarItems = fiveStarCount
        stats.total4StarPulls = fourStarPullsSum
        stats.total5StarPulls = fiveStarPullsSum
        stats.avg4StarPulls =
          fourStarCount > 0 ? fourStarPullsSum / fourStarCount : 0
        stats.avg5StarPulls =
          fiveStarCount > 0 ? fiveStarPullsSum / fiveStarCount : 0
        stats.total4StarOnlyItems = 0
        stats.avg4StarOnlyPulls = 0
      } else if (bannerType === 3) {
        stats.total4StarItems = 0
        stats.total5StarItems = 0
        stats.total4StarOnlyItems = fourStarOnlyCount
        stats.total4StarOnlyPulls = fourStarOnlyPullsSum
        stats.avg4StarPulls = 0
        stats.avg5StarPulls = 0
        stats.avg4StarOnlyPulls =
          fourStarOnlyCount > 0 ? fourStarOnlyPullsSum / fourStarOnlyCount : 0
      }

      stats.pity4Star = currentPity[bannerId]?.[4] ?? 0
      stats.pity5Star = currentPity[bannerId]?.[5] ?? 0

      // Process edits and calculate completion stats if needed
      if (calculateStats) {
        const edits = editsByBanner?.[bannerId] || []

        // Process edits into separate array
        let editPullIndex = 0
        const editPulls: PullItem[] = []

        for (const edit of edits) {
          const [time, itemId] = edit
          const outfitId = getOutfitIdFromItemId(itemId)
          let quality = 0

          if (outfit5StarSet.has(outfitId)) {
            quality = 5
          } else if (outfit4StarSet.has(outfitId)) {
            quality = 4
          }

          editPullIndex--
          editPulls.push({
            pullIndex: editPullIndex,
            itemId,
            outfitId,
            quality,
            pullsToObtain: 0,
            obtainedAt: time,
            bannerId: bannerId,
            count: 0,
          })
        }

        // Combine pulls and edits
        const allPulls = [...currentBanner.pulls, ...editPulls].reverse()

        // Count items and track outfit progress
        const itemCount: Record<string, number> = {}
        const pullsByOutfit: Record<string, Set<string>> = {}

        for (const pull of allPulls) {
          itemCount[pull.itemId] = (itemCount[pull.itemId] || 0) + 1
          pull.count = itemCount[pull.itemId]!

          if (!pullsByOutfit[pull.outfitId]) {
            pullsByOutfit[pull.outfitId] = new Set()
          }
          if (pull.count > 0) {
            pullsByOutfit[pull.outfitId]!.add(pull.itemId)
          }
        }

        // Update pulls array
        currentBanner.pulls = allPulls

        // Calculate outfit completion
        let totalCompletion = 0
        for (const outfit of currentBanner.outfits) {
          const obtainedItemIds = pullsByOutfit[outfit.id]
          outfit.obtainedItems = obtainedItemIds ? obtainedItemIds.size : 0
          outfit.completion =
            outfit.totalItems > 0
              ? Math.floor(outfit.obtainedItems / outfit.totalItems)
              : 0
          totalCompletion += Math.min(outfit.completion, 2)
        }

        const average =
          currentBanner.outfits.length > 0
            ? totalCompletion / currentBanner.outfits.length
            : 0
        currentBanner.stats.completion = Math.floor(average)
      }
    })

    return processedPulls
  }

  return {
    isFetching,
    fetchBannerPullData,
    processBannerPullData,
    processJsonImport,
    progress,
  }
}
