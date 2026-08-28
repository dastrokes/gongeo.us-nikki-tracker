export type CatalogIndexPartKey =
  | 'items'
  | 'outfits'
  | 'makeups'
  | 'momo'
  | 'eurekas'
  | 'props'
  | 'outfitItems'
  | 'makeupItems'
  | 'makeupOutfits'
  | 'momoOutfits'

export type CatalogIndexFileKey = CatalogIndexPartKey | 'palettes' | 'sketches'

export type ItemDyeUnlockGroups = [
  number[],
  number[],
  number[],
  number[],
  number[],
]

export interface ItemDyeCatalog {
  palettes: Record<string, { colors: string[] }>
  items: Record<string, ItemDyeUnlockGroups>
  rawItems: Record<string, ItemDyeUnlockGroups>
  areas: Record<string, { primaryCount: number; customOrder: number[] }>
}

export interface CatalogIndexFileReference {
  path: string
  hash: string
  bytes: number
}

export interface CatalogLandingPreviewSet {
  outfit: number
  item: number
  makeup: number
  momo: number
}

export interface CatalogIndexManifestResponse {
  gameVersion: string
  generatedAt: string
  landingPreview: CatalogLandingPreviewSet
  files: Record<CatalogIndexFileKey, CatalogIndexFileReference>
}
