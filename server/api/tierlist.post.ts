import {
  COMMUNITY_TIER_KEYS,
  resolveCommunityScope,
} from '~/composables/useCommunityTierlist'

type TierKey = (typeof COMMUNITY_TIER_KEYS)[number]

type SubmitCommunityTierlistBody = {
  scope_type?: unknown
  scope_filters?: unknown
  voter_fingerprint?: unknown
  tiers_json?: unknown
}

const tierKeys: readonly TierKey[] = COMMUNITY_TIER_KEYS
const tierKeySet = new Set<string>(tierKeys)

const createBadRequestError = (message: string) =>
  createError({
    statusCode: 400,
    message,
  })

const createForbiddenError = (message: string) =>
  createError({
    statusCode: 403,
    message,
  })

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const parseCommunityScopeOrThrow = (
  scopeType: unknown,
  scopeFilters: unknown
): NonNullable<ReturnType<typeof resolveCommunityScope>> => {
  const scope = resolveCommunityScope(scopeType, scopeFilters)
  if (!scope) {
    throw createForbiddenError(
      'Community submit supports banner, outfit, and item scopes with valid filter values only'
    )
  }
  return scope
}

const parseVoterFingerprint = (value: unknown): string => {
  if (typeof value !== 'string') {
    throw createBadRequestError('voter_fingerprint is required')
  }

  const normalized = value.trim()
  if (!normalized) {
    throw createBadRequestError('voter_fingerprint is required')
  }

  if (normalized.length < 8 || normalized.length > 255) {
    throw createBadRequestError('voter_fingerprint length is invalid')
  }

  return normalized
}

const parseTiers = (value: unknown): Record<TierKey, string[]> => {
  if (!isRecord(value)) {
    throw createBadRequestError('tiers_json must be an object')
  }

  const source = value as Record<string, unknown>
  const output: Record<TierKey, string[]> = {
    S: [],
    A: [],
    B: [],
    C: [],
    D: [],
    F: [],
  }

  const keys = Object.keys(source)
  const unexpectedKeys = keys.filter((key) => !tierKeySet.has(key))
  if (unexpectedKeys.length > 0) {
    throw createBadRequestError('tiers_json contains unsupported tier keys')
  }

  tierKeys.forEach((tierKey) => {
    const list = source[tierKey]
    if (!Array.isArray(list)) {
      throw createBadRequestError(`tiers_json.${tierKey} must be an array`)
    }

    output[tierKey] = list.map((entryId) => {
      if (typeof entryId !== 'string') {
        throw createBadRequestError(
          `tiers_json.${tierKey} must contain strings`
        )
      }

      const normalized = entryId.trim()
      if (!normalized) {
        throw createBadRequestError(
          `tiers_json.${tierKey} contains empty entry id`
        )
      }

      return normalized
    })
  })

  return output
}

export default defineEventHandler(async (event) => {
  try {
    const body = (await readBody(event)) as SubmitCommunityTierlistBody
    const scope = parseCommunityScopeOrThrow(
      body.scope_type,
      body.scope_filters ?? {}
    )
    const voterFingerprint = parseVoterFingerprint(body.voter_fingerprint)
    const tiers = parseTiers(body.tiers_json)

    const supabase = useSupabaseServerClient()
    const now = new Date().toISOString()

    const { error } = await supabase.from('user_tierlists').upsert(
      {
        scope_type: scope.scopeType,
        scope_filters: scope.scopeFilters,
        voter_fingerprint: voterFingerprint,
        tiers_json: tiers,
        updated_at: now,
      } as never,
      {
        onConflict: 'scope_type,scope_filters,voter_fingerprint',
        ignoreDuplicates: false,
      }
    )

    if (error) {
      throw error
    }

    return {
      success: true,
      scope_type: scope.scopeType,
      scope_filters: scope.scopeFilters,
      submitted_at: now,
    }
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'statusCode' in error &&
      typeof (error as { statusCode?: unknown }).statusCode === 'number'
    ) {
      throw error
    }

    console.error('Failed to submit community tierlist:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to submit community tierlist',
    })
  }
})
