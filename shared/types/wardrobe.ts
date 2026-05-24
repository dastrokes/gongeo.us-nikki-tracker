export interface WardrobeData {
  version: 1
  ownedItemIds: number[]
  ownedMakeupIds: number[]
  ownedMomoIds: number[]
  updatedAt: string
}

export type WardrobeOutfitStatus = 'owned' | 'partial' | 'missing'

export interface WardrobeOutfitProgress {
  status: WardrobeOutfitStatus
  owned: number
  total: number
}

export interface WardrobeItemIdsResponse {
  itemIds: number[]
}

export interface WardrobeOutfitIdsResponse {
  outfitIds: number[]
  itemIds?: number[]
  outfitItems?: Record<string, number[]>
}
