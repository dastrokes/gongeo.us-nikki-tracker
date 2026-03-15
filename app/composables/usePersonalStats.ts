import { BANNER_DATA } from '~~/data/banners'
import {
  getAvg5StarPercentile,
  getAvg4StarType3Percentile,
  getBannerAvg5StarPercentile,
  getBannerAvg4StarType3Percentile,
} from '~/utils/percentile'

export interface BannerLuckEntry {
  bannerId: number
  bannerType: number
  totalPulls: number
  avg5StarPulls: number
  percentile: number
}

export interface BannerLuckType3Entry {
  bannerId: number
  totalPulls: number
  avg4StarPulls: number
  percentile: number
}

export interface PullActivityPoint {
  bannerId: number
  count: number
  cumulative: number
}

export const usePersonalStats = () => {
  const pullStore = usePullStore()
  const { processedPulls, globalStats } = storeToRefs(pullStore)

  const hasData = computed(() => Object.keys(processedPulls.value).length > 0)

  // ── Overview ──

  const allOutfitsStats = computed(() => {
    const obtained5 = new Set<string>()
    const obtained4 = new Set<string>()
    const available5 = new Set<string>()
    const available4 = new Set<string>()

    // Available from BANNER_DATA (excluding permanent)
    Object.values(BANNER_DATA).forEach((banner) => {
      if (banner.bannerType === 1) return
      banner.outfit5StarId?.forEach((id: string) => available5.add(id))
      banner.outfit4StarId?.forEach((id: string) => available4.add(id))
    })

    // Obtained from processedPulls
    Object.entries(processedPulls.value).forEach(([idStr, banner]) => {
      const bannerId = Number.parseInt(idStr, 10)
      if (bannerId === 1 || banner.bannerType === 1) return // Skip permanent

      if (!banner?.outfits) return
      banner.outfits.forEach((outfit) => {
        if (outfit.obtainedItems > 0) {
          if (available5.has(outfit.id)) {
            obtained5.add(outfit.id)
          } else if (available4.has(outfit.id)) {
            obtained4.add(outfit.id)
          }
        }
      })
    })

    return {
      obtained5: obtained5.size,
      obtained4: obtained4.size,
    }
  })

  const outfitsObtained5Star = computed(() => allOutfitsStats.value.obtained5)
  const outfitsObtained4Star = computed(() => allOutfitsStats.value.obtained4)

  const pulls5StarBanners = computed(() => {
    return Object.values(processedPulls.value)
      .filter((banner) => banner.bannerType === 2)
      .reduce((acc, banner) => acc + (banner.stats?.totalPulls || 0), 0)
  })

  const pulls4StarBanners = computed(() => {
    return Object.values(processedPulls.value)
      .filter((banner) => banner.bannerType === 3)
      .reduce((acc, banner) => acc + (banner.stats?.totalPulls || 0), 0)
  })

  const bannersPulled5Star = computed(() => {
    return Object.values(processedPulls.value).filter(
      (banner) =>
        banner.bannerType === 2 && (banner?.stats?.totalPulls ?? 0) > 0
    ).length
  })

  const bannersPulled4Star = computed(() => {
    return Object.values(processedPulls.value).filter(
      (banner) =>
        banner.bannerType === 3 && (banner?.stats?.totalPulls ?? 0) > 0
    ).length
  })

  const overallLuckPercentile = computed(() => {
    const has5Star = globalStats.value.avg5StarPulls > 0
    const has4StarType3 = globalStats.value.avg4StarOnlyPulls > 0

    if (!has5Star && !has4StarType3) return 50

    const p5 = has5Star
      ? getAvg5StarPercentile(globalStats.value.avg5StarPulls)
      : 50
    const p4 = has4StarType3
      ? getAvg4StarType3Percentile(globalStats.value.avg4StarOnlyPulls)
      : 50

    if (has5Star && !has4StarType3) return p5
    if (!has5Star && has4StarType3) return p4

    // Combine with lower weight for Type 3 (80% / 20%)
    return p5 * 0.8 + p4 * 0.2
  })

  const luckTier = computed(() => {
    const p = overallLuckPercentile.value
    if (p < 100 / 6) return 1
    if (p < 200 / 6) return 2
    if (p < 300 / 6) return 3
    if (p < 400 / 6) return 4
    if (p < 500 / 6) return 5
    return 6
  })

  // ── Banner Luck Ranking ──

  const bannerLuckRanking = computed<BannerLuckEntry[]>(() => {
    const entries: BannerLuckEntry[] = []
    Object.entries(processedPulls.value).forEach(([idStr, banner]) => {
      if (!banner?.stats || banner.bannerType !== 2) return
      if (banner.stats.total5StarItems === 0) return
      const percentile = getBannerAvg5StarPercentile(banner.stats.avg5StarPulls)
      entries.push({
        bannerId: Number.parseInt(idStr, 10),
        bannerType: banner.bannerType,
        totalPulls: banner.stats.totalPulls,
        avg5StarPulls: banner.stats.avg5StarPulls,
        percentile,
      })
    })
    // Sort luckiest first (highest percentile = luckiest)
    return entries.sort((a, b) => b.percentile - a.percentile)
  })

  const luckiestBanner = computed(() => bannerLuckRanking.value[0] ?? null)
  const unluckiestBanner = computed(() => {
    const list = bannerLuckRanking.value
    return list.length > 1 ? list[list.length - 1] : null
  })

  // ── Banner Luck Ranking (Type 3 — 4★ banners) ──

  const bannerLuckRankingType3 = computed<BannerLuckType3Entry[]>(() => {
    const entries: BannerLuckType3Entry[] = []
    Object.entries(processedPulls.value).forEach(([idStr, banner]) => {
      if (!banner?.stats || banner.bannerType !== 3) return
      if (banner.stats.total4StarOnlyItems === 0) return
      const percentile = getBannerAvg4StarType3Percentile(
        banner.stats.avg4StarOnlyPulls
      )
      entries.push({
        bannerId: Number.parseInt(idStr, 10),
        totalPulls: banner.stats.totalPulls,
        avg4StarPulls: banner.stats.avg4StarOnlyPulls,
        percentile,
      })
    })
    return entries.sort((a, b) => b.percentile - a.percentile)
  })

  // ── Distribution Data ──

  const fiveStarDistribution = computed<Record<number, number>>(() => {
    const dist: Record<number, number> = {}
    Object.values(processedPulls.value).forEach((banner) => {
      if (banner.bannerType === 1 || !banner?.pulls) return
      banner.pulls.forEach((pull) => {
        if (pull.quality === 5 && pull.count > 0 && pull.pullsToObtain > 0) {
          dist[pull.pullsToObtain] = (dist[pull.pullsToObtain] || 0) + 1
        }
      })
    })
    return dist
  })

  const fourStarDistribution = computed<Record<number, number>>(() => {
    const dist: Record<number, number> = {}
    Object.values(processedPulls.value).forEach((banner) => {
      if (!banner?.pulls || banner.bannerType !== 2) return
      banner.pulls.forEach((pull) => {
        if (pull.quality === 4 && pull.count > 0 && pull.pullsToObtain > 0) {
          const bucket = pull.pullsToObtain
          dist[bucket] = (dist[bucket] || 0) + 1
        }
      })
    })
    return dist
  })

  const fourStarType3Distribution = computed<Record<number, number>>(() => {
    const dist: Record<number, number> = {}
    Object.values(processedPulls.value).forEach((banner) => {
      if (!banner?.pulls || banner.bannerType !== 3) return
      banner.pulls.forEach((pull) => {
        if (pull.quality === 4 && pull.count > 0 && pull.pullsToObtain > 0) {
          dist[pull.pullsToObtain] = (dist[pull.pullsToObtain] || 0) + 1
        }
      })
    })
    return dist
  })

  // ── Pull Activity (all non-permanent banners) ──

  const pullActivity = computed<PullActivityPoint[]>(() => {
    const entries: PullActivityPoint[] = []

    // Include ALL non-permanent banners from BANNER_DATA to reflect the full timeline
    Object.entries(BANNER_DATA)
      .filter(([, b]) => b.bannerType !== 1)
      .sort(([a], [b]) => Number.parseInt(a, 10) - Number.parseInt(b, 10))
      .forEach(([idStr]) => {
        const bannerId = Number.parseInt(idStr, 10)
        const banner = processedPulls.value[bannerId]
        entries.push({
          bannerId,
          count: banner?.stats?.totalPulls ?? 0,
          cumulative: 0,
        })
      })

    let cumulative = 0
    entries.forEach((entry) => {
      cumulative += entry.count
      entry.cumulative = cumulative
    })

    return entries
  })

  return {
    hasData,
    // Overview
    pulls5StarBanners,
    pulls4StarBanners,
    bannersPulled5Star,
    bannersPulled4Star,
    outfitsObtained5Star,
    outfitsObtained4Star,
    overallLuckPercentile,
    luckTier,
    // Luck
    bannerLuckRanking,
    bannerLuckRankingType3,
    luckiestBanner,
    unluckiestBanner,
    // Distributions
    fiveStarDistribution,
    fourStarDistribution,
    fourStarType3Distribution,
    // Pull Activity
    pullActivity,
  }
}
