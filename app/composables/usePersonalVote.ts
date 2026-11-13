import {
  BANNER_VOTE_SEASONS,
  CURRENT_BANNER_VOTE_SEASON,
  type BannerVoteSeasonId,
} from '~~/shared/utils/bannerVoteSeasons'
import type { BannerRankingSnapshot } from '~~/shared/types/vote'

export const usePersonalVote = (
  season: BannerVoteSeasonId = CURRENT_BANNER_VOTE_SEASON
) => {
  const { getImageSrc } = imageProvider()
  const bannerIds = BANNER_VOTE_SEASONS[season].bannerIds

  const getPersonalRankings = (): BannerRankingSnapshot => {
    const data = loadPersonalRankings(season)
    const rankings: BannerRanking[] = bannerIds.map((bannerId) => {
      const row = data[String(bannerId)] ?? { elo: 1500, wins: 0, losses: 0 }
      const total = row.wins + row.losses
      return {
        banner_id: bannerId,
        elo_rating: row.elo,
        wins: row.wins,
        losses: row.losses,
        total_votes: total,
        win_rate: total ? row.wins / total : 0,
      }
    })
    rankings.sort(
      (a, b) => b.elo_rating - a.elo_rating || a.banner_id - b.banner_id
    )
    rankings.forEach((row, index) => {
      row.rank = index + 1
    })
    const totalVotes = rankings.reduce((total, row) => total + row.wins, 0)
    return {
      rankings,
      stats: { totalVotes, totalVoters: 1, averageVotesPerVoter: totalVotes },
      updated_at: null,
    }
  }

  const getPersonalVotePair = (): VotePair => {
    const pair = selectBannerPair(
      getPersonalRankings().rankings,
      [...bannerIds],
      getVoteHistory(season, 'personal')
    )
    addRecentPair(season, 'personal', pair.banner1, pair.banner2)
    return {
      banner1: { id: pair.banner1, image: getImageSrc('banner', pair.banner1) },
      banner2: { id: pair.banner2, image: getImageSrc('banner', pair.banner2) },
    }
  }

  const submitPersonalVote = (
    banner1: number,
    banner2: number,
    winner: number
  ): boolean => {
    if (
      banner1 === banner2 ||
      !bannerIds.includes(banner1) ||
      !bannerIds.includes(banner2) ||
      (winner !== banner1 && winner !== banner2)
    ) {
      throw new Error('Invalid personal banner vote')
    }
    const first = getPersonalBannerData(banner1, season)
    const second = getPersonalBannerData(banner2, season)
    const change =
      winner === banner1
        ? calculateEloChange(first.elo, second.elo)
        : calculateEloChange(second.elo, first.elo)
    if (
      !updatePersonalRankingsAfterVote(banner1, banner2, winner, change, season)
    ) {
      throw new Error('Failed to save personal vote')
    }
    return true
  }

  return {
    getPersonalVotePair,
    submitPersonalVote,
    getPersonalRankings,
    clearPersonalData: () => clearPersonalRankings(season),
  }
}
