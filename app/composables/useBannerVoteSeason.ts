import { useIntervalFn, useNow } from '@vueuse/core'
import {
  BANNER_VOTE_SEASONS,
  CURRENT_BANNER_VOTE_SEASON,
  type BannerVoteSeasonId,
  getBannerVotePhase,
  isBannerVoteSeason,
} from '~~/shared/utils/bannerVoteSeasons'

export const useBannerVoteSeason = (
  defaultSeason: BannerVoteSeasonId = CURRENT_BANNER_VOTE_SEASON
) => {
  const requested = useRoute().params.season ?? defaultSeason
  if (!isBannerVoteSeason(requested))
    throw createError({
      statusCode: 404,
      statusMessage: 'Banner vote season not found',
      fatal: true,
    })
  const id = requested
  const season = BANNER_VOTE_SEASONS[id]
  const now = useNow({
    scheduler: (callback) => useIntervalFn(callback, 30000),
  })
  return {
    id,
    season,
    phase: computed(() => getBannerVotePhase(season, now.value.getTime())),
  }
}
