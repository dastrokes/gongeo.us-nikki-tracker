export type PullRecord = [string, string] // [timestamp, itemId]

export interface EditRecord {
  itemId: string
  outfitId: string
  rarity: number
  obtainedAt: string
}

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
  completion: number
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
  rawPullData: Record<number, PullRecord[]>
  rawEditData: Record<number, EditRecord[]>
  globalStats: GlobalStats
  isProcessing: boolean
}
