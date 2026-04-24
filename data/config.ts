export interface CurrentBannerGroupConfig {
  key: string
  bannerIds: number[]
  targetTime: string
}

// Update this file when banners rotate or import maintenance needs to change.
export const CURRENT_BANNER_GROUPS: CurrentBannerGroupConfig[] = [
  {
    key: 'left',
    bannerIds: [59],
    targetTime: '2026-05-28T20:00:00Z',
  },
  {
    key: 'right',
    bannerIds: [60],
    targetTime: '2026-05-28T20:00:00Z',
  },
]

export const LATEST_BANNER_ID = 60

export const IMPORT_PAGE_MAINTENANCE = true
