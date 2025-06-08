import { ref } from 'vue'
import { useBannerPullApi } from './useBannerPullApi'
import { usePullStore } from '~/stores/pull'
import type {
  PullRecord,
  ProcessedBanner,
  GlobalStats,
  PullItem,
} from '~/types/pull'
import type { BannerData } from '~/types/banner'
import { BANNER_DATA } from '~/data/banners'
import type { Outfit } from '~/types/outfit'
import { getOutfitData } from '~/utils/utils'
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

    await pullStore.processPullData(mergedData)
    router.push(localePath('/tracker'))
  }

  const fetchBannerPullData = async (selectedBannerIds?: number[]) => {
    if (isFetching.value) return

    isFetching.value = true
    const pullsByBanner: Record<number, PullRecord[]> = {}

    try {
      // First, load existing data from IndexedDB
      const { loadPullData, savePullData, mergePullData } = useIndexedDB()
      const existingData = (await loadPullData()) || {}

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

      // Merge the new data with existing data from IndexedDB
      const mergedData = mergePullData(existingData, pullsByBanner)
      savePullData(mergedData)

      // Process the merged data in the store
      await pullStore.processPullData(mergedData)

      router.push(localePath('/tracker'))
    } catch (error) {
      console.error(error)
    } finally {
      isFetching.value = false
    }

    return pullsByBanner
  }

  const processBannerPullData = (
    pullsByBanner: Record<number, PullRecord[]>,
    calculateGlobalStats = true
  ) => {
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
      // 1. Create outfit lookup maps for this banner
      const outfitLookup = {
        4: new Map<string, Outfit | null>(),
        5: new Map<string, Outfit | null>(),
      }
      const itemToOutfitMap: Record<string, { outfit: Outfit }> = {}

      // Process 4★ outfits
      ;(bannerInfo.outfit4StarId || []).forEach((id: string) => {
        const outfit = getOutfitData(id)
        outfitLookup[4].set(id, outfit)
        if (outfit) {
          outfit.rarity = 4
          outfit.items.forEach((id) => {
            itemToOutfitMap[id] = { outfit }
          })
        }
      })

      // Process 5★ outfits
      ;(bannerInfo.outfit5StarId || []).forEach((id: string) => {
        const outfit = getOutfitData(id)
        outfitLookup[5].set(id, outfit)
        if (outfit) {
          outfit.rarity = 5
          outfit.items.forEach((id) => {
            itemToOutfitMap[id] = { outfit }
          })
        }
      })

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
          first4StarItemId: null,
          first5StarItemId: null,
        },
        bannerId: bannerId,
        bannerType: bannerInfo.bannerType,
        completion: 0,
      }
      processedPulls[bannerId] = initialBanner

      // Pre-populate outfit data
      ;[...outfitLookup[5].entries(), ...outfitLookup[4].entries()].forEach(
        ([outfitId, outfitData]) => {
          if (outfitData) {
            processedPulls[bannerId].outfits.push({
              id: outfitId,
              rarity: outfitLookup[5].has(outfitId) ? 5 : 4,
              items: outfitData.items,
              completion: 0,
              totalItems: outfitData.items.length,
              obtainedItems: 0,
            })
          }
        }
      )

      // 3. Process pulls for this banner
      const pulls = pullsByBanner[bannerId] || []
      const processedPullsArray = [...pulls].reverse()
      const itemCount: Record<string, number> = {}
      const firstObtainInfo: Record<string, PullItem> = {}
      const currentBanner = processedPulls[bannerId]

      // Track a separate index for non-manual entries
      let pullIndex = 0
      processedPullsArray.forEach((pull) => {
        const [time, itemId] = pull

        // Check if this is a manual entry
        const manual = time === 'manual'

        // Only increment stats for non-manual entries
        if (!manual) {
          currentBanner.stats.totalPulls++
          currentPity[bannerId][4]++
          currentPity[bannerId][5]++
          pullIndex++
        }

        const itemInfo = itemToOutfitMap[itemId]
        if (itemInfo) {
          const { outfit } = itemInfo
          const itemData = outfit.items.find((id) => id === itemId)
          if (!itemData) return

          const rarity = outfit.rarity || 3
          const outfitId = outfit.id

          // Only calculate pullsToObtain for non-manual entries
          const pullsToObtain = manual ? 0 : currentPity[bannerId][rarity]

          // Only reset pity for non-manual entries
          if (!manual) {
            currentPity[bannerId][rarity] = 0
          }

          // Increment the item counter
          itemCount[itemId] = (itemCount[itemId] || 0) + 1

          const pullInfo: PullItem = {
            itemId,
            outfitId,
            rarity,
            pullsToObtain,
            obtainedAt: time,
            bannerId: bannerId,
            count: itemCount[itemId],
            pullIndex: manual ? 0 : pullIndex,
          }

          if (itemCount[itemId] === 1) {
            // Track first item of each rarity (only for non-manual entries)
            if (!manual) {
              if (rarity === 4 && !currentBanner.stats.first4StarItemId) {
                currentBanner.stats.first4StarItemId = itemId
              } else if (
                rarity === 5 &&
                !currentBanner.stats.first5StarItemId
              ) {
                currentBanner.stats.first5StarItemId = itemId
              }
            }
            firstObtainInfo[itemId] = pullInfo
          }
          currentBanner.pulls.unshift(pullInfo)
          currentBanner.stats.totalItems++

          // Update global stats
          if (calculateGlobalStats && !manual && bannerInfo.bannerType !== 1) {
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

        // Always update lastPull with the most recent non-manual pull time
        if (!manual) {
          currentBanner.stats.lastPull = time || currentBanner.stats.lastPull
        }
      })

      // 4. Calculate banner-specific stats
      const bannerType = bannerInfo.bannerType || 1
      const stats = currentBanner.stats
      const currentPulls = currentBanner.pulls
      if (bannerType === 1) {
        // Permanent
        const fourStarPulls = currentPulls.filter(
          (item: PullItem) => item.rarity === 4 && item.count > 0
        )
        const fiveStarPulls = currentPulls.filter(
          (item: PullItem) => item.rarity === 5 && item.count > 0
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
          (item: PullItem) => item.rarity === 4 && item.count > 0
        )
        const fiveStarPulls = currentPulls.filter(
          (item: PullItem) => item.rarity === 5 && item.count > 0
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
          (item: PullItem) => item.rarity === 4 && item.count > 0
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

      // Calculate outfit completion
      const pullsByOutfit: Record<string, Set<PullItem>> = {}
      currentBanner.pulls.forEach((pull) => {
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

      currentBanner.completion = Math.floor(
        currentBanner.outfits.reduce(
          (sum, outfit) => sum + outfit.completion,
          0
        ) / currentBanner.outfits.length
      )
    })

    // Update global stats only if calculateGlobalStats is true
    if (calculateGlobalStats) {
      globalStats.totalPulls = Object.values(pullsByBanner).reduce(
        (sum, pulls) => {
          // Filter out manual entries when counting total pulls
          return sum + pulls.filter((p) => p[0] !== 'manual').length
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
