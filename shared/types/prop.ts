export type PropSource = 'event' | 'home' | 'resonance' | 'starlit' | 'store'

export interface PropCatalogEntry {
  id: number
  quality: number
  variantRootId?: number
  sources?: PropSource[]
  version?: string
  bannerIds?: number[]
}
