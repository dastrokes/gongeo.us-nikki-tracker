export type BannerVoteSeasonId = '1x' | '2x'
export type BannerVotePhase = 'upcoming' | 'open' | 'closed' | 'paused'

export interface BannerVoteSeason {
  id: BannerVoteSeasonId
  version: string
  bannerIds: readonly number[]
  rosterFinal: boolean
  enabled: boolean
  opensAt: string | null
  closesAt: string | null
  archived: boolean
}

// Switch this only in the deployment that opens the next community poll.
export const CURRENT_BANNER_VOTE_SEASON: BannerVoteSeasonId = '2x'
// The database contains only this poll; completed results live in archives.
export const LIVE_BANNER_VOTE_SEASON: BannerVoteSeasonId = '2x'

export const BANNER_VOTE_SEASONS: Record<BannerVoteSeasonId, BannerVoteSeason> =
  {
    '1x': {
      id: '1x',
      version: '1.x',
      bannerIds: Array.from({ length: 40 }, (_, index) => index + 2),
      rosterFinal: true,
      enabled: false,
      opensAt: '2025-11-12T00:00:00Z',
      closesAt: '2025-11-25T17:00:00Z',
      archived: true,
    },
    '2x': {
      id: '2x',
      version: '2.x',
      // First debuts in 2.x, through 2.11.2.
      bannerIds: Array.from({ length: 41 }, (_, index) => index + 42),
      rosterFinal: true,
      enabled: true,
      opensAt: '2026-10-22T01:14:37Z',
      closesAt: null,
      archived: false,
    },
  }

export function isBannerVoteSeason(
  value: unknown
): value is BannerVoteSeasonId {
  return value === '1x' || value === '2x'
}

export function getBannerVotePhase(
  season: BannerVoteSeason,
  now = Date.now()
): BannerVotePhase {
  if (season.archived) return 'closed'
  if (!season.rosterFinal || !season.opensAt) return 'upcoming'
  const opens = Date.parse(season.opensAt)
  const closes = season.closesAt ? Date.parse(season.closesAt) : Infinity
  if (!Number.isFinite(opens) || Number.isNaN(closes) || closes <= opens) {
    return 'upcoming'
  }
  if (now < opens) return 'upcoming'
  if (now >= closes) return 'closed'
  return season.enabled ? 'open' : 'paused'
}
