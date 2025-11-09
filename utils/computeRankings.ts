import type { BannerVote, BannerRanking } from '~/types/vote'
import { calculateEloChange } from './bannerVote'

/**
 * Compute wins, losses, total votes, and exposure for a banner from vote records
 * Exposure = how many times banner appeared in a vote (banner_id_1 or banner_id_2)
 */
function computeStatsFromVotes(
  bannerId: number,
  votes: BannerVote[]
): { wins: number; losses: number; totalVotes: number; exposure: number } {
  let wins = 0
  let losses = 0
  let totalVotes = 0
  let exposure = 0

  for (const vote of votes) {
    const isInvolved =
      vote.banner_id_1 === bannerId || vote.banner_id_2 === bannerId

    if (isInvolved) {
      exposure++
      totalVotes++
      if (vote.winner_id === bannerId) {
        wins++
      } else {
        losses++
      }
    }
  }

  return { wins, losses, totalVotes, exposure }
}

/**
 * Compute ELO ratings for all banners efficiently in a single pass
 * Processes votes chronologically and updates ratings incrementally
 */
function computeAllElosFromVotes(
  bannerIds: number[],
  allVotes: BannerVote[]
): Map<number, number> {
  const elos = new Map<number, number>()
  bannerIds.forEach((id) => elos.set(id, 1500))

  // Sort votes chronologically - handle undefined created_at
  const sortedVotes = [...allVotes].sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0
    return timeA - timeB
  })

  // Process each vote and update ELOs
  for (const vote of sortedVotes) {
    const banner1Elo = elos.get(vote.banner_id_1) ?? 1500
    const banner2Elo = elos.get(vote.banner_id_2) ?? 1500

    const isBanner1Winner = vote.winner_id === vote.banner_id_1
    const { winnerChange, loserChange } = calculateEloChange(
      isBanner1Winner ? banner1Elo : banner2Elo,
      isBanner1Winner ? banner2Elo : banner1Elo
    )

    if (isBanner1Winner) {
      elos.set(vote.banner_id_1, banner1Elo + winnerChange)
      elos.set(vote.banner_id_2, banner2Elo + loserChange)
    } else {
      elos.set(vote.banner_id_1, banner1Elo + loserChange)
      elos.set(vote.banner_id_2, banner2Elo + winnerChange)
    }
  }

  return elos
}

/**
 * Compute exposure counts for all banners from votes
 * Returns a map of banner_id -> exposure_count
 */
function computeExposureFromVotes(
  bannerIds: number[],
  allVotes: BannerVote[]
): Map<number, number> {
  const exposure = new Map<number, number>()
  bannerIds.forEach((id) => exposure.set(id, 0))

  for (const vote of allVotes) {
    const current1 = exposure.get(vote.banner_id_1) ?? 0
    const current2 = exposure.get(vote.banner_id_2) ?? 0
    exposure.set(vote.banner_id_1, current1 + 1)
    exposure.set(vote.banner_id_2, current2 + 1)
  }

  return exposure
}

/**
 * Compute all rankings for all banners efficiently in a single pass
 * This is the main function - it processes votes once and computes all metrics
 */
export function computeAllRankingsFromVotes(
  bannerIds: number[],
  allVotes: BannerVote[]
): BannerRanking[] {
  const elos = computeAllElosFromVotes(bannerIds, allVotes)
  const exposure = computeExposureFromVotes(bannerIds, allVotes)

  const rankings: BannerRanking[] = bannerIds.map((bannerId) => {
    const { wins, losses, totalVotes } = computeStatsFromVotes(
      bannerId,
      allVotes
    )
    const winRate = totalVotes > 0 ? wins / totalVotes : 0

    return {
      banner_id: bannerId,
      wins,
      losses,
      total_votes: totalVotes,
      exposure_count: exposure.get(bannerId) ?? 0,
      elo_rating: elos.get(bannerId) ?? 1500,
      win_rate: winRate,
    }
  })

  rankings.sort((a, b) => b.elo_rating - a.elo_rating)

  return rankings
}
