export interface UserBannerStats extends Record<string, unknown> {
  uid: string
  region: string
  banner_id: number
  banner_type: number
  total_pulls: number
  total_4star_items: number
  total_5star_items: number
  total_4star_pulls: number
  total_5star_pulls: number
  pulls_4star: {
    pull_index: number
    item_id: string
    pulls_to_obtain: number
    obtained_at: string
  }[]
  pulls_5star: {
    pull_index: number
    item_id: string
    pulls_to_obtain: number
    obtained_at: string
  }[]
  last_pull_time: string
  updated_at: string
}
