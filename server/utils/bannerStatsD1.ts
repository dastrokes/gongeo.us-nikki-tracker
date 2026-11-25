import { createError, getHeader, readRawBody } from 'h3'
import type { H3Event } from 'h3'

import { createApiFailureError } from './apiErrors'

type StatsSource = 'game' | 'pearpal'
type StatsWriteMode = 'supabase' | 'd1' | 'paused'

const DATA_API_ORIGIN = 'https://data.gongeo.us'
const LOCAL_DATA_API_ORIGIN = 'http://127.0.0.1:8787'
const MAX_IMPORT_BYTES = 2_000_000
const MAX_IMPORT_ROWS = 1_000
const MAX_PULL_COUNT = 10_000
const MAX_FUTURE_PULL_MS = 24 * 60 * 60 * 1000
const WRITE_TIMEOUT_MS = 15_000

const numericFields = [
  'banner_id',
  'banner_type',
  'total_pulls',
  'total_4star_items',
  'total_5star_items',
  'total_4star_pulls',
  'total_5star_pulls',
] as const

export const getBannerStatsWriteMode = (): StatsWriteMode => {
  const mode = useRuntimeConfig().statsWriteMode
  if (mode === 'supabase' || mode === 'd1' || mode === 'paused') return mode
  throw new Error('Invalid stats write mode')
}

export const invalidBannerStats = () =>
  createError({ statusCode: 400, statusMessage: 'Invalid banner stats' })

const tooLarge = () =>
  createError({
    statusCode: 413,
    statusMessage: 'Banner stats import is too large',
  })

export const readBannerStatsImport = async (event: H3Event) => {
  if (Number(getHeader(event, 'content-length')) > MAX_IMPORT_BYTES) {
    throw tooLarge()
  }
  const raw = await readRawBody(event, false)
  if (!raw) throw invalidBannerStats()
  if (raw.byteLength > MAX_IMPORT_BYTES) throw tooLarge()
  try {
    const body: unknown = JSON.parse(
      new TextDecoder('utf-8', { fatal: true }).decode(raw)
    )
    if (!Array.isArray(body)) throw invalidBannerStats()
    if (body.length > MAX_IMPORT_ROWS) throw tooLarge()
    return body as unknown[]
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof TypeError) {
      throw invalidBannerStats()
    }
    throw error
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

export const prepareBannerStatsImport = (
  rows: unknown[],
  receivedAt: number,
  userId?: string
) => {
  const keys = new Set<string>()
  const timestamp = (value: unknown, max = Infinity) => {
    if (typeof value !== 'string') throw invalidBannerStats()
    const time = Date.parse(value)
    if (!Number.isFinite(time) || time > max) throw invalidBannerStats()
    return new Date(time).toISOString()
  }
  const normalized = rows.map((row) => {
    if (!isRecord(row)) throw invalidBannerStats()
    const { uid, region } = row
    if (
      typeof uid !== 'string' ||
      !uid ||
      uid.includes('\0') ||
      typeof region !== 'string' ||
      !region ||
      region.includes('\0')
    ) {
      throw invalidBannerStats()
    }

    const result: Record<string, unknown> = { uid, region }
    for (const column of numericFields) {
      const value = row[column]
      if (
        value === undefined &&
        column !== 'banner_id' &&
        column !== 'banner_type'
      )
        continue
      const max = column === 'banner_id' ? 2_147_483_647 : MAX_PULL_COUNT
      if (
        typeof value !== 'number' ||
        !Number.isInteger(value) ||
        value < 0 ||
        value > max ||
        (column === 'banner_type' && ![1, 2, 3].includes(value))
      ) {
        throw invalidBannerStats()
      }
      result[column] = value
    }
    const key = JSON.stringify([uid, region, result.banner_id])
    if (keys.has(key)) throw invalidBannerStats()
    keys.add(key)

    for (const column of ['pulls_4star', 'pulls_5star']) {
      const value = row[column]
      if (value === undefined) continue
      if (
        value !== null &&
        (!Array.isArray(value) ||
          value.some((pull) => {
            if (!isRecord(pull)) return true
            const count = pull.pulls_to_obtain
            return (
              typeof count !== 'number' ||
              !Number.isInteger(count) ||
              count < 1 ||
              count > MAX_PULL_COUNT
            )
          }))
      ) {
        throw invalidBannerStats()
      }
      result[column] = value
    }
    result.last_pull_time = timestamp(
      row.last_pull_time,
      receivedAt + MAX_FUTURE_PULL_MS
    )
    result.updated_at = timestamp(row.updated_at)
    if (row.created_at !== undefined)
      result.created_at = timestamp(row.created_at)
    if (userId) result.user_id = userId
    return result
  })
  const body = JSON.stringify(normalized)
  if (Buffer.byteLength(body) > MAX_IMPORT_BYTES) throw tooLarge()
  return { rows: normalized, body }
}

export const writeBannerStatsD1 = async (
  source: StatsSource,
  body: string,
  deadline: AbortSignal
) => {
  const token = process.env.CLOUDFLARE_INGEST_TOKEN?.trim()
  if (!token) {
    throw new Error('Stats ingest token is missing')
  }

  const origin =
    process.env.NODE_ENV === 'development'
      ? LOCAL_DATA_API_ORIGIN
      : DATA_API_ORIGIN
  const url = new URL('/_internal/stats/import', origin)
  const failure = () =>
    createApiFailureError('update D1 banner stats', { transient: true })
  let upstreamStatus: number | undefined
  let cfMitigated: string | null = null
  let cfRay: string | null = null
  let errorName: string | undefined
  for (let attempt = 0; attempt < 2 && !deadline.aborted; attempt++) {
    upstreamStatus = undefined
    cfMitigated = null
    cfRay = null
    errorName = undefined
    let response: Response
    let result
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
          'x-target': source,
        },
        body,
        redirect: 'error',
        signal: AbortSignal.any([
          deadline,
          AbortSignal.timeout(WRITE_TIMEOUT_MS),
        ]),
      })
      upstreamStatus = response.status
      cfMitigated = response.headers.get('cf-mitigated')
      cfRay = response.headers.get('cf-ray')
      result = response.headers
        .get('content-type')
        ?.includes('application/json')
        ? await response.json()
        : null
    } catch (error) {
      errorName = error instanceof Error ? error.name : 'unknown'
      continue
    }

    if (response.status === 400 && result?.data?.code === 'INVALID_STATS') {
      throw invalidBannerStats()
    }
    if (response.status === 413) throw tooLarge()
    if (response.ok && result?.success === true) return
    if (![429, 502, 503, 504].includes(response.status)) break
  }
  console.warn('Stats Worker relay failed', {
    source,
    upstreamStatus,
    cfMitigated,
    cfRay,
    errorName,
    deadlineReached: deadline.aborted,
  })
  throw failure()
}
