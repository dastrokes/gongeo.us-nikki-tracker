import type {
  PullRecord,
  PullState,
  EditRecord,
  ProcessedBanner,
  PearpalTrackerItem,
} from '~/types/pull'
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

      const evoRecord = state.evoData[bannerId]?.find(([id]) => id === outfitId)

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
        const processedPulls = bannerPullData.processBannerPullData(
          pullsByBanner,
          editsByBanner
        )

        this.processedPulls = processedPulls

        // Recompute global stats using shared helper
        this.globalStats = computeGlobalStats(this.processedPulls)

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

    async processAutoData(
      pullsByBanner: Record<number, PullRecord[]>,
      editsByBanner: Record<number, EditRecord[]>,
      pearpalData: Record<number, PearpalTrackerItem[]>
    ) {
      if (this.isProcessing) return
      this.isProcessing = true

      try {
        // Produce processed data for both sources
        const bannerPullData = useBannerPullData()
        const gameProcessed = bannerPullData.processBannerPullData(
          pullsByBanner,
          editsByBanner
        )

        const { processPearpalData } = usePearpalData()
        const pearpalProcessed = processPearpalData(pearpalData)

        // Merge per banner choosing the source with larger total pulls
        const merged: Record<string, ProcessedBanner> = {}
        const bannerIds = new Set<string>([
          ...Object.keys(gameProcessed),
          ...Object.keys(pearpalProcessed),
        ])

        bannerIds.forEach((id) => {
          const gameBanner = gameProcessed[id]
          const pearpalBanner = pearpalProcessed[id]
          if (gameBanner && pearpalBanner) {
            // tie-breaker: prefer game when equal
            merged[id] =
              (pearpalBanner.stats?.totalPulls || 0) >
              (gameBanner.stats?.totalPulls || 0)
                ? pearpalBanner
                : gameBanner
          } else if (gameBanner) {
            merged[id] = gameBanner
          } else if (pearpalBanner) {
            merged[id] = pearpalBanner
          }
        })

        this.processedPulls = merged

        // Recompute global stats using shared utility
        this.globalStats = computeGlobalStats(this.processedPulls)

        // Ensure missing items are present for all banners
        Object.keys(BANNER_DATA).forEach((bannerIdStr) => {
          const bannerId = parseInt(bannerIdStr)
          this.addMissingItems(bannerId)
        })
      } catch (error) {
        console.error('Error processing auto data:', error)
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
        this.globalStats = computeGlobalStats(this.processedPulls)
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
              quality: outfit.quality,
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
