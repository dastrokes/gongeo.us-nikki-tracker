export interface MomoListEntry {
  id: number
  quality: number
  obtain_type?: number | null
  version?: string | null
}

export interface MomoRelatedOutfit {
  id: number
  quality: number
}

export interface MomoDetailEntry extends MomoListEntry {
  name?: string
  description: string
  related_outfits?: MomoRelatedOutfit[]
}

export interface PaginatedMomoResponse {
  data: MomoListEntry[]
  total: number
  page: number
  totalPages: number
}
