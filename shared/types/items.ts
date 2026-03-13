export interface ItemListEntry {
  id: number
  quality: number
  type: string
  style: string | null
  labels: string[]
  obtain_type?: number | null
}
