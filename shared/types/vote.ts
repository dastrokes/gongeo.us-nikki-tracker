export interface BannerVote {
  id?: string
  banner_id_1: number
  banner_id_2: number
  winner_id: number
  voter_fingerprint?: string
  created_at?: string
}

export interface BannerRanking {
  banner_id: number
  wins: number
  losses: number
  elo_rating: number
  updated_at?: string
  // Calculated fields (not stored in DB)
  total_votes?: number // wins + losses
  win_rate?: number // wins / (wins + losses)
  rank?: number // Position in the original ELO ranking
  rank_change?: number // Positions gained since the previous snapshot
}

export interface VotePair {
  banner1: {
    id: number
    image: string
  }
  banner2: {
    id: number
    image: string
  }
}

export interface VoteStats {
  totalVotes: number
  totalVoters: number
  averageVotesPerVoter: number
}

export interface BannerRankingSnapshot {
  rankings: BannerRanking[]
  stats: VoteStats
  updated_at: string | null
  // Last differing snapshot, for rank-change indicators.
  previous_rankings?: BannerRanking[] | null
}

export interface BannerVoteReceipt {
  success: true
  request_id: string
  votes_remaining: number
  retry_after_ms?: number | null
}

export type BannerVoteResult =
  BannerVoteReceipt | { success: false; retry_after_ms: number }
