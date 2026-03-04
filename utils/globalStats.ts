import { withSupabaseRetry } from '~/utils/supabaseRetry'

import type {
  FirstItemDistribution,
  GlobalBannerStatsRow,
  GlobalBannerPayload,
  GlobalCoreStatsRow,
  GlobalCorePayload,
} from '~/types/global'

type MaybeSingleQueryResult = {
  data: unknown
  error: unknown
}

type MaybeSingleQueryBuilder = {
  maybeSingle: () => PromiseLike<MaybeSingleQueryResult>
}

type EqQueryBuilder = {
  eq: (column: string, value: unknown) => MaybeSingleQueryBuilder
}

type SelectQueryBuilder = {
  select: (columns: string) => EqQueryBuilder
}

type SupabaseClient = {
  from: (table: string) => SelectQueryBuilder
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const toFirstItemDistribution = (value: unknown): FirstItemDistribution => {
  if (!isRecord(value)) return {}
  return value as FirstItemDistribution
}

const toCorePayload = (value: unknown): GlobalCorePayload => {
  if (!isRecord(value)) return {}
  return {
    date:
      typeof value.date === 'string'
        ? value.date
        : typeof value.dataAsOf === 'string'
          ? value.dataAsOf
          : typeof value.d === 'string'
            ? value.d
            : undefined,
    pulls:
      typeof value.pulls === 'number'
        ? value.pulls
        : typeof value.totalPulls === 'number'
          ? value.totalPulls
          : typeof value.t === 'number'
            ? value.t
            : 0,
    users:
      typeof value.users === 'number'
        ? value.users
        : typeof value.uniqueUsers === 'number'
          ? value.uniqueUsers
          : typeof value.u === 'number'
            ? value.u
            : 0,
    pullsPerBanner: isRecord(value.pullsPerBanner)
      ? (value.pullsPerBanner as Record<string, [number, number, number]>)
      : isRecord(value.p)
        ? (value.p as Record<string, [number, number, number]>)
        : {},
    fiveStarDistribution: isRecord(value.fiveStarDistribution)
      ? (value.fiveStarDistribution as Record<string, number>)
      : isRecord(value.f5)
        ? (value.f5 as Record<string, number>)
        : {},
    fourStarType2Distribution: isRecord(value.fourStarType2Distribution)
      ? (value.fourStarType2Distribution as Record<string, number>)
      : isRecord(value.f4_2)
        ? (value.f4_2 as Record<string, number>)
        : {},
    fourStarType3Distribution: isRecord(value.fourStarType3Distribution)
      ? (value.fourStarType3Distribution as Record<string, number>)
      : isRecord(value.f4_3)
        ? (value.f4_3 as Record<string, number>)
        : {},
  }
}

const toBannerPayload = (
  value: unknown,
  bannerId: number
): GlobalBannerPayload => {
  if (!isRecord(value)) {
    return {
      bannerId,
      f: {},
    }
  }

  return {
    date:
      typeof value.date === 'string'
        ? value.date
        : typeof value.dataAsOf === 'string'
          ? value.dataAsOf
          : typeof value.d === 'string'
            ? value.d
            : undefined,
    bannerId:
      typeof value.bannerId === 'number'
        ? value.bannerId
        : typeof value.banner_id === 'number'
          ? value.banner_id
          : bannerId,
    f: toFirstItemDistribution(value.f),
  }
}

const fetchCoreStatsRow = async (
  supabase: SupabaseClient
): Promise<GlobalCoreStatsRow | null> => {
  const { data, error } = await withSupabaseRetry(() =>
    supabase
      .from('user_global_stats')
      .select('banner_id,payload,updated_at')
      .eq('banner_id', 0)
      .maybeSingle()
  )

  if (error) throw error
  if (!isRecord(data)) return null

  const payload = toCorePayload(data.payload)

  return {
    banner_id:
      typeof data.banner_id === 'number' && data.banner_id >= 0
        ? data.banner_id
        : 0,
    payload,
    updated_at: typeof data.updated_at === 'string' ? data.updated_at : '',
  }
}

const fetchBannerStatsRow = async (
  supabase: SupabaseClient,
  bannerId: number
): Promise<GlobalBannerStatsRow | null> => {
  const { data, error } = await withSupabaseRetry(() =>
    supabase
      .from('user_global_stats')
      .select('banner_id,payload,updated_at')
      .eq('banner_id', bannerId)
      .maybeSingle()
  )

  if (error) throw error
  if (!isRecord(data)) return null

  return {
    banner_id: typeof data.banner_id === 'number' ? data.banner_id : bannerId,
    payload: toBannerPayload(data.payload, bannerId),
    updated_at: typeof data.updated_at === 'string' ? data.updated_at : '',
  }
}

export const getCoreStats = async (
  supabase: unknown
): Promise<GlobalCoreStatsRow> => {
  const supabaseClient = supabase as SupabaseClient
  const row = await fetchCoreStatsRow(supabaseClient)

  if (!row) {
    return {
      banner_id: 0,
      payload: {
        pulls: 0,
        users: 0,
        pullsPerBanner: {},
        fiveStarDistribution: {},
        fourStarType2Distribution: {},
        fourStarType3Distribution: {},
      },
      updated_at: '',
    }
  }

  return row
}

export const getBannerStats = async (
  supabase: unknown,
  bannerId: number
): Promise<GlobalBannerStatsRow> => {
  const supabaseClient = supabase as SupabaseClient
  const row = await fetchBannerStatsRow(supabaseClient, bannerId)

  if (!row) {
    return {
      banner_id: bannerId,
      payload: {
        bannerId,
        f: {},
      },
      updated_at: '',
    }
  }

  return row
}
