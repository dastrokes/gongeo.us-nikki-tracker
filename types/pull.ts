export interface JsonData {
  code: number
  info: string
  request_id: string
  banner_id: number
  data: {
    title: string[]
    datas: [string, string][]
    end: boolean
  }
}

export type PullRecord = [string, string]

export interface PullItem {
  pullIndex: number
  itemId: string
  itemName: string
  outfitId: string
  rarity: number
  outfitName: string
  pullsToObtain: number
  obtainedAt: string
  bannerId: number
  obtained: boolean
  duplicate: boolean
}

export interface OutfitStatus {
  id: string
  name: string
  rarity: number
  items: {
    id: string
    name: string
  }[]
  isComplete: boolean
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
  isComplete: boolean
  first4StarItemId: string | null
  first5StarItemId: string | null
}

export interface ProcessedBanner {
  isComplete: boolean
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
  globalStats: GlobalStats
  isProcessing: boolean
  isLoading: boolean
  error: string | null
}
