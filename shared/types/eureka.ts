export type EurekaPosition = 'head' | 'hands' | 'feet'

export type EurekaStyle = 'elegant' | 'fresh' | 'sweet' | 'sexy' | 'cool'

export interface EurekaColor {
  id: number
  order: number
  colorType: number
}

export interface EurekaCatalogEntry {
  id: number
  suitId: number
  position: EurekaPosition
  quality: 3 | 4 | 5
  styles: Record<EurekaStyle, number>
  mainStyle: EurekaStyle
  tagIds: number[]
  provinceId: number
  colors: EurekaColor[]
}

export type EurekaOwnershipStatus = 'complete' | 'partial' | 'missing'

export interface EurekaOwnershipProgress {
  status: EurekaOwnershipStatus
  owned: number
  total: number
}
