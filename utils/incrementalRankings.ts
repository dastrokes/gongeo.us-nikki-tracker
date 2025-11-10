import type { BannerVote, BannerRanking } from '~/types/vote'
import { calculateEloChange } from './bannerVote'

/**
 * ADVANCED OPTIMIZATION: Incremental ELO computation
 *
 * For large-scale deployments (10k+ votes), consider storing ELO ratings
 * in the database and updating them incrementally on each vote.
 *
 * This approach:
 * - Reduces computation from O(n) to O(1) per request
 * - Requires database schema changes (add banner_rankings table)
 * - Trades computation for storage
 *
 * Implementation steps:
 * 1. Create banner_rankings table with columns:
 *    - banner_id (primary key)
 *    - elo_rating (default 1500)
 *    - wins, losses
 *    - updated_at
 *
 * 2. On vote submission, update both banners' rankings atomically
 * 3. Rankings endpoint just reads from banner_rankings table
 *
 * This file provides helper functions for incremental updates.
 */

/**
 * Update ELO ratings for two banners after a vote
 * Use this in a database transaction when recording a vote
 */
export function updateEloRatingsIncremental(
  banner1Id: number,
  banner1CurrentElo: number,
  banner2Id: number,
  banner2CurrentElo: number,
  winnerId: number
): {
  banner1NewElo: number
  banner2NewElo: number
} {
  const isBanner1Winner = winnerId === banner1Id
  const { winnerChange, loserChange } = calculateEloChange(
    isBanner1Winner ? banner1CurrentElo : banner2CurrentElo,
    isBanner1Winner ? banner2CurrentElo : banner1CurrentElo
  )

  return {
    banner1NewElo:
      banner1CurrentElo + (isBanner1Winner ? winnerChange : loserChange),
    banner2NewElo:
      banner2CurrentElo + (isBanner1Winner ? loserChange : winnerChange),
  }
}

/**
 * Rebuild all rankings from scratch (for data migration or recovery)
 * This is the same as computeAllRankingsFromVotes but returns a Map
 * for easier database updates
 */
export function rebuildAllRankingsFromVotes(
  bannerIds: number[],
  allVotes: BannerVote[]
): Map<number, BannerRanking> {
  const elos = new Map<number, number>()
  const wins = new Map<number, number>()
  const losses = new Map<number, number>()

  // Initialize
  bannerIds.forEach((id) => {
    elos.set(id, 1500)
    wins.set(id, 0)
    losses.set(id, 0)
  })

  // Sort votes chronologically
  const sortedVotes = [...allVotes].sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0
    return timeA - timeB
  })

  // Process all votes
  for (const vote of sortedVotes) {
    // Update wins/losses
    if (vote.winner_id === vote.banner_id_1) {
      wins.set(vote.banner_id_1, (wins.get(vote.banner_id_1) ?? 0) + 1)
      losses.set(vote.banner_id_2, (losses.get(vote.banner_id_2) ?? 0) + 1)
    } else {
      wins.set(vote.banner_id_2, (wins.get(vote.banner_id_2) ?? 0) + 1)
      losses.set(vote.banner_id_1, (losses.get(vote.banner_id_1) ?? 0) + 1)
    }

    // Update ELOs
    const banner1Elo = elos.get(vote.banner_id_1) ?? 1500
    const banner2Elo = elos.get(vote.banner_id_2) ?? 1500

    const { banner1NewElo, banner2NewElo } = updateEloRatingsIncremental(
      vote.banner_id_1,
      banner1Elo,
      vote.banner_id_2,
      banner2Elo,
      vote.winner_id
    )

    elos.set(vote.banner_id_1, banner1NewElo)
    elos.set(vote.banner_id_2, banner2NewElo)
  }

  // Build rankings map
  const rankings = new Map<number, BannerRanking>()
  bannerIds.forEach((bannerId) => {
    const bannerWins = wins.get(bannerId) ?? 0
    const bannerLosses = losses.get(bannerId) ?? 0
    const totalVotes = bannerWins + bannerLosses

    rankings.set(bannerId, {
      banner_id: bannerId,
      wins: bannerWins,
      losses: bannerLosses,
      elo_rating: elos.get(bannerId) ?? 1500,
      // Calculated fields
      total_votes: totalVotes,
      win_rate: totalVotes > 0 ? bannerWins / totalVotes : 0,
    })
  })

  return rankings
}
