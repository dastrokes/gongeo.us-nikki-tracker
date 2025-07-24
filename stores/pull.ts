import { defineStore } from 'pinia'
import type {
  PullRecord,
  PullState,
  EditRecord,
  ProcessedBanner,
  PearpalTrackerItem,
} from '~/types/pull'
import { useBannerPullData } from '~/composables/useBannerPullData'
import { usePearpalData } from '~/composables/usePearpalData'
import { BANNER_DATA } from '~/data/banners'
import type { BannerData } from '~/types/banner'

export const usePullStore = defineStore('pull', {
  state: (): PullState => ({
    processedPulls: {},
    evoData: {},
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

    getGlobalStats: (state) => state.globalStats,

    getOutfitEvoLevel: (state) => (bannerId: number, outfitId: string) => {
      if (!state.evoData[bannerId]) return 0

      const evoRecord = state.evoData[bannerId].find(([id]) => id === outfitId)

      return evoRecord ? evoRecord[1] : 0
    },
  },

  actions: {
    reset() {
      // Reset all state properties to their initial values
      this.processedPulls = {}
      this.evoData = {}
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
    },

    async processPullData(
      pullsByBanner: Record<number, PullRecord[]>,
      editsByBanner: Record<number, EditRecord[]>
    ) {
      if (this.isProcessing) return
      this.isProcessing = true

      try {
        const bannerPullData = useBannerPullData()
        const { processedPulls, globalStats } =
          bannerPullData.processBannerPullData(pullsByBanner, editsByBanner)

        this.processedPulls = processedPulls
        this.globalStats = globalStats

        // Always add missing items for all banners during initial processing
        Object.keys(BANNER_DATA).forEach((bannerIdStr) => {
          const bannerId = parseInt(bannerIdStr)
          this.addMissingItems(bannerId)
        })
      } catch (error) {
        console.error(`Failed to process pulls data:`, error)
      } finally {
        this.isProcessing = false
      }
    },

    async processPearpalData(
      pearpalData: Record<number, PearpalTrackerItem[]>
    ) {
      if (this.isProcessing) return
      this.isProcessing = true

      try {
        // Process the grouped data directly
        const { processPearpalData } = usePearpalData()
        const processedData = processPearpalData(pearpalData)
        this.processedPulls = processedData

        // Recalculate global stats including pearpal tracker data
        const globalStats = {
          totalPulls: 0,
          total4StarItems: 0,
          total5StarItems: 0,
          total4StarOnlyItems: 0,
          avg5StarPulls: 0,
          avg4StarPulls: 0,
          avg4StarOnlyPulls: 0,
        }

        let total4StarPulls = 0
        let total5StarPulls = 0
        let total4StarOnlyPulls = 0
        let fourStarCount = 0
        let fiveStarCount = 0
        let fourStarOnlyCount = 0

        Object.values(this.processedPulls).forEach(
          (banner: ProcessedBanner) => {
            if (banner.stats) {
              globalStats.totalPulls += banner.stats.totalPulls
              globalStats.total4StarItems += banner.stats.total4StarItems
              globalStats.total5StarItems += banner.stats.total5StarItems
              globalStats.total4StarOnlyItems +=
                banner.stats.total4StarOnlyItems

              if (banner.bannerType === 2) {
                // Limited 5★ banners
                total4StarPulls += banner.stats.total4StarPulls
                total5StarPulls += banner.stats.total5StarPulls
                fourStarCount += banner.stats.total4StarItems
                fiveStarCount += banner.stats.total5StarItems
              } else if (banner.bannerType === 3) {
                // 4★ only banners
                total4StarOnlyPulls += banner.stats.total4StarOnlyPulls
                fourStarOnlyCount += banner.stats.total4StarOnlyItems
              }
            }
          }
        )

        globalStats.avg4StarPulls =
          fourStarCount > 0 ? total4StarPulls / fourStarCount : 0
        globalStats.avg5StarPulls =
          fiveStarCount > 0 ? total5StarPulls / fiveStarCount : 0
        globalStats.avg4StarOnlyPulls =
          fourStarOnlyCount > 0 ? total4StarOnlyPulls / fourStarOnlyCount : 0

        this.globalStats = globalStats
      } catch (error) {
        console.error('Error processing pearpal tracker data:', error)
      } finally {
        this.isProcessing = false
      }
    },

    addMissingItems(bannerId: number) {
      const bannerInfo = (BANNER_DATA as BannerData)[bannerId]
      if (!bannerInfo) return

      const currentBanner = this.processedPulls[bannerId]
      if (!currentBanner) return

      const newPulls = [...currentBanner.pulls]
      const existingItems = new Set(
        currentBanner.pulls.map((pull) => pull.itemId)
      )

      // Add missing items for all outfits in this banner
      currentBanner.outfits.forEach((outfit) => {
        outfit.items.forEach((itemId) => {
          if (!existingItems.has(itemId)) {
            newPulls.push({
              itemId,
              outfitId: outfit.id,
              rarity: outfit.rarity,
              pullsToObtain: 0,
              obtainedAt: '',
              bannerId,
              count: 0,
              pullIndex: 0,
            })
          }
        })
      })

      // Update only if we added missing items
      if (newPulls.length > currentBanner.pulls.length) {
        this.processedPulls = {
          ...this.processedPulls,
          [bannerId]: {
            ...currentBanner,
            pulls: newPulls,
          },
        }
      }
    },
  },
})
