import type { BannerRankingSnapshot } from '../types/vote'

function matchesCalculatedRatio(
  value: unknown,
  expected: number
): value is number {
  // PostgreSQL's JSON output can round ratios differently from JavaScript.
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    Math.abs(value - expected) <= 1e-12 * Math.max(1, Math.abs(expected))
  )
}

export function createInitialBannerRankingSnapshot(
  bannerIds: readonly number[]
): BannerRankingSnapshot {
  return {
    rankings: bannerIds.map((banner_id) => ({
      banner_id,
      elo_rating: 1500,
      wins: 0,
      losses: 0,
      total_votes: 0,
      win_rate: 0,
    })),
    stats: { totalVotes: 0, totalVoters: 0, averageVotesPerVoter: 0 },
    updated_at: null,
  }
}

export function validateBannerRankingSnapshot(
  value: unknown,
  bannerIds: readonly number[]
): value is BannerRankingSnapshot {
  if (!value || typeof value !== 'object') return false
  const data = value as BannerRankingSnapshot
  if (
    !Array.isArray(data.rankings) ||
    data.rankings.length !== bannerIds.length ||
    !data.stats
  )
    return false
  const seen = new Set<number>()
  let wins = 0
  let losses = 0
  for (const row of data.rankings) {
    if (
      !row ||
      !bannerIds.includes(row.banner_id) ||
      seen.has(row.banner_id) ||
      !Number.isFinite(row.elo_rating) ||
      !Number.isSafeInteger(row.wins) ||
      !Number.isSafeInteger(row.losses) ||
      row.wins < 0 ||
      row.losses < 0
    )
      return false
    const total = row.wins + row.losses
    if (
      row.total_votes !== total ||
      !matchesCalculatedRatio(row.win_rate, total ? row.wins / total : 0) ||
      row.win_rate > 1
    )
      return false
    seen.add(row.banner_id)
    wins += row.wins
    losses += row.losses
  }
  return (
    wins === losses &&
    wins === data.stats.totalVotes &&
    Number.isSafeInteger(data.stats.totalVoters) &&
    data.stats.totalVoters >= 0 &&
    data.stats.totalVoters <= wins &&
    matchesCalculatedRatio(
      data.stats.averageVotesPerVoter,
      data.stats.totalVoters ? wins / data.stats.totalVoters : 0
    ) &&
    typeof data.updated_at === 'string' &&
    Number.isFinite(Date.parse(data.updated_at))
  )
}
