import { defineStore } from 'pinia'
import type { BannerData } from '~/types/banner'
import type { Outfit } from '~/types/outfit'
import { BANNER_DATA } from '~/data/banners'
import OUTFIT_DATA, { type OutfitKey } from '~/data/outfits'
import { useUserBannerStats } from '~/composables/useUserBannerStats'
import type {
  PullRecord,
  PullItem,
  ProcessedBanner,
  PullState,
} from '~/types/pull'
import { useUserStore } from '~/stores/user'

export const usePullStore = defineStore('pull', {
  state: (): PullState => ({
    processedPulls: {},
    rawPullData: {},
    globalStats: {
      totalPulls: 0,
      total4StarItems: 0,
      total5StarItems: 0,
      total4StarOnlyItems: 0,
      avg5StarPulls: 0,
      avg4StarPulls: 0,
      avg4StarOnlyPulls: 0,
    },
    isProcessing: false,
    isLoading: false,
    error: null,
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

    getGlobalStats: (state) => state.globalStats,
  },

  actions: {
    clearError() {
      this.error = null
    },

    reset() {
      // Reset all state properties to their initial values
      this.processedPulls = {}
      this.rawPullData = {}
      this.globalStats = {
        totalPulls: 0,
        total4StarItems: 0,
        total5StarItems: 0,
        total4StarOnlyItems: 0,
        avg5StarPulls: 0,
        avg4StarPulls: 0,
        avg4StarOnlyPulls: 0,
      }
      this.isProcessing = false
      this.isLoading = false
      this.error = null
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

    async processPullsData(pullsByBanner: Record<number, PullRecord[]>) {
      if (this.isProcessing) return
      this.isProcessing = true
      this.rawPullData = pullsByBanner

      try {
        const bannerPulls: Record<string, ProcessedBanner> = {}
        const currentPity: Record<string, Record<number, number>> = {}
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
            const outfit = this.getOutfitData(id)
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
            const outfit = this.getOutfitData(id)
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
              isComplete: false,
              first4StarItemId: null,
              first5StarItemId: null,
            },
            bannerId: bannerId,
            bannerType: bannerInfo.bannerType,
            isComplete: false,
          }
          bannerPulls[bannerId] = initialBanner

          // Pre-populate outfit data
          ;[...outfitLookup[5].entries(), ...outfitLookup[4].entries()].forEach(
            ([outfitId, outfitData]) => {
              if (outfitData) {
                bannerPulls[bannerId].outfits.push({
                  id: outfitId,
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
              const { outfit } = itemInfo
              const itemData = outfit.items.find((id) => id === itemId)
              if (!itemData) return

              const rarity = outfit.rarity
              const outfitId = outfit.id

              const pullsToObtain = currentPity[bannerId][rarity]
              currentPity[bannerId][rarity] = 0

              const pullInfo: PullItem = {
                itemId,
                outfitId,
                rarity: rarity as number,
                pullsToObtain,
                obtainedAt: time || '',
                bannerId: bannerId,
                obtained: true,
                pullIndex: index + 1,
                duplicate: itemObtained[itemId] || false,
              }

              if (!itemObtained[itemId]) {
                // Track first item of each rarity
                if (rarity === 4 && !currentBanner.stats.first4StarItemId) {
                  currentBanner.stats.first4StarItemId = itemId
                } else if (
                  rarity === 5 &&
                  !currentBanner.stats.first5StarItemId
                ) {
                  currentBanner.stats.first5StarItemId = itemId
                }
                firstObtainInfo[itemId] = pullInfo
              }
              itemObtained[itemId] = true
              currentBanner.pulls.unshift(pullInfo)
              currentBanner.stats.totalItems++

              if (bannerInfo.bannerType !== 1) {
                // Update total pulls
                this.globalStats.totalPulls = Object.values(
                  pullsByBanner
                ).reduce((sum, pulls) => sum + pulls.length, 0)
                if (bannerInfo.bannerType == 2) {
                  if (rarity == 5) {
                    total5Star++
                    fiveStarPullsToObtain += pullsToObtain
                    fiveStarCount++
                  } else if (rarity == 4) {
                    total4Star++
                    fourStarPullsToObtain += pullsToObtain
                    fourStarCount++
                  }
                } else if (bannerInfo.bannerType == 3) {
                  total4StarOnly++
                  fourStarOnlyPullsToObtain += pullsToObtain
                  fourStarOnlyCount++
                }
              }
            }

            // Always update lastPull with the most recent pull time
            currentBanner.stats.lastPull = time || currentBanner.stats.lastPull
          })

          // 4. Calculate banner-specific stats
          const bannerType = bannerInfo.bannerType || 1
          const stats = currentBanner.stats
          const currentPulls = currentBanner.pulls
          if (bannerType === 1) {
            // Permanent
            const fourStarPulls = currentPulls.filter(
              (item: PullItem) => item.rarity === 4 && item.obtained
            )
            const fiveStarPulls = currentPulls.filter(
              (item: PullItem) => item.rarity === 5 && item.obtained
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
              (item: PullItem) => item.rarity === 4 && item.obtained
            )
            const fiveStarPulls = currentPulls.filter(
              (item: PullItem) => item.rarity === 5 && item.obtained
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
              (item: PullItem) => item.rarity === 4 && item.obtained
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
            outfit.isComplete = outfit.items.every((id) =>
              obtainedItems.has(id)
            )
          })

          currentBanner.isComplete =
            currentBanner.outfits.length > 0 &&
            currentBanner.outfits.every((outfit) => outfit.isComplete)
        })

        // Update global stats
        this.globalStats.total5StarItems = total5Star
        this.globalStats.total4StarItems = total4Star
        this.globalStats.total4StarOnlyItems = total4StarOnly
        this.globalStats.avg5StarPulls =
          fiveStarCount > 0 ? fiveStarPullsToObtain / fiveStarCount : 0
        this.globalStats.avg4StarPulls =
          fourStarCount > 0 ? fourStarPullsToObtain / fourStarCount : 0
        this.globalStats.avg4StarOnlyPulls =
          fourStarOnlyCount > 0
            ? fourStarOnlyPullsToObtain / fourStarOnlyCount
            : 0

        this.processedPulls = bannerPulls
      } catch (err) {
        this.error =
          err instanceof Error ? err.message : 'Failed to process pulls data'
      } finally {
        this.isProcessing = false
      }
    },

    async sendUserBannerStats() {
      const { sendUserBannerStats } = useUserBannerStats()
      const userStore = useUserStore()
      const uid = userStore.uid
      const region = userStore.region

      if (!uid) return

      // Collect all analytics data first
      const analyticsDataArray = Object.entries(this.processedPulls)
        .filter(([_, banner]) => banner.stats.totalPulls > 0)
        .map(([bannerId, banner]) => ({
          uid,
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
            .filter((pull) => pull.rarity === 4)
            .map((pull) => ({
              item_id: pull.itemId,
              pulls_to_obtain: pull.pullsToObtain,
              obtained_at: pull.obtainedAt,
              pull_index: pull.pullIndex,
            }))
            .reverse(),
          pulls_5star: banner.pulls
            .filter((pull) => pull.rarity === 5)
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

      // Send all data in a single batch
      if (analyticsDataArray.length > 0) {
        await sendUserBannerStats(analyticsDataArray)
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
            isComplete: false,
            first4StarItemId: null,
            first5StarItemId: null,
          },
          bannerId: bannerId,
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

        for (const id of outfit.items) {
          if (!obtainedItemIds.includes(id)) {
            this.processedPulls[bannerId].pulls.push({
              itemId: id,
              outfitId: outfit.id,
              rarity: outfit.rarity as number,
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
  },
})
