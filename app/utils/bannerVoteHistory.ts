import type { BannerVoteSeasonId } from '~~/shared/utils/bannerVoteSeasons'

type VoteMode = 'personal' | 'community'

const COMMUNITY_VOTE_WINDOW = 15
const COMMUNITY_TARGET_THRESHOLD = 5
const COMMUNITY_BANNER_COOLDOWN = 10

interface AcceptedCommunityVote {
  requestId: string
  winner: number
  loser: number
}

type CommunityVoteHistory = {
  votes: AcceptedCommunityVote[]
  cooldowns: Array<{ bannerId: number; remaining: number }>
}

export const createCommunityVoteHistory = (): CommunityVoteHistory => ({
  votes: [],
  cooldowns: [],
})

export function recordAcceptedCommunityVote(
  history: CommunityVoteHistory,
  vote: AcceptedCommunityVote
): { history: CommunityVoteHistory; showNotice: boolean } {
  if (history.votes.some(({ requestId }) => requestId === vote.requestId)) {
    return { history, showNotice: false }
  }

  const votes = [vote, ...history.votes].slice(0, COMMUNITY_VOTE_WINDOW)
  const newCooldownBanners = (['winner', 'loser'] as const)
    .filter(
      (side) =>
        !history.cooldowns.some(({ bannerId }) => bannerId === vote[side]) &&
        votes.filter((entry) => entry[side] === vote[side]).length >=
          COMMUNITY_TARGET_THRESHOLD
    )
    .map((side) => vote[side])
  const cooldowns = history.cooldowns
    .filter(({ remaining }) => remaining > 1)
    .map(({ bannerId, remaining }) => ({ bannerId, remaining: remaining - 1 }))
  for (const bannerId of newCooldownBanners) {
    cooldowns.push({ bannerId, remaining: COMMUNITY_BANNER_COOLDOWN })
  }

  return {
    history: { votes, cooldowns },
    showNotice: newCooldownBanners.length > 0,
  }
}

const historyKey = (season: BannerVoteSeasonId, mode: VoteMode) =>
  `gongeous-recent-votes:${season}:${mode}`

export function getVoteHistory(
  season: BannerVoteSeasonId,
  mode: VoteMode
): VoteHistory {
  if (!import.meta.client) return { lastPairs: [], lastBanners: [] }
  try {
    const stored =
      localStorage.getItem(historyKey(season, mode)) ??
      (season === '1x' ? localStorage.getItem('gongeous-recent-votes') : null)
    const keys: unknown = stored ? JSON.parse(stored) : []
    if (!Array.isArray(keys)) return { lastPairs: [], lastBanners: [] }
    const lastPairs = keys
      .filter(
        (key): key is string => typeof key === 'string' && /^\d+-\d+$/.test(key)
      )
      .slice(0, 10)
      .map((key) => {
        const [banner1, banner2] = key.split('-').map(Number)
        return { banner1: banner1!, banner2: banner2! }
      })
    return {
      lastPairs,
      lastBanners: lastPairs
        .slice(0, 5)
        .flatMap(({ banner1, banner2 }) => [banner1, banner2]),
    }
  } catch {
    return { lastPairs: [], lastBanners: [] }
  }
}

export function addRecentPair(
  season: BannerVoteSeasonId,
  mode: VoteMode,
  banner1: number,
  banner2: number
) {
  if (!import.meta.client) return
  try {
    const key = [banner1, banner2].sort((a, b) => a - b).join('-')
    const previous = getVoteHistory(season, mode).lastPairs.map((pair) =>
      [pair.banner1, pair.banner2].sort((a, b) => a - b).join('-')
    )
    localStorage.setItem(
      historyKey(season, mode),
      JSON.stringify(
        [key, ...previous.filter((value) => value !== key)].slice(0, 10)
      )
    )
  } catch {
    // Pair history is optional when browser storage is unavailable.
  }
}
