/**
 * Shared composable for voting/ranking mode toggle
 * Manages the state of personal vs community mode across vote and ranking pages
 */
export const useVotingMode = () => {
  const VOTING_MODE_KEY = 'gongeous-voting-mode'

  // Shared reactive state
  const isPersonalMode = useState<boolean>('voting-mode', () => {
    if (import.meta.client) {
      const stored = localStorage.getItem(VOTING_MODE_KEY)
      return stored === 'personal'
    }
    return false
  })

  // Persist to localStorage when changed
  const setMode = (personal: boolean) => {
    isPersonalMode.value = personal
    if (import.meta.client) {
      localStorage.setItem(VOTING_MODE_KEY, personal ? 'personal' : 'community')
    }
  }

  return {
    isPersonalMode: readonly(isPersonalMode),
    setMode,
  }
}
