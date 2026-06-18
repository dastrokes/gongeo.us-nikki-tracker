export type FirstItemDistribution = Record<
  string,
  { users: number; itemId: string }[]
>

export type GlobalBannerHistogram = Record<string, number>

export interface GlobalBannerItemDistributionEntry {
  itemId: string
  users: number
}

export interface GlobalBannerScopePayload {
  scopeKey: string
  quality: 4 | 5
  outfitId: string
  itemCount: number
  users: number
  firstItemDistribution: GlobalBannerItemDistributionEntry[]
  completedUsers?: number
  completionRate?: number
  completionPullDistribution?: GlobalBannerHistogram
  fifthItemDistribution?: GlobalBannerItemDistributionEntry[]
}

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
  firstItemDistribution?: FirstItemDistribution
}

export interface GlobalBannerPayload {
  date?: string
  bannerId: number
  bannerType?: 1 | 2 | 3
  users: number
  totalPulls: number
  overallPullDistribution: GlobalBannerHistogram
  scopes: Record<string, GlobalBannerScopePayload>
}

export interface GlobalCoreStatsRow {
  banner_id: number
  payload: GlobalCorePayload
  updated_at: string
}

export interface GlobalBannerStatsRow {
  banner_id: number
  payload: GlobalBannerPayload
  firstItemDistribution: FirstItemDistribution
  updated_at: string
}
