export interface LookbookDyeSwatch {
  targetGroupId: number
  featureTag: number
  paletteId: number
  slot: number | null
  color: string
}

export interface LookbookDyeItem<T = LookbookDyeSwatch> {
  itemId: number
  outfitId: number | null
  dyes: T[]
}

export interface LookbookDecodeResponse {
  code: string
  wearingClothes: number[]
  dyeItems: LookbookDyeItem<
    LookbookDyeSwatch | { source: Record<string, unknown> }
  >[]
}
