export interface PullItem {
  itemId: string
  itemName: string
  itemType: string
  outfitId: string
  rarity: 4 | 5
  outfitName: string
  pullsToObtain: number
  obtainedAt: string
  bannerId: number
  obtained: boolean
  pullIndex: number
}

export interface OutfitStatus {
  id: string
  name: string
  rarity: 4 | 5
  items: {
    id: string
    name: string
    type: string
  }[]
  isComplete: boolean
  totalItems: number
  obtainedItems: number
}

export interface BannerStats {
  lastPull: string | null
  totalPulls: number
  totalItems: number
  pity4Star: number
  pity5Star: number
  avg4StarPulls: number
  avg5StarPulls: number
  total4StarItems: number
  total5StarItems: number
  isComplete: boolean
}

export interface ProcessedBanner {
  pulls: PullItem[]
  outfits: OutfitStatus[]
  stats: BannerStats
  bannerId: number
  bannerName: string
  bannerType: number
}
