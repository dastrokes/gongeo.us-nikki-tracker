/**
 * Personal Vote Storage Utilities
 * Handles localStorage operations for personal voting data
 */

// Storage keys
export const STORAGE_KEYS = {
  RANKINGS: 'gongeous-personal-rankings',
  RECENT_PAIRS: 'gongeous-recent-votes', // REUSED from community voting
} as const

// Personal rankings storage structure
export interface PersonalRankingsData {
  [bannerId: string]: {
    elo: number
    wins: number
    losses: number
  }
}

/**
 * Load personal rankings data from localStorage
 * Returns default structure if no data exists or data is corrupted
 */
export function loadPersonalRankings(): PersonalRankingsData {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.RANKINGS)
    if (!stored) {
      return createDefaultRankingsData()
    }

    const data = JSON.parse(stored) as PersonalRankingsData

    // Validate structure
    if (!validateRankingsData(data)) {
      console.warn('Invalid personal rankings data structure, resetting')
      return createDefaultRankingsData()
    }

    return data
  } catch (error) {
    console.error('Failed to load personal rankings:', error)
    return createDefaultRankingsData()
  }
}

/**
 * Save personal rankings data to localStorage
 * Handles quota exceeded errors gracefully
 */
export function savePersonalRankings(data: PersonalRankingsData): boolean {
  try {
    const serialized = JSON.stringify(data)
    localStorage.setItem(STORAGE_KEYS.RANKINGS, serialized)
    return true
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded')
      return false
    }
    console.error('Failed to save personal rankings:', error)
    return false
  }
}

/**
 * Update personal rankings after a vote
 * Incrementally updates ELO ratings and win/loss stats
 */
export function updatePersonalRankingsAfterVote(
  bannerId1: number,
  bannerId2: number,
  winnerId: number,
  eloChange: { winnerChange: number; loserChange: number }
): boolean {
  const data = loadPersonalRankings()

  const loserId = winnerId === bannerId1 ? bannerId2 : bannerId1
  const winnerKey = winnerId.toString()
  const loserKey = loserId.toString()

  // Initialize banner data if not exists
  if (!data[winnerKey]) {
    data[winnerKey] = { elo: 1500, wins: 0, losses: 0 }
  }
  if (!data[loserKey]) {
    data[loserKey] = { elo: 1500, wins: 0, losses: 0 }
  }

  // Update ELO ratings
  data[winnerKey]!.elo += eloChange.winnerChange
  data[loserKey]!.elo += eloChange.loserChange

  // Update win/loss stats
  data[winnerKey]!.wins += 1
  data[loserKey]!.losses += 1

  return savePersonalRankings(data)
}

/**
 * Get banner data from personal rankings
 * Returns default values if banner not found
 */
export function getPersonalBannerData(bannerId: number): {
  elo: number
  wins: number
  losses: number
} {
  const data = loadPersonalRankings()
  const bannerKey = bannerId.toString()

  return (
    data[bannerKey] ?? {
      elo: 1500,
      wins: 0,
      losses: 0,
    }
  )
}

/**
 * Calculate total votes from banner data
 * Total votes = sum of all wins (since each vote creates one winner)
 */
export function calculateTotalVotes(data: PersonalRankingsData): number {
  return Object.values(data).reduce((sum, banner) => sum + banner.wins, 0)
}

/**
 * Clear all personal rankings data
 */
export function clearPersonalRankings(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.RANKINGS)
  } catch (error) {
    console.error('Failed to clear personal rankings:', error)
  }
}

/**
 * Create default rankings data structure
 */
function createDefaultRankingsData(): PersonalRankingsData {
  return {}
}

/**
 * Validate personal rankings data structure
 * Ensures data integrity
 */
function validateRankingsData(data: unknown): data is PersonalRankingsData {
  if (!data || typeof data !== 'object') {
    return false
  }

  // Validate banner data structure
  for (const [bannerId, bannerData] of Object.entries(data)) {
    // Check if bannerId is a valid number string
    if (isNaN(Number(bannerId))) {
      return false
    }

    if (!bannerData || typeof bannerData !== 'object') {
      return false
    }

    const bd = bannerData as Partial<PersonalRankingsData[string]>

    if (
      typeof bd.elo !== 'number' ||
      typeof bd.wins !== 'number' ||
      typeof bd.losses !== 'number'
    ) {
      return false
    }

    // Validate reasonable ranges
    if (bd.elo < 0 || bd.wins < 0 || bd.losses < 0) {
      return false
    }
  }

  return true
}
