import type { VotePair, BannerRanking } from '~/types/vote'
import {
  generateVoterFingerprint,
  getVersion1xBannerIdsExcludingPermanent,
  selectBannerPair,
} from '~/utils/bannerVote'

export const useBannerVote = () => {
  const voterFingerprint = ref<string | null>(null)
  const fingerprintInitialized = ref(false)

  // Initialize voter fingerprint on client side
  const initializeFingerprint = async () => {
    if (fingerprintInitialized.value || !import.meta.client) return

    try {
      // Try to get from localStorage first
      const stored = localStorage.getItem('gongeous-voter-fingerprint')
      if (stored) {
        voterFingerprint.value = stored
        fingerprintInitialized.value = true
        return
      }

      // Generate new fingerprint using FingerprintJS
      const fingerprint = await generateVoterFingerprint()
      voterFingerprint.value = fingerprint
      localStorage.setItem('gongeous-voter-fingerprint', fingerprint)
      fingerprintInitialized.value = true
    } catch (error) {
      console.error('Failed to initialize fingerprint:', error)
      // Use fallback
      const fallback = 'fallback-' + Date.now().toString()
      voterFingerprint.value = fallback
      localStorage.setItem('gongeous-voter-fingerprint', fallback)
      fingerprintInitialized.value = true
    }
  }

  // Initialize on mount
  if (import.meta.client) {
    initializeFingerprint()
  }

  /**
   * Get the next pair of banners to vote on
   * Uses two-stage selection:
   * 1. First banner selected by exposure (prioritizes underexposed)
   * 2. Second banner selected by combined exposure + ELO match quality
   */
  const getVotePair = async (): Promise<VotePair> => {
    // Get all 1.x banner IDs (excluding permanent banner ID 1)
    const bannerIds = getVersion1xBannerIdsExcludingPermanent()

    if (bannerIds.length < 2) {
      throw new Error('Not enough banners available for voting')
    }

    // Fetch rankings (this endpoint can now be cached)
    const { rankings } = await getRankings()

    // Check for recently shown pairs in localStorage
    const recentPairs = getRecentPairs()

    // Try to get a pair that hasn't been shown recently
    let pair: { banner1: number; banner2: number }
    let attempts = 0
    const maxAttempts = 10

    do {
      pair = selectBannerPair(rankings, bannerIds)
      const pairKey = getPairKey(pair.banner1, pair.banner2)

      // If this pair wasn't shown recently, use it
      if (!recentPairs.includes(pairKey)) {
        break
      }

      attempts++
    } while (attempts < maxAttempts)

    // Store this pair in recent history
    addRecentPair(pair.banner1, pair.banner2)

    return {
      banner1: {
        id: pair.banner1,
        image: `/images/banners/${pair.banner1}.webp`,
      },
      banner2: {
        id: pair.banner2,
        image: `/images/banners/${pair.banner2}.webp`,
      },
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
   * Get recently shown pairs from localStorage
   */
  const getRecentPairs = (): string[] => {
    if (!import.meta.client) return []

    try {
      const stored = localStorage.getItem('gongeous-recent-votes')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  /**
   * Add a pair to recent history (keeps last 10 pairs)
   */
  const addRecentPair = (banner1Id: number, banner2Id: number): void => {
    if (!import.meta.client) return

    try {
      const pairKey = getPairKey(banner1Id, banner2Id)
      const recentPairs = getRecentPairs()

      // Add to front, remove duplicates, keep last 10
      const updated = [
        pairKey,
        ...recentPairs.filter((p) => p !== pairKey),
      ].slice(0, 10)

      localStorage.setItem('gongeous-recent-votes', JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to store recent pair:', error)
    }
  }

  /**
   * Submit a vote for a banner pair
   */
  const submitVote = async (
    bannerId1: number,
    bannerId2: number,
    winnerId: number
  ): Promise<{ success: boolean }> => {
    // Ensure fingerprint is initialized before submitting
    if (!fingerprintInitialized.value) {
      await initializeFingerprint()
    }

    const response = await $fetch<{ success: boolean }>('/api/vote', {
      method: 'POST',
      body: {
        banner_id_1: bannerId1,
        banner_id_2: bannerId2,
        winner_id: winnerId,
        voter_fingerprint: voterFingerprint.value,
      },
    })
    return response
  }

  /**
   * Get current rankings from static JSON file in Supabase Storage
   * Calculates derived fields client-side
   * Falls back to default rankings if fetch fails
   */
  const getRankings = async (): Promise<{
    rankings: BannerRanking[]
    stats: {
      totalVotes: number
      totalVoters: number
      averageVotesPerVoter: number
    }
    updated_at: string
  }> => {
    try {
      const config = useRuntimeConfig()
      const supabaseUrl = config.public.supabaseUrl

      const response = await $fetch<{
        rankings: Array<{
          banner_id: number
          elo_rating: number
          wins: number
          losses: number
          updated_at?: string
        }>
        stats: {
          totalVotes: number
          totalVoters: number
          averageVotesPerVoter: number
        }
        updated_at: string
      }>(`${supabaseUrl}/storage/v1/object/public/gongeous/rankings.json`)

      // Calculate derived fields client-side
      const rankings: BannerRanking[] = response.rankings.map((r) => {
        const totalVotes = r.wins + r.losses
        return {
          ...r,
          total_votes: totalVotes,
          win_rate: totalVotes > 0 ? r.wins / totalVotes : 0,
        }
      })

      return {
        rankings,
        stats: response.stats,
        updated_at: response.updated_at,
      }
    } catch (error) {
      console.error('Failed to fetch rankings:', error)
      
      // Fallback: Generate default rankings for all 1.x banners
      const bannerIds = getVersion1xBannerIdsExcludingPermanent()
      const defaultEloRating = 1500
      
      const fallbackRankings: BannerRanking[] = bannerIds.map((id) => ({
        banner_id: id,
        elo_rating: defaultEloRating,
        wins: 0,
        losses: 0,
        total_votes: 0,
        win_rate: 0,
      }))

      return {
        rankings: fallbackRankings,
        stats: {
          totalVotes: 0,
          totalVoters: 0,
          averageVotesPerVoter: 0,
        },
        updated_at: new Date().toISOString(),
      }
    }
  }

  return {
    voterFingerprint: readonly(voterFingerprint),
    getVotePair,
    submitVote,
    getRankings,
  }
}
