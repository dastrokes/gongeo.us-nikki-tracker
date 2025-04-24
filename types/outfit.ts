export interface OutfitItem {
  id: string
  name: string
  type: string
}

export interface Outfit {
  id: string
  name: string
  rarity: number
  items: OutfitItem[]
}

export type OutfitData = Outfit[]
