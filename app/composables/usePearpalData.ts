import { uncompress } from 'snappyjs'
import { BANNER_DATA } from '~~/data/banners'

export const usePearpalData = () => {
  // Helper function to decode snappyjs base64 data
  const decodeSnappyJs = async (
    responseBuffer: ArrayBuffer
  ): Promise<unknown> => {
    try {
      const compressed = new Uint8Array(responseBuffer)
      const uncompressed = uncompress(compressed)
      const text = new TextDecoder().decode(uncompressed)

      try {
        const json = JSON.parse(text)
        return json
      } catch {
        throw new Error('Decompressed data is not valid JSON')
      }
    } catch (error) {
      console.error('Snappy decompression failed:', error)
      throw new Error('Failed to decode snappy data')
    }
  }

  // Process pearpal tracker data directly
  const processPearpalData = (
    bannerData: Record<number, PearpalTrackerItem[]>
  ): Record<string, ProcessedBanner> => {
    // Sort each banner's data by pool_cnt (chronological order)
    Object.values(bannerData).forEach((items) => {
      items.sort((a, b) => a.pool_cnt - b.pool_cnt)
    })

    // Process each banner to create PullItem-like data
    const processedBanners: Record<string, ProcessedBanner> = {}

    Object.entries(bannerData).forEach(([bannerIdStr, items]) => {
      const bannerId = parseInt(bannerIdStr)
      const bannerInfo = BANNER_DATA[bannerId]

      if (!bannerInfo) return

      const { outfit4StarId, outfit5StarId } = getBannerOutfitIds(bannerId)

      const processedPulls: PullItem[] = []
      let total4StarItems = 0
      let total5StarItems = 0
      let total4StarPulls = 0
      let total5StarPulls = 0
      let lastPullTime = new Date(0).toISOString()

      // For 4-star only bannerType 3 stats
      let total4StarOnlyItems = 0
      let total4StarOnlyPulls = 0

      // Track item counts for duplicates
      const itemCount: Record<string, number> = {}

      items.forEach((item) => {
        const outfitId = getOutfitIdFromItemId(item.result)
        const quality = parseInt(item.rarity) // Note: Pearpal data uses 'rarity' field name
        const pullsToObtain =
          quality === 5
            ? item.times_from_last_five_stars + 1
            : item.times_from_last_four_stars + 1

        // Create timestamp based on pool_cnt
        const timestamp = new Date()
          .toISOString()
          .slice(0, 19)
          .replace('T', ' ')
        lastPullTime = timestamp

        // Calculate count for this item
        itemCount[item.result] = (itemCount[item.result] || 0) + 1

        const pullInfo: PullItem = {
          pullIndex: item.pool_cnt + 1,
          itemId: item.result,
          outfitId,
          quality,
          pullsToObtain,
          obtainedAt: timestamp,
          bannerId: bannerId,
          count: itemCount[item.result]!,
        }

        processedPulls.push(pullInfo)

        if (quality === 4) {
          if (bannerInfo.bannerType === 3) {
            total4StarOnlyItems++
            total4StarOnlyPulls += pullsToObtain
          } else {
            total4StarItems++
            total4StarPulls += pullsToObtain
          }
        } else if (quality === 5) {
          total5StarItems++
          total5StarPulls += pullsToObtain
        }
      })

      // Calculate highest pool_cnt as total pulls
      const totalPulls = Math.max(...items.map((item) => item.pool_cnt + 1))

      // Pity cannot be tracked
      const pity5Star = 0
      const pity4Star = 0

      // Pre-populate outfit data with proper completion calculation
      const pulledItemIds = new Set(processedPulls.map((pull) => pull.itemId))

      ;[...outfit5StarId, ...outfit4StarId].forEach((outfitId) => {
        const outfitData = getOutfitData(outfitId)
        if (outfitData) {
          // Add missing items to pulls array with count: 0
          outfitData.items.forEach((itemId) => {
            if (!pulledItemIds.has(itemId)) {
              processedPulls.push({
                pullIndex: 0,
                itemId: itemId,
                outfitId,
                quality: outfit5StarId.includes(outfitId) ? 5 : 4,
                pullsToObtain: 0,
                obtainedAt: '',
                bannerId: bannerId,
                count: 0,
              })
            }
          })
        }
      })

      const is4StarOnlyBanner = bannerInfo.bannerType === 3

      const stats: BannerStats = {
        lastPull: lastPullTime,
        totalPulls,
        totalItems: items.length,
        pity4Star,
        pity5Star,
        avg4StarPulls: is4StarOnlyBanner
          ? 0
          : total4StarItems > 0
            ? total4StarPulls / total4StarItems
            : 0,
        avg5StarPulls: is4StarOnlyBanner
          ? 0
          : total5StarItems > 0
            ? total5StarPulls / total5StarItems
            : 0,
        avg4StarOnlyPulls: is4StarOnlyBanner
          ? total4StarOnlyItems > 0
            ? total4StarOnlyPulls / total4StarOnlyItems
            : 0
          : 0,
        total4StarItems: is4StarOnlyBanner ? 0 : total4StarItems,
        total5StarItems: is4StarOnlyBanner ? 0 : total5StarItems,
        total4StarOnlyItems: is4StarOnlyBanner ? total4StarOnlyItems : 0,
        total4StarPulls: is4StarOnlyBanner ? 0 : total4StarPulls,
        total5StarPulls: is4StarOnlyBanner ? 0 : total5StarPulls,
        total4StarOnlyPulls: is4StarOnlyBanner ? total4StarOnlyPulls : 0,
        completion: 0,
      }

      // Create processed banner data with updated pulls array
      processedBanners[bannerId] = {
        pulls: processedPulls.reverse(), // Newest first (pulled items first, then missing items)
        outfits: [],
        stats,
        bannerId: bannerId,
        bannerType: bannerInfo.bannerType,
      }

      // Add outfit data with proper completion calculation
      ;[...outfit5StarId, ...outfit4StarId].forEach((outfitId) => {
        const outfitData = getOutfitData(outfitId)
        if (outfitData) {
          // Calculate how many items from this outfit were obtained
          const obtainedItems = outfitData.items.filter((itemId) =>
            pulledItemIds.has(itemId)
          ).length
          const completion =
            outfitData.items.length > 0
              ? obtainedItems / outfitData.items.length
              : 0

          processedBanners[bannerId]!.outfits.push({
            id: outfitId,
            quality: outfit5StarId.includes(outfitId) ? 5 : 4,
            items: outfitData.items,
            completion,
            totalItems: outfitData.items.length,
            obtainedItems: outfitData.items.filter((itemId) =>
              pulledItemIds.has(itemId)
            ).length,
          })
        }
      })
    })

    return processedBanners
  }

  // Convert ProcessedBanner data to UserBannerStats format for Pearpal
  const convertPearpalBannersToStats = async (
    processedBanners: Record<string, ProcessedBanner>,
    uid: string,
    region: string
  ): Promise<UserBannerStats[]> => {
    // Hash the UID
    const hashedUid = await hashUid(uid)

    return Object.entries(processedBanners)
      .filter(([_, banner]) => banner.stats.totalPulls > 0)
      .map(([bannerId, banner]) => ({
        uid: hashedUid,
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
          .filter(
            (pull) =>
              pull.quality === 4 &&
              pull.pullsToObtain > 0 &&
              pull.obtainedAt !== '' &&
              pull.obtainedAt !== 'manual'
          )
          .map((pull) => ({
            item_id: pull.itemId,
            pulls_to_obtain: pull.pullsToObtain,
            obtained_at: pull.obtainedAt,
            pull_index: pull.pullIndex,
          }))
          .reverse(),
        pulls_5star: banner.pulls
          .filter(
            (pull) =>
              pull.quality === 5 &&
              pull.pullsToObtain > 0 &&
              pull.obtainedAt !== '' &&
              pull.obtainedAt !== 'manual'
          )
          .map((pull) => ({
            item_id: pull.itemId,
            pulls_to_obtain: pull.pullsToObtain,
            obtained_at: pull.obtainedAt,
            pull_index: pull.pullIndex,
          }))
          .reverse(),
        last_pull_time: banner.stats.lastPull,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))
  }

  return {
    decodeSnappyJs,
    processPearpalData,
    convertPearpalBannersToStats,
  }
}
