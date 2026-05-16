export interface MomoListEntry {
  id: number
  quality: number
  obtain_type?: number | null
}

export interface MomoDetailEntry extends MomoListEntry {
  name?: string
  description: string
}

export interface PaginatedMomoResponse {
  data: MomoListEntry[]
  total: number
  page: number
  totalPages: number
}
