import { useSupabaseClient } from '~/composables/useSupabaseClient'
import { getVersion1xBannerIdsExcludingPermanent } from '~/utils/bannerVote'

interface RawRanking {
  banner_id: number
  elo_rating: number
  wins: number
  losses: number
  updated_at?: string
}

export default defineEventHandler(async (event) => {
  const supabase = useSupabaseClient('server')

  try {
    const body = await readBody(event)

    // Validate request body
    if (
      typeof body.banner_id_1 !== 'number' ||
      typeof body.banner_id_2 !== 'number' ||
      typeof body.winner_id !== 'number'
    ) {
      throw createError({
        statusCode: 400,
        message: 'Invalid request body - missing required fields',
      })
    }

    const { banner_id_1, banner_id_2, winner_id, voter_fingerprint } = body

    // Validate that both banners are 1.x banners (excluding permanent banner ID 1)
    const validBannerIds = getVersion1xBannerIdsExcludingPermanent()
    if (
      !validBannerIds.includes(banner_id_1) ||
      !validBannerIds.includes(banner_id_2)
    ) {
      throw createError({
        statusCode: 400,
        message: 'Invalid banner IDs - must be version 1.x banners',
      })
    }

    if (winner_id !== banner_id_1 && winner_id !== banner_id_2) {
      throw createError({
        statusCode: 400,
        message: 'Winner ID must match one of the two banner IDs',
      })
    }

    // Rate limiting by fingerprint
    if (voter_fingerprint) {
      // Check votes in the last day from this fingerprint
      const oneHourAgo = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString()
      const { count: recentVotes, error: countError } = await supabase
        .from('banner_votes')
        .select('*', { count: 'exact', head: true })
        .eq('voter_fingerprint', voter_fingerprint)
        .gte('created_at', oneHourAgo)

      if (countError) {
        console.error('Failed to check vote count:', countError)
        // Don't block vote if count check fails
      } else {
        // Limit to 100 votes per hour per fingerprint (adjust as needed)
        if (recentVotes && recentVotes >= 100) {
          throw createError({
            statusCode: 429,
            message: 'Too many votes. Please wait before voting again.',
          })
        }
      }
    }

    // Get current rankings for both banners (auto-initialize if missing)
    const { data: currentRankings } = await supabase
      .from('banner_rankings')
      .select('*')
      .in('banner_id', [banner_id_1, banner_id_2])

    // If table doesn't exist or rankings missing, initialize them
    const defaultRanking: RawRanking = {
      banner_id: 0,
      elo_rating: 1500,
      wins: 0,
      losses: 0,
    }

    let ranking1: RawRanking | undefined = (
      currentRankings as RawRanking[] | null
    )?.find((r) => r.banner_id === banner_id_1)
    let ranking2: RawRanking | undefined = (
      currentRankings as RawRanking[] | null
    )?.find((r) => r.banner_id === banner_id_2)

    // Auto-initialize missing rankings
    if (!ranking1) {
      const { data: inserted1 } = await supabase
        .from('banner_rankings')
        .upsert({
          banner_id: banner_id_1,
          elo_rating: defaultRanking.elo_rating,
          wins: defaultRanking.wins,
          losses: defaultRanking.losses,
        } as never)
        .select()
        .single()
      ranking1 = (inserted1 as unknown as RawRanking) || {
        banner_id: banner_id_1,
        elo_rating: 1500,
        wins: 0,
        losses: 0,
      }
    }

    if (!ranking2) {
      const { data: inserted2 } = await supabase
        .from('banner_rankings')
        .upsert({
          banner_id: banner_id_2,
          elo_rating: defaultRanking.elo_rating,
          wins: defaultRanking.wins,
          losses: defaultRanking.losses,
        } as never)
        .select()
        .single()
      ranking2 = (inserted2 as unknown as RawRanking) || {
        banner_id: banner_id_2,
        elo_rating: 1500,
        wins: 0,
        losses: 0,
      }
    }

    // Calculate new ELO ratings
    const { updateEloRatingsIncremental } = await import(
      '~/utils/incrementalRankings'
    )
    const { banner1NewElo, banner2NewElo } = updateEloRatingsIncremental(
      banner_id_1,
      Number(ranking1.elo_rating),
      banner_id_2,
      Number(ranking2.elo_rating),
      winner_id
    )

    // Update stats (only store wins and losses, other fields are calculated)
    const isBanner1Winner = winner_id === banner_id_1

    const newRanking1 = {
      banner_id: banner_id_1,
      elo_rating: banner1NewElo,
      wins: Number(ranking1.wins) + (isBanner1Winner ? 1 : 0),
      losses: Number(ranking1.losses) + (isBanner1Winner ? 0 : 1),
      updated_at: new Date().toISOString(),
    }

    const newRanking2 = {
      banner_id: banner_id_2,
      elo_rating: banner2NewElo,
      wins: Number(ranking2.wins) + (isBanner1Winner ? 0 : 1),
      losses: Number(ranking2.losses) + (isBanner1Winner ? 1 : 0),
      updated_at: new Date().toISOString(),
    }

    // Record the vote
    const voteData = {
      banner_id_1,
      banner_id_2,
      winner_id,
      voter_fingerprint: voter_fingerprint || null,
      created_at: new Date().toISOString(),
    }

    const { error: voteError } = await supabase
      .from('banner_votes')
      .insert(voteData as never)

    if (voteError) throw voteError

    // Update rankings (upsert both banners)
    const { error: updateError } = await supabase
      .from('banner_rankings')
      .upsert([newRanking1, newRanking2] as never)

    if (updateError) {
      console.error('Failed to update rankings:', updateError)
      // Don't fail the vote if ranking update fails
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to submit vote:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to submit vote',
    })
  }
})
