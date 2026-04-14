export const useBannerVote = () => {
  const { getImageSrc } = imageProvider()
  const {
    voterFingerprint,
    isFingerprintInitialized,
    isFingerprintFallback,
    initVoterFingerprint,
  } = useVoterFingerprint()

  // Initialize on mount
  if (import.meta.client) {
    initVoterFingerprint()
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

    // Get vote history from localStorage
    const history = getVoteHistory()

    // Select pair with history filtering
    const pair = selectBannerPair(rankings, bannerIds, history)

    // Store this pair in recent history
    addRecentPair(pair.banner1, pair.banner2)

    return {
      banner1: {
        id: pair.banner1,
        image: getImageSrc('banner', pair.banner1),
      },
      banner2: {
        id: pair.banner2,
        image: getImageSrc('banner', pair.banner2),
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
   * Get vote history from localStorage
   * Processes the old format (array of pair strings) into the format needed by selectBannerPair
   * Returns last 10 pairs and last 10 individual banners (from last 5 pairs)
   */
  const getVoteHistory = () => {
    if (!import.meta.client) {
      return { lastPairs: [], lastBanners: [] }
    }

    try {
      const stored = localStorage.getItem('gongeous-recent-votes')
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
   * Add a pair to recent history (keeps last 10 pairs in old format)
   */
  const addRecentPair = (banner1Id: number, banner2Id: number): void => {
    if (!import.meta.client) return

    try {
      const pairKey = getPairKey(banner1Id, banner2Id)
      const stored = localStorage.getItem('gongeous-recent-votes')
      const recentPairs: string[] = stored ? JSON.parse(stored) : []

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
    if (!isFingerprintInitialized.value) {
      await initVoterFingerprint()
    }

    if (isFingerprintFallback.value) {
      return { success: false }
    }

    // Validate request
    if (
      typeof bannerId1 !== 'number' ||
      typeof bannerId2 !== 'number' ||
      typeof winnerId !== 'number'
    ) {
      throw new Error('Invalid request - missing required fields')
    }

    // Validate that both banners are 1.x banners (excluding permanent banner ID 1)
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

    // Rate limiting is handled inside the database function process_vote

    // Call the database function to process vote atomically
    const supabase = useSupabaseClient()
    const result = await supabase.rpc('process_vote', {
      p_banner_id_1: bannerId1,
      p_banner_id_2: bannerId2,
      p_winner_id: winnerId,
      p_voter_fingerprint: voterFingerprint.value || null,
      p_k_factor: 32, // ELO K-factor
    } as never)

    if (result.error) {
      console.error('Failed to process vote:', result.error)
      // Preserve the database error message (e.g., rate limit errors)
      throw new Error(result.error.message || 'Failed to submit vote')
    }

    return { success: true }
  }

  /**
   * Get current rankings from static data (poll ended)
   * Calculates derived fields client-side
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
    // Static final rankings data from completed poll
    const staticRankings = [
      { banner_id: 2, wins: 4453, losses: 4417 },
      { banner_id: 3, wins: 6333, losses: 2536 },
      { banner_id: 4, wins: 2940, losses: 5928 },
      { banner_id: 5, wins: 3258, losses: 5610 },
      { banner_id: 6, wins: 3968, losses: 4902 },
      { banner_id: 7, wins: 4409, losses: 4460 },
      { banner_id: 8, wins: 5833, losses: 3036 },
      { banner_id: 9, wins: 4083, losses: 4788 },
      { banner_id: 10, wins: 4826, losses: 4041 },
      { banner_id: 11, wins: 4102, losses: 4765 },
      { banner_id: 12, wins: 4013, losses: 4856 },
      { banner_id: 13, wins: 5912, losses: 2961 },
      { banner_id: 14, wins: 2601, losses: 6266 },
      { banner_id: 15, wins: 3980, losses: 4889 },
      { banner_id: 16, wins: 5303, losses: 3563 },
      { banner_id: 17, wins: 4997, losses: 3873 },
      { banner_id: 18, wins: 4350, losses: 4520 },
      { banner_id: 19, wins: 6135, losses: 2736 },
      { banner_id: 20, wins: 6500, losses: 2370 },
      { banner_id: 21, wins: 4338, losses: 4531 },
      { banner_id: 22, wins: 3600, losses: 5266 },
      { banner_id: 23, wins: 5140, losses: 3730 },
      { banner_id: 24, wins: 2913, losses: 5954 },
      { banner_id: 25, wins: 1535, losses: 7333 },
      { banner_id: 26, wins: 6803, losses: 2065 },
      { banner_id: 27, wins: 3665, losses: 5205 },
      { banner_id: 28, wins: 4952, losses: 3920 },
      { banner_id: 29, wins: 5359, losses: 3508 },
      { banner_id: 30, wins: 6567, losses: 2300 },
      { banner_id: 31, wins: 3802, losses: 5067 },
      { banner_id: 32, wins: 2982, losses: 5887 },
      { banner_id: 33, wins: 4094, losses: 4774 },
      { banner_id: 34, wins: 4211, losses: 4657 },
      { banner_id: 35, wins: 4374, losses: 4497 },
      { banner_id: 36, wins: 5431, losses: 3437 },
      { banner_id: 37, wins: 3078, losses: 5794 },
      { banner_id: 38, wins: 3958, losses: 4912 },
      { banner_id: 39, wins: 5937, losses: 2934 },
      { banner_id: 40, wins: 3005, losses: 5866 },
      { banner_id: 41, wins: 3641, losses: 5227 },
    ]

    // Calculate derived fields
    const rankings: BannerRanking[] = staticRankings.map((r) => {
      const totalVotes = r.wins + r.losses
      return {
        banner_id: r.banner_id,
        elo_rating: 1500, // Not used anymore but kept for compatibility
        wins: r.wins,
        losses: r.losses,
        total_votes: totalVotes,
        win_rate: totalVotes > 0 ? r.wins / totalVotes : 0,
      }
    })

    return {
      rankings,
      stats: {
        totalVotes: 177381,
        totalVoters: 3714,
        averageVotesPerVoter: 177381 / 3714,
      },
      updated_at: '2025-11-25T17:00:00.000000Z',
    }
  }

  return {
    voterFingerprint: readonly(voterFingerprint),
    getVotePair,
    submitVote,
    getRankings,
  }
}
