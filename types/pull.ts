export type PullRecord = [string, string] // [timestamp, itemId]

export type EditRecord = [string, string] // [timestamp, itemId]

export type EvoRecord = [string, number] // [outfitId, evoLevel]

export interface PullItem {
  pullIndex: number
  itemId: string
  outfitId: string
  rarity: number
  pullsToObtain: number
  obtainedAt: string
  bannerId: number
  count: number
}

export interface OutfitStatus {
  id: string
  rarity: number
  items: string[]
  completion: number
  totalItems: number
  obtainedItems: number
}

export interface BannerStats {
  lastPull: string
  totalPulls: number
  totalItems: number
  pity4Star: number
  pity5Star: number
  avg4StarPulls: number
  avg5StarPulls: number
  avg4StarOnlyPulls: number
  total4StarItems: number
  total5StarItems: number
  total4StarOnlyItems: number
  total4StarPulls: number
  total5StarPulls: number
  total4StarOnlyPulls: number
  completion: number
}

export interface ProcessedBanner {
  pulls: PullItem[]
  outfits: OutfitStatus[]
  stats: BannerStats
  bannerId: number
  bannerType: number
}

export interface GlobalStats {
  totalPulls: number
  total4StarItems: number
  total5StarItems: number
  total4StarOnlyItems: number
  avg5StarPulls: number
  avg4StarPulls: number
  avg4StarOnlyPulls: number
}

export interface PullState {
  processedPulls: Record<string, ProcessedBanner>
  evoData: Record<number, EvoRecord[]>
  globalStats: GlobalStats
  isProcessing: boolean
}

// Pearpal tracker item type for import and server
export interface PearpalTrackerItem {
  card_pool_id: string
  pool_cnt: number
  result: string
  times_from_last_five_stars: number
  times_from_last_four_stars: number
  rarity: string
}
