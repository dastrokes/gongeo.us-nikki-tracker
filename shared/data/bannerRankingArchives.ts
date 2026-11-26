import { getBannerRanking1xArchive } from './bannerRanking1x'
import { getBannerRanking2xArchive } from './bannerRanking2x'
import type { BannerRankingSnapshot } from '../types/vote'
import type { BannerVoteSeasonId } from '../utils/bannerVoteSeasons'

const archives: Partial<
  Record<BannerVoteSeasonId, () => BannerRankingSnapshot>
> = {
  '1x': getBannerRanking1xArchive,
  '2x': getBannerRanking2xArchive,
}

export function getBannerRankingArchive(
  season: BannerVoteSeasonId
): BannerRankingSnapshot | null {
  return archives[season]?.() ?? null
}
