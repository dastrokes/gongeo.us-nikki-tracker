export type CatalogIndexPartKey =
  | 'items'
  | 'outfits'
  | 'makeups'
  | 'momo'
  | 'outfitItems'

export interface CatalogIndexFileReference {
  path: string
  hash: string
  bytes: number
}

export interface CatalogIndexManifestResponse {
  gameVersion: string
  generatedAt: string
  files?: Record<CatalogIndexPartKey, CatalogIndexFileReference>
  items?: ItemListEntry[]
  outfits?: OutfitListEntry[]
  makeups?: ItemListEntry[]
  momo?: MomoListEntry[]
  outfitItems?: Record<string, number[]>
}
