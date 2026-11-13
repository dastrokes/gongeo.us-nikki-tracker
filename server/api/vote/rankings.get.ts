import {
  BANNER_VOTE_SEASONS,
  CURRENT_BANNER_VOTE_SEASON,
  LIVE_BANNER_VOTE_SEASON,
  isBannerVoteSeason,
} from '~~/shared/utils/bannerVoteSeasons'
import { getBannerRankingArchive } from '~~/shared/data/bannerRankingArchives'
import {
  createInitialBannerRankingSnapshot,
  validateBannerRankingSnapshot,
} from '~~/shared/utils/bannerRankingSnapshot'
import { getGameVersion } from '~~/shared/utils/gameVersion'

export default defineCachedApiEventHandler(
  async (event) => {
    const seasonId = getQuery(event).season ?? CURRENT_BANNER_VOTE_SEASON
    if (!isBannerVoteSeason(seasonId))
      throw createNotFoundError('Banner vote season')
    const archive = getBannerRankingArchive(seasonId)
    if (archive) return archive
    const season = BANNER_VOTE_SEASONS[seasonId]
    if (season.archived || seasonId !== LIVE_BANNER_VOTE_SEASON) {
      throw createNotFoundError('Banner ranking archive')
    }
    if (
      !season.rosterFinal ||
      !season.opensAt ||
      Date.now() < Date.parse(season.opensAt)
    ) {
      return createInitialBannerRankingSnapshot(season.bannerIds)
    }
    const { data, error } = await withSupabaseRetry(() =>
      useSupabaseServerClient()
        .from('banner_ranking_snapshots')
        .select('rankings, stats, updated_at')
        .eq('id', 1)
        .single()
    )
    if (error || !validateBannerRankingSnapshot(data, season.bannerIds)) {
      console.error(
        `Banner ranking snapshot unavailable for ${seasonId}: ${toErrorMessage(error, 'Invalid or missing snapshot')}`
      )
      throw createApiFailureError('fetch banner rankings', { transient: true })
    }
    return data
  },
  {
    cache: {
      maxAge: 3600,
      swr: false,
      getKey: (event) =>
        `${getGameVersion()}:${getQuery(event).season ?? CURRENT_BANNER_VOTE_SEASON}`,
    },
    headers: { varyQuery: true },
    profile: 'bannerRanking',
  }
)
