import { createError } from 'h3'

export const COMMUNITY_TIER_ENTRY_ID_MAX_LENGTH = 32

const createBadRequestError = (message: string) =>
  createError({ statusCode: 400, message })

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const parseCommunityTierSubmission = <TierKey extends string>(
  value: unknown,
  tierKeys: readonly TierKey[],
  validEntryIds: ReadonlySet<string>,
  maxEntries: number
): Record<TierKey, string[]> => {
  if (!isRecord(value)) {
    throw createBadRequestError('tiers_json must be an object')
  }

  const source = value as Record<string, unknown>
  const tierKeySet = new Set<string>(tierKeys)
  if (Object.keys(source).some((key) => !tierKeySet.has(key))) {
    throw createBadRequestError('tiers_json contains unsupported tier keys')
  }

  const output = {} as Record<TierKey, string[]>
  const seenEntryIds = new Set<string>()
  let totalEntries = 0

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
      if (normalized.length > COMMUNITY_TIER_ENTRY_ID_MAX_LENGTH) {
        throw createBadRequestError(
          `tiers_json.${tierKey} contains an entry id that is too long`
        )
      }

      totalEntries += 1
      if (totalEntries > maxEntries) {
        throw createBadRequestError(
          `tiers_json cannot contain more than ${maxEntries} entries`
        )
      }
      if (seenEntryIds.has(normalized)) {
        throw createBadRequestError('tiers_json contains duplicate entry ids')
      }
      if (!validEntryIds.has(normalized)) {
        throw createBadRequestError(
          'tiers_json contains an entry id outside the selected catalog'
        )
      }

      seenEntryIds.add(normalized)
      return normalized
    })
  })

  return output
}
