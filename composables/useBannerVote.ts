import type { VotePair, BannerRanking, VoteStats } from '~/types/vote'
import {
  generateVoterFingerprint,
  getVersion1xBannerIdsExcludingPermanent,
  calculateExposureWeights,
  selectBannerByWeight,
} from '~/utils/bannerVote'

export const useBannerVote = () => {
  const voterFingerprint = ref<string | null>(null)
  const fingerprintInitialized = ref(false)

  // Initialize voter fingerprint on client side
  const initializeFingerprint = async () => {
    if (fingerprintInitialized.value || !import.meta.client) return

    try {
      // Try to get from localStorage first
      const stored = localStorage.getItem('voter_fingerprint')
      if (stored) {
        voterFingerprint.value = stored
        fingerprintInitialized.value = true
        return
      }

      // Generate new fingerprint using FingerprintJS
      const fingerprint = await generateVoterFingerprint()
      voterFingerprint.value = fingerprint
      localStorage.setItem('voter_fingerprint', fingerprint)
      fingerprintInitialized.value = true
    } catch (error) {
      console.error('Failed to initialize fingerprint:', error)
      // Use fallback
      const fallback = 'fallback-' + Date.now().toString()
      voterFingerprint.value = fallback
      localStorage.setItem('voter_fingerprint', fallback)
      fingerprintInitialized.value = true
    }
  }

  // Initialize on mount
  if (import.meta.client) {
    initializeFingerprint()
  }

  /**
   * Get the next pair of banners to vote on
   * Now calculated client-side using rankings data
   */
  const getVotePair = async (): Promise<VotePair> => {
    // Get all 1.x banner IDs (excluding permanent banner ID 1)
    const bannerIds = getVersion1xBannerIdsExcludingPermanent()

    if (bannerIds.length < 2) {
      throw new Error('Not enough banners available for voting')
    }

    // Fetch rankings (this endpoint can now be cached)
    const { rankings } = await getRankings()

    // Calculate exposure weights
    const weights = calculateExposureWeights(rankings)

    // Select two different banners based on exposure balance
    let banner1: number
    let banner2: number
    let attempts = 0
    const maxAttempts = 50

    do {
      banner1 = selectBannerByWeight(bannerIds, weights)
      banner2 = selectBannerByWeight(bannerIds, weights)
      attempts++
    } while (banner1 === banner2 && attempts < maxAttempts)

    if (banner1 === banner2) {
      // Fallback: just pick two random different banners
      const shuffled = [...bannerIds].sort(() => Math.random() - 0.5)
      banner1 = shuffled[0]!
      banner2 = shuffled[1]!
    }

    return {
      banner1: {
        id: banner1,
        image: `/images/banners/${banner1}.webp`,
      },
      banner2: {
        id: banner2,
        image: `/images/banners/${banner2}.webp`,
      },
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
   * Get current rankings
   */
  const getRankings = async (): Promise<{
    rankings: BannerRanking[]
    stats: VoteStats
  }> => {
    const response = await $fetch<{
      rankings: BannerRanking[]
      stats: VoteStats
    }>('/api/rankings')
    return response
  }

  return {
    voterFingerprint: readonly(voterFingerprint),
    getVotePair,
    submitVote,
    getRankings,
  }
}
