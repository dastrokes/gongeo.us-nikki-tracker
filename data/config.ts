export interface CurrentBannerGroupConfig {
  key: string
  bannerIds: number[]
  targetTime: string
}

// Update this file when banners rotate or import maintenance needs to change.
export const CURRENT_BANNER_GROUPS: CurrentBannerGroupConfig[] = [
  {
    key: 'left',
    bannerIds: [56],
    targetTime: '2026-04-23T20:00:00Z',
  },
  {
    key: 'right',
    bannerIds: [8, 14],
    targetTime: '2026-04-09T20:00:00Z',
  },
]

export const LATEST_BANNER_ID = 56

export const IMPORT_PAGE_MAINTENANCE = true
