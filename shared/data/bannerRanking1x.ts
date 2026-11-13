import type { BannerRankingSnapshot } from '../types/vote'

// Published 1.x results. Do not recalculate these from later live data.
const rows = [
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

export function getBannerRanking1xArchive(): BannerRankingSnapshot {
  return {
    rankings: rows.map((row) => ({
      ...row,
      elo_rating: 1500,
      total_votes: row.wins + row.losses,
      win_rate: row.wins / (row.wins + row.losses),
    })),
    stats: {
      totalVotes: 177381,
      totalVoters: 3714,
      averageVotesPerVoter: 177381 / 3714,
    },
    updated_at: '2025-11-25T17:00:00.000000Z',
  }
}
