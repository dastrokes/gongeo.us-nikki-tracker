export interface UserBannerStats extends Record<string, unknown> {
  uid: string
  region: string
  banner_id: number
  banner_type: number
  total_pulls: number
  total_4star_items: number
  total_5star_items: number
  total_4star_only_items: number
  avg_4star_pulls: number
  avg_5star_pulls: number
  avg_4star_only_pulls: number
  last_pull_time: string | null
  first_4star_item_id: string | null
  first_5star_item_id: string | null
  updated_at: string
}
