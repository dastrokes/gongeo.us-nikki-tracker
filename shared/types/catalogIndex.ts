export interface CatalogIndexManifestResponse {
  gameVersion: string
  generatedAt: string
  items: ItemListEntry[]
  outfits: OutfitListEntry[]
  makeups: ItemListEntry[]
  momo: MomoListEntry[]
  outfitItems: Record<string, number[]>
}
