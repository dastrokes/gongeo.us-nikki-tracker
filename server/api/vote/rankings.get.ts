import { useSupabaseClient } from '~/composables/useSupabaseClient'
import type { BannerRanking } from '~/types/vote'

interface RawRanking {
  banner_id: number
  elo_rating: number
  wins: number
  losses: number
  updated_at?: string
}

interface VoterRecord {
  voter_fingerprint: string | null
}

export default defineEventHandler(async () => {
  const supabase = useSupabaseClient('server')

  try {
    // Get rankings from database (already computed incrementally)
    const { data: rawRankings, error: rankingsError } = await supabase
      .from('banner_rankings')
      .select('*')
      .order('elo_rating', { ascending: false })

    // If no rankings exist yet, return empty array (will be populated on first vote)
    if (rankingsError && rankingsError.code === 'PGRST116') {
      return {
        rankings: [],
        stats: {
          totalVotes: 0,
          totalVoters: 0,
          averageVotesPerVoter: 0,
        },
      }
    }

    if (rankingsError) throw rankingsError

    // Calculate derived fields (total_votes, exposure_count, win_rate)
    const rankings = (rawRankings || []).map((r: RawRanking) => {
      const totalVotes = r.wins + r.losses
      return {
        ...r,
        total_votes: totalVotes,
        exposure_count: totalVotes,
        win_rate: totalVotes > 0 ? r.wins / totalVotes : 0,
      }
    })

    // Get vote statistics
    const { count: totalVotes } = await supabase
      .from('banner_votes')
      .select('*', { count: 'exact', head: true })

    // Calculate unique voters
    const { data: uniqueVoters } = await supabase
      .from('banner_votes')
      .select('voter_fingerprint')
      .not('voter_fingerprint', 'is', null)

    const uniqueVoterCount = new Set(
      (uniqueVoters as VoterRecord[])
        ?.map((v: VoterRecord) => v.voter_fingerprint)
        .filter(Boolean) || []
    ).size

    const stats = {
      totalVotes: totalVotes || 0,
      totalVoters: uniqueVoterCount,
      averageVotesPerVoter:
        uniqueVoterCount > 0 ? (totalVotes || 0) / uniqueVoterCount : 0,
    }

    return {
      rankings: (rankings || []) as BannerRanking[],
      stats,
    }
  } catch (error) {
    console.error('Failed to get rankings:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to get rankings',
    })
  }
})
