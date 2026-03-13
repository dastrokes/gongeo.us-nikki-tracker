export type FirstItemDistribution = Record<string, { o: number; i: string }[]>

export interface GlobalCorePayload {
  date?: string
  pulls?: number
  users?: number
  pullsPerBanner?: Record<string, [number, number, number]>
  fiveStarDistribution?: Record<string, number>
  fourStarType2Distribution?: Record<string, number>
  fourStarType3Distribution?: Record<string, number>
}

export interface GlobalBootstrapData extends GlobalCorePayload {
  bannerId?: number
  f?: FirstItemDistribution
}

export interface GlobalBannerPayload {
  date?: string
  bannerId?: number
  f?: FirstItemDistribution
}

export interface GlobalCoreStatsRow {
  banner_id: number
  payload: GlobalCorePayload
  updated_at: string
}

export interface GlobalBannerStatsRow {
  banner_id: number
  payload: GlobalBannerPayload
  updated_at: string
}
