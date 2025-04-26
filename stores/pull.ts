import { defineStore } from 'pinia'
import type { BannerData } from '~/types/banner'
import type { Outfit } from '~/types/outfit'
import { BANNER_DATA } from '~/data/banners'
import OUTFIT_DATA, { type OutfitKey } from '~/data/outfits'
import type {
  JsonData,
  PullRecord,
  PullItem,
  ProcessedBanner,
  PullState,
} from '~/types/pull'

export const usePullStore = defineStore('pull', {
  state: (): PullState => ({
    processedPulls: {},
    isProcessing: false,
    isLoading: false,
    error: null,
    totalPulls: 0,
    total4StarItems: 0,
    total5StarItems: 0,
    avg5StarPulls: 0,
    avg4StarPulls: 0,
  }),

  getters: {
    getPullsByBanner: (state) => (bannerId: string) => {
      return state.processedPulls[bannerId] || null
    },

    getBannerStats: (state) => (bannerId: string) => {
      const banner = state.processedPulls[bannerId]
      if (!banner) return null

      return {
        totalPulls: banner.stats.totalPulls,
        total4Stars: banner.stats.total4StarItems,
        total5Stars: banner.stats.total5StarItems,
        pity4Star: banner.stats.pity4Star,
        pity5Star: banner.stats.pity5Star,
      }
    },

    hasError: (state) => !!state.error,
    isLoadingOrProcessing: (state) => state.isLoading || state.isProcessing,

    globalStats: (state) => ({
      totalPulls: state.totalPulls,
      total4StarItems: state.total4StarItems,
      total5StarItems: state.total5StarItems,
      avg5StarPulls: state.avg5StarPulls,
      avg4StarPulls: state.avg4StarPulls,
    }),
  },

  actions: {
    clearError() {
      this.error = null
    },

    reset() {
      // Reset all state properties to their initial values
      this.processedPulls = {}
      this.isProcessing = false
      this.isLoading = false
      this.error = null
      this.totalPulls = 0
      this.total4StarItems = 0
      this.total5StarItems = 0
      this.avg5StarPulls = 0
      this.avg4StarPulls = 0
    },

    getBannerOutfitIds(bannerId: number) {
      const banner = (BANNER_DATA as BannerData)[bannerId]
      if (!banner) return { outfit4StarId: [], outfit5StarId: [] }
      return {
        outfit4StarId: banner.outfit4StarId || [],
        outfit5StarId: banner.outfit5StarId || [],
      }
    },

    getOutfitData(outfitId: string): Outfit | null {
      try {
        return OUTFIT_DATA[outfitId as OutfitKey] || null
      } catch (error) {
        console.error(`Failed to load outfit ${outfitId}:`, error)
        return null
      }
    },

    getBannerName(bannerId: number): string {
      const banner = (BANNER_DATA as BannerData)[bannerId]
      return banner ? banner.bannerName : 'Unknown Banner'
    },

    async loadJsonData() {
      if (this.isLoading) return

      this.isLoading = true
      this.error = null

      try {
        const jsonData = (await import('../data/mock.json'))
          .default as unknown as JsonData[]
        const pullsByBanner: Record<number, PullRecord[]> = {}

        jsonData.forEach((data) => {
          const bannerId = data.banner_id
          if (!pullsByBanner[bannerId]) {
            pullsByBanner[bannerId] = []
          }

          // Process each pull data entry
          data.data.datas.forEach(([time, itemId]) => {
            pullsByBanner[bannerId].push([time, itemId] as PullRecord)
          })
        })

        // Save to IndexedDB asynchronously without awaiting
        const { savePullData } = useIndexedDB()
        savePullData(pullsByBanner)

        await this.processPullsData(pullsByBanner)
      } catch (err) {
        this.error =
          err instanceof Error ? err.message : 'Failed to load json data'
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async loadAllPulls() {
      if (this.isLoading) return

      this.isLoading = true
      this.error = null

      try {
        const { fetchAllData } = useBannerPullData()
        await fetchAllData()
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to load pulls'
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async processPullsData(pullsByBanner: Record<number, PullRecord[]>) {
      if (this.isProcessing) return

      this.isProcessing = true

      try {
        // Update total pulls
        this.totalPulls = Object.values(pullsByBanner).reduce(
          (sum, pulls) => sum + pulls.length,
          0
        )

        const bannerPulls: Record<string, ProcessedBanner> = {}
        const currentPity: Record<string, Record<number, number>> = {}
        let total4Star = 0
        let total5Star = 0
        let fiveStarPullsToObtain = 0
        let fourStarPullsToObtain = 0
        let fiveStarCount = 0
        let fourStarCount = 0

        // Single loop to process all banner-related operations
        Object.values(BANNER_DATA as BannerData).forEach((bannerInfo) => {
          const bannerId = bannerInfo.bannerId
          // 1. Create outfit lookup maps for this banner
          const outfitLookup = {
            4: new Map<string, Outfit | null>(),
            5: new Map<string, Outfit | null>(),
          }
          const itemToOutfitMap: Record<
            string,
            { outfitId: string; rarity: number; outfit: Outfit }
          > = {}

          // Process 4★ outfits
          ;(bannerInfo.outfit4StarId || []).forEach((id: string) => {
            const outfit = this.getOutfitData(id)
            outfitLookup[4].set(id, outfit)
            if (outfit) {
              outfit.items.forEach((item) => {
                itemToOutfitMap[item.id] = { outfitId: id, rarity: 4, outfit }
              })
            }
          })

          // Process 5★ outfits
          ;(bannerInfo.outfit5StarId || []).forEach((id: string) => {
            const outfit = this.getOutfitData(id)
            outfitLookup[5].set(id, outfit)
            if (outfit) {
              outfit.items.forEach((item) => {
                itemToOutfitMap[item.id] = { outfitId: id, rarity: 5, outfit }
              })
            }
          })

          // 2. Initialize banner data structures
          currentPity[bannerId] = { 4: 0, 5: 0 }
          const initialBanner: ProcessedBanner = {
            pulls: [],
            outfits: [],
            stats: {
              lastPull: null,
              totalPulls: 0,
              totalItems: 0,
              pity4Star: 0,
              pity5Star: 0,
              avg4StarPulls: 0,
              avg5StarPulls: 0,
              total4StarItems: 0,
              total5StarItems: 0,
              isComplete: false,
            },
            bannerId: bannerId,
            bannerName: bannerInfo.bannerName,
            bannerType: bannerInfo.bannerType,
            isComplete: false,
          }
          bannerPulls[bannerId] = initialBanner

          // Pre-populate outfit data
          ;[...outfitLookup[4].entries(), ...outfitLookup[5].entries()].forEach(
            ([outfitId, outfitData]) => {
              if (outfitData) {
                bannerPulls[bannerId].outfits.push({
                  id: outfitId,
                  name: outfitData.name,
                  rarity: outfitLookup[5].has(outfitId) ? 5 : 4,
                  items: outfitData.items,
                  isComplete: false,
                  totalItems: outfitData.items.length,
                  obtainedItems: 0,
                })
              }
            }
          )

          // 3. Process pulls for this banner
          const pulls = pullsByBanner[bannerId] || []
          const processedPulls = [...pulls].reverse()
          const itemObtained: Record<string, boolean> = {}
          const firstObtainInfo: Record<string, PullItem> = {}
          const currentBanner = bannerPulls[bannerId]

          processedPulls.forEach((pull, index) => {
            currentBanner.stats.totalPulls++
            currentPity[bannerId][4]++
            currentPity[bannerId][5]++

            const [time, itemId] = pull
            const itemInfo = itemToOutfitMap[itemId]
            if (itemInfo) {
              const { outfitId, rarity, outfit } = itemInfo
              const itemData = outfit.items.find((item) => item.id === itemId)
              if (!itemData) return

              const pullsToObtain = currentPity[bannerId][rarity]
              currentPity[bannerId][rarity] = 0

              const pullInfo: PullItem = {
                itemId,
                itemName: itemData.name,
                itemType: itemData.type,
                outfitId,
                rarity: rarity as number,
                outfitName: outfit.name,
                pullsToObtain,
                obtainedAt: time || '',
                bannerId: bannerId,
                obtained: true,
                pullIndex: index + 1,
                duplicate: itemObtained[itemId] || false,
              }

              if (!firstObtainInfo[itemId]) {
                firstObtainInfo[itemId] = pullInfo
              }
              itemObtained[itemId] = true
              currentBanner.pulls.unshift(pullInfo)
              currentBanner.stats.totalItems++

              if (rarity === 5) {
                total5Star++
                fiveStarPullsToObtain += pullsToObtain
                fiveStarCount++
              } else {
                total4Star++
                fourStarPullsToObtain += pullsToObtain
                fourStarCount++
              }
            }

            if (!currentBanner.stats.lastPull) {
              currentBanner.stats.lastPull = time
            }
          })

          // 4. Calculate banner-specific stats
          const bannerType = bannerInfo.bannerType || 1
          const stats = currentBanner.stats
          const currentPulls = currentBanner.pulls

          if (bannerType === 1) {
            // Permanent
            stats.total5StarItems = currentPulls.filter(
              (item: PullItem) => item.rarity === 5 && item.obtained
            ).length
            const fiveStarPulls = currentPulls.filter(
              (item: PullItem) => item.rarity === 5 && item.obtained
            )
            stats.avg5StarPulls =
              fiveStarPulls.length > 0
                ? fiveStarPulls.reduce(
                    (sum: number, item: PullItem) => sum + item.pullsToObtain,
                    0
                  ) / fiveStarPulls.length
                : 0
          } else if (bannerType === 2) {
            // Limited 5★ with 4★
            const fourStarPulls = currentPulls.filter(
              (item: PullItem) => item.rarity === 4 && item.obtained
            )
            const fiveStarPulls = currentPulls.filter(
              (item: PullItem) => item.rarity === 5 && item.obtained
            )

            stats.total4StarItems = fourStarPulls.length
            stats.total5StarItems = fiveStarPulls.length

            stats.avg4StarPulls =
              fourStarPulls.length > 0
                ? fourStarPulls.reduce(
                    (sum: number, item: PullItem) => sum + item.pullsToObtain,
                    0
                  ) / fourStarPulls.length
                : 0
            stats.avg5StarPulls =
              fiveStarPulls.length > 0
                ? fiveStarPulls.reduce(
                    (sum: number, item: PullItem) => sum + item.pullsToObtain,
                    0
                  ) / fiveStarPulls.length
                : 0
          } else if (bannerType === 3) {
            // Limited 4★
            const fourStarPulls = currentPulls.filter(
              (item: PullItem) => item.rarity === 4 && item.obtained
            )
            stats.total4StarItems = fourStarPulls.length
            stats.avg4StarPulls =
              fourStarPulls.length > 0
                ? fourStarPulls.reduce(
                    (sum: number, item: PullItem) => sum + item.pullsToObtain,
                    0
                  ) / fourStarPulls.length
                : 0
          }

          stats.pity4Star = currentPity[bannerId][4]
          stats.pity5Star = currentPity[bannerId][5]

          // Calculate outfit completion
          const pullsByOutfit: Record<string, Set<string>> = {}
          currentBanner.pulls.forEach((pull) => {
            if (!pullsByOutfit[pull.outfitId]) {
              pullsByOutfit[pull.outfitId] = new Set()
            }
            if (pull.obtained) {
              pullsByOutfit[pull.outfitId].add(pull.itemId)
            }
          })

          currentBanner.outfits.forEach((outfit) => {
            const obtainedItems = pullsByOutfit[outfit.id] || new Set()
            outfit.obtainedItems = obtainedItems.size
            outfit.isComplete = outfit.items.every((item) =>
              obtainedItems.has(item.id)
            )
          })

          currentBanner.isComplete =
            currentBanner.outfits.length > 0 &&
            currentBanner.outfits.every((outfit) => outfit.isComplete)
        })

        // Update global stats
        this.total5StarItems = total5Star
        this.total4StarItems = total4Star
        this.avg5StarPulls =
          fiveStarCount > 0 ? fiveStarPullsToObtain / fiveStarCount : 0
        this.avg4StarPulls =
          fourStarCount > 0 ? fourStarPullsToObtain / fourStarCount : 0

        this.processedPulls = bannerPulls
      } catch (err) {
        this.error =
          err instanceof Error ? err.message : 'Failed to process pulls data'
      } finally {
        this.isProcessing = false
      }
    },

    async addMissingItems(bannerId: number) {
      const bannerInfo = (BANNER_DATA as BannerData)[bannerId]
      if (!bannerInfo) return

      if (!this.processedPulls[bannerId]) {
        this.processedPulls[bannerId] = {
          pulls: [],
          outfits: [],
          stats: {
            lastPull: null,
            totalPulls: 0,
            totalItems: 0,
            pity4Star: 0,
            pity5Star: 0,
            avg4StarPulls: 0,
            avg5StarPulls: 0,
            total4StarItems: 0,
            total5StarItems: 0,
            isComplete: false,
          },
          bannerId: bannerId,
          bannerName: bannerInfo.bannerName,
          bannerType: bannerInfo.bannerType,
          isComplete: false,
        }
      }

      const { outfit4StarId, outfit5StarId } = this.getBannerOutfitIds(bannerId)

      if (!this.processedPulls[bannerId].outfits.length) {
        for (const outfitId of outfit4StarId) {
          const outfitData = this.getOutfitData(outfitId)
          if (outfitData) {
            this.processedPulls[bannerId].outfits.push({
              id: outfitId,
              name: outfitData.name,
              rarity: 4,
              items: outfitData.items,
              isComplete: false,
              totalItems: outfitData.items.length,
              obtainedItems: 0,
            })
          }
        }
        for (const outfitId of outfit5StarId) {
          const outfitData = this.getOutfitData(outfitId)
          if (outfitData) {
            this.processedPulls[bannerId].outfits.push({
              id: outfitId,
              name: outfitData.name,
              rarity: 5,
              items: outfitData.items,
              isComplete: false,
              totalItems: outfitData.items.length,
              obtainedItems: 0,
            })
          }
        }
      }

      for (const outfit of this.processedPulls[bannerId].outfits) {
        const obtainedItemIds = this.processedPulls[bannerId].pulls
          .filter((pull) => pull.outfitId === outfit.id)
          .map((pull) => pull.itemId)

        for (const item of outfit.items) {
          if (!obtainedItemIds.includes(item.id)) {
            this.processedPulls[bannerId].pulls.push({
              itemId: item.id,
              itemName: item.name,
              itemType: item.type,
              outfitId: outfit.id,
              rarity: outfit.rarity as number,
              outfitName: outfit.name,
              pullsToObtain: 0,
              obtainedAt: '',
              bannerId: bannerId,
              obtained: false,
              pullIndex: 0,
              duplicate: false,
            })
          }
        }
      }
    },

    async loadSavedPulls() {
      if (this.isLoading) return

      this.isLoading = true
      this.error = null

      try {
        const { loadPullData } = useIndexedDB()
        const savedPulls = await loadPullData()

        if (savedPulls) {
          await this.processPullsData(savedPulls)
        }
      } catch (err) {
        this.error =
          err instanceof Error ? err.message : 'Failed to load saved pulls'
        throw err
      } finally {
        this.isLoading = false
      }
    },
  },
})
