import type { VotePair, BannerRanking, VoteStats } from '~/types/vote'
import { generateVoterFingerprint } from '~/utils/bannerVote'

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
   */
  const getVotePair = async (): Promise<VotePair> => {
    const response = await $fetch<VotePair>('/api/vote/pair')
    return response
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
    }>('/api/vote/rankings')
    return response
  }

  return {
    voterFingerprint: readonly(voterFingerprint),
    getVotePair,
    submitVote,
    getRankings,
  }
}
