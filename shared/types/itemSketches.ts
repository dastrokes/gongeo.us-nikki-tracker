export interface ItemSketchChestLocation {
  spawnerId: number
  worldId: string
  lat: number
  lng: number
}

export interface ItemSketchCatalogEntry {
  designId: number
  chestReward: boolean
  chestLocations: ItemSketchChestLocation[]
}

export interface ItemSketchCatalog {
  schemaVersion: 1
  items: Record<string, ItemSketchCatalogEntry>
}
