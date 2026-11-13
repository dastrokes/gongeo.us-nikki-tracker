import {
  BANNER_VOTE_SEASONS,
  CURRENT_BANNER_VOTE_SEASON,
  LIVE_BANNER_VOTE_SEASON,
  type BannerVoteSeasonId,
} from '~~/shared/utils/bannerVoteSeasons'
import { getBannerRankingArchive } from '~~/shared/data/bannerRankingArchives'
import { createInitialBannerRankingSnapshot } from '~~/shared/utils/bannerRankingSnapshot'
import type {
  BannerRankingSnapshot,
  BannerVoteReceipt,
} from '~~/shared/types/vote'

const PAIRING_CACHE_TTL = 10 * 60 * 1000

export const useBannerVote = (
  seasonId: BannerVoteSeasonId = CURRENT_BANNER_VOTE_SEASON
) => {
  const season = BANNER_VOTE_SEASONS[seasonId]
  const { getImageSrc } = imageProvider()
  const fingerprint = useVoterFingerprint()
  const supabase = useSupabaseClient()
  const snapshot = useState<BannerRankingSnapshot | null>(
    `banner-ranking:${seasonId}`,
    () => null
  )
  const fetchedAt = useState<number>(
    `banner-ranking-fetched:${seasonId}`,
    () => 0
  )
  const refreshFailed = shallowRef(false)
  let pending: Promise<BannerRankingSnapshot> | null = null

  const getRankings = async (force = false): Promise<BannerRankingSnapshot> => {
    if (
      !force &&
      snapshot.value &&
      Date.now() - fetchedAt.value < PAIRING_CACHE_TTL
    )
      return snapshot.value
    if (pending) return pending
    pending = Promise.resolve().then(async () => {
      try {
        const archive = getBannerRankingArchive(seasonId)
        if (
          !archive &&
          (season.archived || seasonId !== LIVE_BANNER_VOTE_SEASON)
        ) {
          throw new Error('ARCHIVE_UNAVAILABLE')
        }
        const data = archive
          ? archive
          : !season.rosterFinal ||
              !season.opensAt ||
              Date.now() < Date.parse(season.opensAt)
            ? createInitialBannerRankingSnapshot(season.bannerIds)
            : await $fetch<BannerRankingSnapshot>('/api/vote/rankings', {
                query: { season: seasonId },
              })
        snapshot.value = data
        fetchedAt.value = Date.now()
        refreshFailed.value = false
        return data
      } catch (error) {
        refreshFailed.value = true
        throw error
      } finally {
        pending = null
      }
    })
    return pending
  }

  const getVotePair = async (): Promise<VotePair> => {
    const data = await getRankings().catch((error) => {
      if (snapshot.value) return snapshot.value
      throw error
    })
    const pair = selectBannerPair(
      data.rankings,
      [...season.bannerIds],
      getVoteHistory(seasonId, 'community')
    )
    addRecentPair(seasonId, 'community', pair.banner1, pair.banner2)
    return {
      banner1: { id: pair.banner1, image: getImageSrc('banner', pair.banner1) },
      banner2: { id: pair.banner2, image: getImageSrc('banner', pair.banner2) },
    }
  }

  const submitVote = async (
    banner1: number,
    banner2: number,
    winner: number,
    requestId: string
  ): Promise<BannerVoteReceipt> => {
    if (season.archived || seasonId !== LIVE_BANNER_VOTE_SEASON)
      throw new Error('VOTING_CLOSED')
    if (
      banner1 === banner2 ||
      !season.bannerIds.includes(banner1) ||
      !season.bannerIds.includes(banner2) ||
      (winner !== banner1 && winner !== banner2)
    )
      throw new Error('INVALID_VOTE')
    if (!fingerprint.isFingerprintInitialized.value)
      await fingerprint.initVoterFingerprint()
    if (
      fingerprint.isFingerprintFallback.value ||
      !fingerprint.voterFingerprint.value
    )
      throw new Error('FINGERPRINT_UNAVAILABLE')
    const { data, error } = await supabase.rpc('process_vote', {
      p_banner_id_1: banner1,
      p_banner_id_2: banner2,
      p_winner_id: winner,
      p_voter_fingerprint: fingerprint.voterFingerprint.value,
      p_request_id: requestId,
    } as never)
    if (error) throw new Error(error.message)
    const receipt = data as BannerVoteReceipt | null
    if (
      !receipt ||
      receipt.success !== true ||
      receipt.request_id !== requestId ||
      !Number.isInteger(receipt.votes_remaining) ||
      receipt.votes_remaining < 0 ||
      receipt.votes_remaining > 50
    )
      throw new Error('INVALID_RECEIPT')
    return receipt
  }

  return {
    getVotePair,
    submitVote,
    getRankings,
    snapshot: readonly(snapshot),
    refreshFailed: readonly(refreshFailed),
  }
}
