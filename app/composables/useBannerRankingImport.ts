export const useBannerRankingImport = () =>
  useState<{ majorVersion: string; bannerIds: number[] } | null>(
    'banner-ranking-import',
    () => null
  )
