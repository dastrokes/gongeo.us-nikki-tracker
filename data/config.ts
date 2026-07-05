export interface CurrentBannerGroupConfig {
  key: string
  bannerIds: number[]
  targetTime: string
}

// Update this file when banners rotate or import maintenance needs to change.
export const CURRENT_BANNER_GROUPS: CurrentBannerGroupConfig[] = [
  {
    key: 'left',
    bannerIds: [66],
    targetTime: '2026-07-16T20:00:00Z',
  },
  {
    key: 'right',
    bannerIds: [18, 21],
    targetTime: '2026-07-05T20:00:00Z',
  },
]

export const LATEST_BANNER_ID = 66

export const IMPORT_PAGE_MAINTENANCE = true
