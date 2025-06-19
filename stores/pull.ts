import { defineStore } from 'pinia'
import type { PullRecord, PullState, EditRecord, EvoRecord } from '~/types/pull'
import { useBannerPullData } from '~/composables/useBannerPullData'
import { BANNER_DATA } from '~/data/banners'
import type { BannerData } from '~/types/banner'
import { getBannerOutfitIds, getOutfitData } from '~/utils/utils'

export const usePullStore = defineStore('pull', {
  state: (): PullState => ({
    processedPulls: {},
    rawPullData: {},
    rawEditData: {},
    rawEvoData: {},
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
      if (!state.rawEvoData[bannerId]) return 0

      const evoRecord = state.rawEvoData[bannerId].find(
        ([id]) => id === outfitId
      )

      return evoRecord ? evoRecord[1] : 0
    },
  },

  actions: {
    reset() {
      // Reset all state properties to their initial values
      this.processedPulls = {}
      this.rawPullData = {}
      this.rawEditData = {}
      this.rawEvoData = {}
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
      editsByBanner: Record<number, EditRecord[]>,
      evoByBanner: Record<number, EvoRecord[]>
    ) {
      if (this.isProcessing) return
      this.isProcessing = true
      this.rawPullData = pullsByBanner
      this.rawEditData = editsByBanner
      this.rawEvoData = evoByBanner

      try {
        const bannerPullData = useBannerPullData()
        const { processedPulls, globalStats } =
          bannerPullData.processBannerPullData(pullsByBanner, editsByBanner)

        this.processedPulls = processedPulls
        this.globalStats = globalStats
      } catch (error) {
        console.error(`Failed to process pulls data:`, error)
      } finally {
        this.isProcessing = false
      }
    },

    setOutfitEvoLevel(bannerId: number, outfitId: string, evoLevel: number) {
      if (!this.rawEvoData[bannerId]) {
        this.rawEvoData[bannerId] = []
      }

      // Find existing record or create new one
      const existingIndex = this.rawEvoData[bannerId].findIndex(
        ([id]) => id === outfitId
      )

      if (existingIndex >= 0) {
        this.rawEvoData[bannerId][existingIndex] = [outfitId, evoLevel]
      } else {
        this.rawEvoData[bannerId].push([outfitId, evoLevel])
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
            completion: 0,
          },
          bannerId: bannerId,
          bannerType: bannerInfo.bannerType,
        }
      }

      const { outfit4StarId, outfit5StarId } = getBannerOutfitIds(bannerId)

      if (!this.processedPulls[bannerId].outfits.length) {
        for (const outfitId of outfit4StarId) {
          const outfitData = getOutfitData(outfitId)
          if (outfitData) {
            this.processedPulls[bannerId].outfits.push({
              id: outfitId,
              rarity: 4,
              items: outfitData.items,
              completion: 0,
              totalItems: outfitData.items.length,
              obtainedItems: 0,
            })
          }
        }
        for (const outfitId of outfit5StarId) {
          const outfitData = getOutfitData(outfitId)
          if (outfitData) {
            this.processedPulls[bannerId].outfits.push({
              id: outfitId,
              rarity: 5,
              items: outfitData.items,
              completion: 0,
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
              count: 0,
              pullIndex: 0,
            })
          }
        }
      }
    },
  },
})
