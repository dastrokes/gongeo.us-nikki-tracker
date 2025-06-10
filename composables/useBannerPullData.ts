import { ref } from 'vue'
import { useBannerPullApi } from './useBannerPullApi'
import { usePullStore } from '~/stores/pull'
import type {
  PullRecord,
  ProcessedBanner,
  GlobalStats,
  PullItem,
  EditRecord,
} from '~/types/pull'
import type { BannerData } from '~/types/banner'
import { BANNER_DATA } from '~/data/banners'
import type { Outfit } from '~/types/outfit'
import { getOutfitData } from '~/utils/utils'

export const useBannerPullData = () => {
  const isFetching = ref(false)
  const { progress, fetchPullHistory } = useBannerPullApi()
  const pullStore = usePullStore()

  const processJsonImport = async (jsonData: Record<number, PullRecord[]>) => {
    const { loadData, saveData, mergePullData } = useIndexedDB()
    const { pulls: existingPullData, edits: existingEditData } =
      await loadData()

    const mergedData = mergePullData(existingPullData, jsonData)
    saveData(mergedData, existingEditData)

    await pullStore.processPullData(mergedData, existingEditData)
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
      const { pulls: existingPullData, edits: existingEditData } =
        await loadData()

      const mergedData = mergePullData(existingPullData, pullsByBanner)
      saveData(mergedData, existingEditData)

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
      const currentBanner = processedPulls[bannerId]

      let pullIndex = 0
      processedPullsArray.forEach((pull) => {
        const [time, itemId] = pull

        // Only increment stats for actual pulls (not manual or edit entries)
        currentBanner.stats.totalPulls++
        currentPity[bannerId][4]++
        currentPity[bannerId][5]++
        pullIndex++

        const itemInfo = itemToOutfitMap[itemId]
        if (itemInfo) {
          const { outfit } = itemInfo
          const itemData = outfit.items.find((id) => id === itemId)
          if (!itemData) return

          const rarity = outfit.rarity || 0
          const outfitId = outfit.id

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

        const itemCount: Record<string, number> = {}
        const edits = editsByBanner?.[bannerId] || []
        const currentBanner = processedPulls[bannerId]

        // Calculate item count and outfit completion
        let pullIndex = 0
        edits.forEach((edit) => {
          pullIndex--
          const pullInfo: PullItem = {
            bannerId,
            pullIndex: pullIndex,
            pullsToObtain: 0,
            count: 0,
            ...edit,
          }

          currentBanner.pulls.unshift(pullInfo)
        })
        const pullsByOutfit: Record<string, Set<PullItem>> = {}
        currentBanner.pulls.forEach((pull) => {
          itemCount[pull.itemId] = (itemCount[pull.itemId] || 0) + 1
          pull.count = itemCount[pull.itemId]

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
