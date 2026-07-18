export interface LookbookDyeSwatch {
  targetGroupId: number
  featureTag: number
  paletteId: number
  slot: number | null
  color: string
}

export interface LookbookDyeItem {
  itemId: number
  outfitId: number | null
  dyes: LookbookDyeSwatch[]
}

export interface LookbookDecodeResponse {
  code: string
  wearingClothes: number[]
  dyeItems: LookbookDyeItem[]
}
