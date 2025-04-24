export interface BannerRun {
  version: string
  start: string
  end: string
}

export interface Banner {
  bannerId: number
  bannerName: string
  bannerType: 1 | 2 | 3
  outfit4StarId: string[]
  outfit5StarId: string[]
  runs: BannerRun[]
}

export interface BannerData {
  [key: string]: Banner
}
