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

export interface CatalogIndexManifestResponse {
  gameVersion: string
  generatedAt: string
  files?: Record<CatalogIndexFileKey, CatalogIndexFileReference>
  items?: ItemListEntry[]
  outfits?: OutfitListEntry[]
  makeups?: ItemListEntry[]
  momo?: MomoListEntry[]
  eurekas?: EurekaCatalogEntry[]
  props?: PropCatalogEntry[]
  outfitItems?: Record<string, number[]>
  makeupItems?: Record<string, number[]>
  makeupOutfits?: Record<string, number[]>
  momoOutfits?: Record<string, number[]>
}
