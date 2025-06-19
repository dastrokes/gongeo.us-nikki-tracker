import { ref } from 'vue'
import { useBannerPullApi } from './useBannerPullApi'
import { usePullStore } from '~/stores/pull'
import type {
  PullRecord,
  ProcessedBanner,
  GlobalStats,
  PullItem,
  EditRecord,
  EvoRecord,
} from '~/types/pull'
import type { BannerData } from '~/types/banner'
import { BANNER_DATA } from '~/data/banners'
import { getOutfitData, getBannerOutfitIds } from '~/utils/utils'

// Utility function to derive outfitId from itemId
const getOutfitIdFromItemId = (itemId: string): string => {
  // Extract last 4 digits and prepend 'S'
  const last4Digits = itemId.slice(-4)
  return `S${last4Digits}`
}

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
        }
  ) => {
    const { loadData, saveData, mergePullData, mergeEditData } = useIndexedDB()
    const {
      pulls: existingPullData,
      edits: existingEditData,
      evo: existingEvoData,
    } = await loadData()

    // Handle the new export format that can include both pulls and edits
    let pullsData: Record<number, PullRecord[]> = {}
    let editsData: Record<number, EditRecord[]> = {}
    let evoData: Record<number, EvoRecord[]> = {}

    if ('pulls' in jsonData || 'edits' in jsonData) {
      // New format: { pulls: {...}, edits: {...}, evo: {...} }
      pullsData = jsonData.pulls || {}
      editsData = jsonData.edits || {}
      evoData = jsonData.evo || {}
    } else {
      // Legacy format: Record<number, PullRecord[]>
      pullsData = jsonData as Record<number, PullRecord[]>
      editsData = {}
      evoData = {}
    }

    const mergedPullsData = mergePullData(existingPullData, pullsData)
    const mergedEditsData = mergeEditData(existingEditData, editsData)
    // For evolution data, just use the latest data (no merge needed)
    const mergedEvoData = { ...existingEvoData, ...evoData }

    saveData(mergedPullsData, mergedEditsData, mergedEvoData)

    await pullStore.processPullData(
      mergedPullsData,
      mergedEditsData,
      mergedEvoData
    )
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
                pullsByBanner[banner_id].push(...data.datas)
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

      await pullStore.processPullData(
        mergedData,
        existingEditData,
        existingEvoData
      )
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
    const globalStats: GlobalStats = {
      totalPulls: 0,
      total4StarItems: 0,
      total5StarItems: 0,
      total4StarOnlyItems: 0,
      avg5StarPulls: 0,
      avg4StarPulls: 0,
      avg4StarOnlyPulls: 0,
    }

    let total4Star = 0
    let total5Star = 0
    let total4StarOnly = 0
    let fiveStarPullsToObtain = 0
    let fourStarPullsToObtain = 0
    let fourStarOnlyPullsToObtain = 0
    let fiveStarCount = 0
    let fourStarCount = 0
    let fourStarOnlyCount = 0

    // Single loop to process all banner-related operations
    Object.values(BANNER_DATA as BannerData).forEach((bannerInfo) => {
      const bannerId = bannerInfo.bannerId

      // Get outfit IDs for this banner
      const { outfit4StarId, outfit5StarId } = getBannerOutfitIds(bannerId)

      const outfit4StarSet = new Set(outfit4StarId)
      const outfit5StarSet = new Set(outfit5StarId)

      // 2. Initialize banner data structures
      currentPity[bannerId] = { 4: 0, 5: 0 }
      const initialBanner: ProcessedBanner = {
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
      processedPulls[bannerId] = initialBanner

      // Pre-populate outfit data
      ;[...outfit5StarId, ...outfit4StarId].forEach((outfitId) => {
        const outfitData = getOutfitData(outfitId)
        if (outfitData) {
          processedPulls[bannerId].outfits.push({
            id: outfitId,
            rarity: outfit5StarSet.has(outfitId) ? 5 : 4,
            items: outfitData.items,
            completion: 0,
            totalItems: outfitData.items.length,
            obtainedItems: 0,
          })
        }
      })

      // 3. Process pulls for this banner
      const pulls = pullsByBanner[bannerId] || []

      const processedPullsArray = [...pulls].reverse()
      const currentBanner = processedPulls[bannerId]

      let pullIndex = 0
      processedPullsArray.forEach((pull) => {
        const [time, itemId] = pull

        // Only increment stats for actual pulls (not manual or edit entries)
        currentBanner.stats.totalPulls++
        currentPity[bannerId][4]++
        currentPity[bannerId][5]++
        pullIndex++

        const outfitId = getOutfitIdFromItemId(itemId)
        let rarity = 0

        if (outfit5StarSet.has(outfitId)) {
          rarity = 5
        } else if (outfit4StarSet.has(outfitId)) {
          rarity = 4
        }

        if (rarity !== 0) {
          const pullsToObtain = currentPity[bannerId][rarity]
          currentPity[bannerId][rarity] = 0

          const pullInfo: PullItem = {
            pullIndex,
            itemId,
            outfitId,
            rarity,
            pullsToObtain,
            obtainedAt: time,
            bannerId: bannerId,
            count: 0,
          }

          currentBanner.pulls.unshift(pullInfo)
          currentBanner.stats.totalItems++

          if (calculateStats && bannerInfo.bannerType !== 1) {
            if (bannerInfo.bannerType === 2) {
              if (rarity === 5) {
                total5Star++
                fiveStarPullsToObtain += pullsToObtain
                fiveStarCount++
              } else if (rarity === 4) {
                total4Star++
                fourStarPullsToObtain += pullsToObtain
                fourStarCount++
              }
            } else if (bannerInfo.bannerType === 3) {
              total4StarOnly++
              fourStarOnlyPullsToObtain += pullsToObtain
              fourStarOnlyCount++
            }
          }
        }

        currentBanner.stats.lastPull = time || currentBanner.stats.lastPull
      })

      // 4. Calculate banner-specific stats
      const bannerType = bannerInfo.bannerType || 1
      const stats = currentBanner.stats
      const currentPulls = currentBanner.pulls
      if (bannerType === 1) {
        // Permanent
        const fourStarPulls = currentPulls.filter(
          (item: PullItem) => item.rarity === 4
        )
        const fiveStarPulls = currentPulls.filter(
          (item: PullItem) => item.rarity === 5
        )
        stats.total4StarItems = fourStarPulls.length
        stats.total5StarItems = fiveStarPulls.length
        stats.total4StarPulls = fourStarPulls.reduce(
          (sum: number, item: PullItem) => sum + item.pullsToObtain,
          0
        )
        stats.total5StarPulls = fiveStarPulls.reduce(
          (sum: number, item: PullItem) => sum + item.pullsToObtain,
          0
        )
        stats.avg4StarPulls =
          fourStarPulls.length > 0
            ? stats.total4StarPulls / fourStarPulls.length
            : 0
        stats.avg5StarPulls =
          fiveStarPulls.length > 0
            ? stats.total5StarPulls / fiveStarPulls.length
            : 0
      } else if (bannerType === 2) {
        // Limited 5★ with 4★
        const fourStarPulls = currentPulls.filter(
          (item: PullItem) => item.rarity === 4
        )
        const fiveStarPulls = currentPulls.filter(
          (item: PullItem) => item.rarity === 5
        )

        stats.total4StarItems = fourStarPulls.length
        stats.total5StarItems = fiveStarPulls.length
        stats.total4StarOnlyItems = 0 // Reset for type 2 banners

        stats.total4StarPulls = fourStarPulls.reduce(
          (sum: number, item: PullItem) => sum + item.pullsToObtain,
          0
        )

        stats.avg4StarPulls =
          fourStarPulls.length > 0
            ? stats.total4StarPulls / fourStarPulls.length
            : 0

        stats.total5StarPulls = fiveStarPulls.reduce(
          (sum: number, item: PullItem) => sum + item.pullsToObtain,
          0
        )
        stats.avg5StarPulls =
          fiveStarPulls.length > 0
            ? stats.total5StarPulls / fiveStarPulls.length
            : 0
        stats.avg4StarOnlyPulls = 0 // Reset for type 2 banners
      } else if (bannerType === 3) {
        // Limited 4★
        const fourStarPulls = currentPulls.filter(
          (item: PullItem) => item.rarity === 4
        )
        stats.total4StarItems = 0 // Reset mixed banner stats
        stats.total5StarItems = 0 // Reset 5★ stats
        stats.total4StarOnlyItems = fourStarPulls.length
        stats.avg4StarPulls = 0 // Reset mixed banner stats
        stats.avg5StarPulls = 0 // Reset 5★ stats

        stats.total4StarOnlyPulls = fourStarPulls.reduce(
          (sum: number, item: PullItem) => sum + item.pullsToObtain,
          0
        )
        stats.avg4StarOnlyPulls =
          fourStarPulls.length > 0
            ? stats.total4StarOnlyPulls / fourStarPulls.length
            : 0
      }

      stats.pity4Star = currentPity[bannerId][4]
      stats.pity5Star = currentPity[bannerId][5]
    })

    // Update stats only if calculateStats is true
    if (calculateStats) {
      Object.values(BANNER_DATA as BannerData).forEach((bannerInfo) => {
        const bannerId = bannerInfo.bannerId

        // Get outfit IDs for this banner
        const { outfit4StarId, outfit5StarId } = getBannerOutfitIds(bannerId)

        const outfit4StarSet = new Set(outfit4StarId)
        const outfit5StarSet = new Set(outfit5StarId)

        const itemCount: Record<string, number> = {}
        const edits = editsByBanner?.[bannerId] || []
        const currentBanner = processedPulls[bannerId]

        // Calculate item count and outfit completion
        let pullIndex = 0
        edits.forEach((edit) => {
          const [time, itemId] = edit

          const outfitId = getOutfitIdFromItemId(itemId)
          let rarity = 0

          if (outfit5StarSet.has(outfitId)) {
            rarity = 5
          } else if (outfit4StarSet.has(outfitId)) {
            rarity = 4
          }

          pullIndex--
          const pullInfo: PullItem = {
            pullIndex,
            itemId,
            outfitId,
            rarity,
            pullsToObtain: 0,
            obtainedAt: time,
            bannerId: bannerId,
            count: 0,
          }

          currentBanner.pulls.push(pullInfo)
        })
        const pullsByOutfit: Record<string, Set<PullItem>> = {}
        currentBanner.pulls.reverse().forEach((pull) => {
          itemCount[pull.itemId] = (itemCount[pull.itemId] || 0) + 1
          // Cap the count at 2 for each item
          pull.count = Math.min(itemCount[pull.itemId], 2)

          if (!pullsByOutfit[pull.outfitId]) {
            pullsByOutfit[pull.outfitId] = new Set()
          }
          if (pull.count > 0) {
            pullsByOutfit[pull.outfitId].add(pull)
          }
        })

        currentBanner.outfits.forEach((outfit) => {
          const obtainedItems = pullsByOutfit[outfit.id] || new Set()
          outfit.obtainedItems = obtainedItems.size
          outfit.completion = Math.floor(obtainedItems.size / outfit.totalItems)
        })

        currentBanner.stats.completion = Math.floor(
          currentBanner.outfits.reduce(
            (sum, outfit) => sum + outfit.completion,
            0
          ) / currentBanner.outfits.length
        )
      })

      globalStats.totalPulls = Object.values(pullsByBanner).reduce(
        (sum, pulls) => {
          return sum + pulls.length
        },
        0
      )
      globalStats.total5StarItems = total5Star
      globalStats.total4StarItems = total4Star
      globalStats.total4StarOnlyItems = total4StarOnly
      globalStats.avg5StarPulls =
        fiveStarCount > 0 ? fiveStarPullsToObtain / fiveStarCount : 0
      globalStats.avg4StarPulls =
        fourStarCount > 0 ? fourStarPullsToObtain / fourStarCount : 0
      globalStats.avg4StarOnlyPulls =
        fourStarOnlyCount > 0
          ? fourStarOnlyPullsToObtain / fourStarOnlyCount
          : 0
    }

    return {
      processedPulls,
      globalStats,
    }
  }

  return {
    isFetching,
    fetchBannerPullData,
    processBannerPullData,
    processJsonImport,
    progress,
  }
}
