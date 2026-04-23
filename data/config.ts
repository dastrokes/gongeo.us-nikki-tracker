export interface CurrentBannerGroupConfig {
  key: string
  bannerIds: number[]
  targetTime: string
}

// Update this file when banners rotate or import maintenance needs to change.
export const CURRENT_BANNER_GROUPS: CurrentBannerGroupConfig[] = [
  {
    key: 'left',
    bannerIds: [56, 10],
    targetTime: '2026-04-23T20:00:00Z',
  },
  {
    key: 'right',
    bannerIds: [57, 58],
    targetTime: '2026-04-23T20:00:00Z',
  },
]

export const LATEST_BANNER_ID = 58

export const IMPORT_PAGE_MAINTENANCE = true
