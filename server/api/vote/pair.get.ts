import { useSupabaseClient } from '~/composables/useSupabaseClient'
import {
  getVersion1xBannerIdsExcludingPermanent,
  calculateExposureWeights,
  selectBannerByWeight,
} from '~/utils/bannerVote'
import type { BannerRanking } from '~/types/vote'

interface RawRanking {
  banner_id: number
  elo_rating: number
  wins: number
  losses: number
  updated_at?: string
}

export default defineEventHandler(async () => {
  const supabase = useSupabaseClient('server')

  try {
    // Get all 1.x banner IDs (excluding permanent banner ID 1)
    const bannerIds = getVersion1xBannerIdsExcludingPermanent()

    if (bannerIds.length < 2) {
      throw createError({
        statusCode: 400,
        message: 'Not enough banners available for voting',
      })
    }

    // Get rankings from database (already computed incrementally)
    const { data: rawRankings } = await supabase
      .from('banner_rankings')
      .select('*')

    // Calculate derived fields and convert to BannerRanking[]
    const rankingsList = (rawRankings || []).map((r: RawRanking) => {
      const totalVotes = r.wins + r.losses
      return {
        ...r,
        total_votes: totalVotes,
        exposure_count: totalVotes,
        win_rate: totalVotes > 0 ? r.wins / totalVotes : 0,
      }
    }) as BannerRanking[]

    // Calculate exposure weights
    const weights = calculateExposureWeights(rankingsList)

    // Select two different banners based on exposure balance
    let banner1: number
    let banner2: number
    let attempts = 0
    const maxAttempts = 50

    do {
      banner1 = selectBannerByWeight(bannerIds, weights)
      banner2 = selectBannerByWeight(bannerIds, weights)
      attempts++
    } while (banner1 === banner2 && attempts < maxAttempts)

    if (banner1 === banner2) {
      // Fallback: just pick two random different banners
      const shuffled = [...bannerIds].sort(() => Math.random() - 0.5)
      banner1 = shuffled[0]!
      banner2 = shuffled[1]!
    }

    return {
      banner1: {
        id: banner1,
        image: `/images/banners/${banner1}.webp`,
      },
      banner2: {
        id: banner2,
        image: `/images/banners/${banner2}.webp`,
      },
    }
  } catch (error) {
    console.error('Failed to get vote pair:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to get vote pair',
    })
  }
})
