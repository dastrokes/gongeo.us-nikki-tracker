/**
 * Shared composable for voting/ranking mode toggle
 * Manages the state of personal vs community mode across vote and ranking pages
 */
import {
  CURRENT_BANNER_VOTE_SEASON,
  type BannerVoteSeasonId,
} from '~~/shared/utils/bannerVoteSeasons'

export const useVotingMode = (
  season: BannerVoteSeasonId = CURRENT_BANNER_VOTE_SEASON
) => {
  const VOTING_MODE_KEY = `gongeous-voting-mode:${season}`

  // Shared reactive state
  const isPersonalMode = useState<boolean>(`voting-mode:${season}`, () => {
    if (import.meta.client) {
      try {
        const stored =
          localStorage.getItem(VOTING_MODE_KEY) ??
          (season === '1x'
            ? localStorage.getItem('gongeous-voting-mode')
            : null)
        return stored === 'personal'
      } catch {
        return false
      }
    }
    return false
  })

  // Persist to localStorage when changed
  const setMode = (personal: boolean) => {
    isPersonalMode.value = personal
    if (import.meta.client) {
      try {
        localStorage.setItem(
          VOTING_MODE_KEY,
          personal ? 'personal' : 'community'
        )
      } catch {
        /* The toggle still works without storage. */
      }
    }
  }

  return {
    isPersonalMode: readonly(isPersonalMode),
    setMode,
  }
}
