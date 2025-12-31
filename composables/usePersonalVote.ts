/**
 * Personal Voting Composable
 * Handles personal voting logic with localStorage-based data storage
 */

import type { VotePair, BannerRanking, VoteStats } from '~/types/vote'
import {
  calculateEloChange,
  selectBannerPair,
  getVersion1xBannerIdsExcludingPermanent,
  type VoteHistory,
} from '~/utils/bannerVote'
import {
  loadPersonalRankings,
  updatePersonalRankingsAfterVote,
  getPersonalBannerData,
  clearPersonalRankings,
  STORAGE_KEYS,
} from '~/utils/personalVoteStorage'

export const usePersonalVote = () => {
  /**
   * Get the next pair of banners for personal voting
   * Uses existing selectBannerPair utility with personal rankings data
   * Reuses community's recent pairs for history tracking
   */
  const getPersonalVotePair = (): VotePair => {
    // Get all 1.x banner IDs (excluding permanent banner ID 1)
    const bannerIds = getVersion1xBannerIdsExcludingPermanent()

    if (bannerIds.length < 2) {
      throw new Error('Not enough banners available for voting')
    }

    // Load personal rankings data from localStorage
    const personalData = loadPersonalRankings()

    // Transform personal data into BannerRanking format for selectBannerPair
    const rankings: BannerRanking[] = bannerIds.map((bannerId) => {
      const bannerData = personalData[bannerId.toString()]
      if (bannerData) {
        const totalVotes = bannerData.wins + bannerData.losses
        return {
          banner_id: bannerId,
          elo_rating: bannerData.elo,
          wins: bannerData.wins,
          losses: bannerData.losses,
          total_votes: totalVotes,
          win_rate: totalVotes > 0 ? bannerData.wins / totalVotes : 0,
        }
      } else {
        // Default values for banners not yet voted on
        return {
          banner_id: bannerId,
          elo_rating: 1500,
          wins: 0,
          losses: 0,
          total_votes: 0,
          win_rate: 0,
        }
      }
    })

    // Get vote history from community's localStorage (REUSED)
    const history = getVoteHistory()

    // Select pair using existing utility
    const pair = selectBannerPair(rankings, bannerIds, history)

    // Store this pair in recent history (REUSED from community)
    addRecentPair(pair.banner1, pair.banner2)

    return {
      banner1: {
        id: pair.banner1,
        image: `/images/banners/${pair.banner1}.png`,
      },
      banner2: {
        id: pair.banner2,
        image: `/images/banners/${pair.banner2}.png`,
      },
    }
  }

  /**
   * Submit a personal vote
   * Incrementally updates ELOs and win/loss stats in localStorage
   */
  const submitPersonalVote = (
    bannerId1: number,
    bannerId2: number,
    winnerId: number
  ): boolean => {
    // Validate input
    if (
      typeof bannerId1 !== 'number' ||
      typeof bannerId2 !== 'number' ||
      typeof winnerId !== 'number'
    ) {
      throw new Error('Invalid request - missing required fields')
    }

    // Validate that both banners are 1.x banners
    const validBannerIds = getVersion1xBannerIdsExcludingPermanent()
    if (
      !validBannerIds.includes(bannerId1) ||
      !validBannerIds.includes(bannerId2)
    ) {
      throw new Error('Invalid banner IDs - must be version 1.x banners')
    }

    if (winnerId !== bannerId1 && winnerId !== bannerId2) {
      throw new Error('Winner ID must match one of the two banner IDs')
    }

    // Get current ELO ratings for both banners
    const banner1Data = getPersonalBannerData(bannerId1)
    const banner2Data = getPersonalBannerData(bannerId2)

    // Determine winner and loser
    const winnerRating =
      winnerId === bannerId1 ? banner1Data.elo : banner2Data.elo
    const loserRating =
      winnerId === bannerId1 ? banner2Data.elo : banner1Data.elo

    // Calculate ELO changes using existing utility
    const eloChange = calculateEloChange(winnerRating, loserRating, 32)

    // Update personal rankings in localStorage
    const success = updatePersonalRankingsAfterVote(
      bannerId1,
      bannerId2,
      winnerId,
      eloChange
    )

    if (!success) {
      throw new Error(
        'Failed to save personal vote - localStorage quota may be exceeded'
      )
    }

    return success
  }

  /**
   * Get personal rankings
   * Transforms localStorage data into display format with calculated fields
   * Shows all 1.x banners, even those not yet voted on (with default values)
   */
  const getPersonalRankings = (): {
    rankings: BannerRanking[]
    stats: VoteStats
    updated_at: string | null
  } => {
    // Load personal rankings data from localStorage
    const personalData = loadPersonalRankings()

    // Get all 1.x banner IDs (excluding permanent banner ID 1)
    const allBannerIds = getVersion1xBannerIdsExcludingPermanent()

    // Transform into BannerRanking array, including all banners
    const rankings: BannerRanking[] = allBannerIds.map((bannerId) => {
      const bannerData = personalData[bannerId.toString()]

      if (bannerData) {
        const totalVotes = bannerData.wins + bannerData.losses
        return {
          banner_id: bannerId,
          elo_rating: bannerData.elo,
          wins: bannerData.wins,
          losses: bannerData.losses,
          total_votes: totalVotes,
          win_rate: totalVotes > 0 ? bannerData.wins / totalVotes : 0,
        }
      } else {
        // Default values for banners not yet voted on
        return {
          banner_id: bannerId,
          elo_rating: 1500,
          wins: 0,
          losses: 0,
          total_votes: 0,
          win_rate: 0,
        }
      }
    })

    // Sort by ELO rating (descending), then by banner_id for consistency
    rankings.sort((a, b) => {
      if (b.elo_rating !== a.elo_rating) {
        return b.elo_rating - a.elo_rating
      }
      return a.banner_id - b.banner_id
    })

    // Add rank field
    rankings.forEach((ranking, index) => {
      ranking.rank = index + 1
    })

    // Calculate total votes from banner data
    const totalVotes = Object.values(personalData).reduce(
      (sum, banner) => sum + banner.wins,
      0
    )

    // Calculate stats
    const stats: VoteStats = {
      totalVotes,
      totalVoters: 1, // Personal voting is always 1 voter
      averageVotesPerVoter: totalVotes,
    }

    return {
      rankings,
      stats,
      updated_at: null,
    }
  }

  /**
   * Clear all personal voting data
   * Removes personal rankings from localStorage
   */
  const clearPersonalData = (): void => {
    clearPersonalRankings()
  }

  /**
   * Get vote history from localStorage (REUSED from community voting)
   * Returns last 10 pairs and last 10 individual banners
   */
  const getVoteHistory = (): VoteHistory => {
    if (!import.meta.client) {
      return { lastPairs: [], lastBanners: [] }
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.RECENT_PAIRS)
      if (!stored) {
        return { lastPairs: [], lastBanners: [] }
      }

      const pairKeys: string[] = JSON.parse(stored)

      // Convert pair keys (e.g., "5-12") to pair objects
      const pairs = pairKeys
        .map((pairKey) => {
          const parts = pairKey.split('-').map(Number)
          if (parts.length === 2 && !isNaN(parts[0]!) && !isNaN(parts[1]!)) {
            return { banner1: parts[0]!, banner2: parts[1]! }
          }
          return null
        })
        .filter((p): p is { banner1: number; banner2: number } => p !== null)

      // Get last 10 individual banners from last 5 pairs
      const banners = pairs.slice(0, 5).flatMap((p) => [p.banner1, p.banner2])

      return { lastPairs: pairs, lastBanners: banners }
    } catch {
      return { lastPairs: [], lastBanners: [] }
    }
  }

  /**
   * Generate a unique key for a banner pair (order-independent)
   */
  const getPairKey = (banner1Id: number, banner2Id: number): string => {
    const [id1, id2] = [banner1Id, banner2Id].sort((a, b) => a - b)
    return `${id1}-${id2}`
  }

  /**
   * Add a pair to recent history (REUSED from community voting)
   * Keeps last 10 pairs in localStorage
   */
  const addRecentPair = (banner1Id: number, banner2Id: number): void => {
    if (!import.meta.client) return

    try {
      const pairKey = getPairKey(banner1Id, banner2Id)
      const stored = localStorage.getItem(STORAGE_KEYS.RECENT_PAIRS)
      const recentPairs: string[] = stored ? JSON.parse(stored) : []

      // Add to front, remove duplicates, keep last 10
      const updated = [
        pairKey,
        ...recentPairs.filter((p) => p !== pairKey),
      ].slice(0, 10)

      localStorage.setItem(STORAGE_KEYS.RECENT_PAIRS, JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to store recent pair:', error)
    }
  }

  return {
    getPersonalVotePair,
    submitPersonalVote,
    getPersonalRankings,
    clearPersonalData,
  }
}
