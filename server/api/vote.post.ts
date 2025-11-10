import { useSupabaseClient } from '~/composables/useSupabaseClient'
import { getVersion1xBannerIdsExcludingPermanent } from '~/utils/bannerVote'

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
        // Limit to 50 votes per 24 hours per fingerprint
        if (recentVotes && recentVotes >= 50) {
          throw createError({
            statusCode: 429,
            message: 'Too many votes. Please wait before voting again.',
          })
        }
      }
    }

    // Call the database function to process vote atomically
    // This eliminates race conditions by handling everything in a single transaction
    const result = await supabase.rpc('process_vote', {
      p_banner_id_1: banner_id_1,
      p_banner_id_2: banner_id_2,
      p_winner_id: winner_id,
      p_voter_fingerprint: voter_fingerprint || null,
      p_k_factor: 32, // ELO K-factor, adjust as needed
    } as never)

    if (result.error) {
      console.error('Failed to process vote:', result.error)
      throw result.error
    }

    return result.data || { success: true }
  } catch (error) {
    console.error('Failed to submit vote:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to submit vote',
    })
  }
})
