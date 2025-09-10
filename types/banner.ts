export interface BannerRun {
  version: string
  start: string
  end: string
}

export interface Banner {
  bannerId: number
  bannerType: 1 | 2 | 3
  outfit4StarId: string[]
  outfit5StarId: string[]
  runs: BannerRun[]
  rewardIds?: string[]
}

export interface BannerData {
  [key: number]: Banner
}
