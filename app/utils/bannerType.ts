import { BANNER_DATA } from '~~/data/banners'

export function getBannerType(bannerId: number): number {
  const banner = BANNER_DATA[bannerId]
  return banner?.bannerType ?? 1
}
