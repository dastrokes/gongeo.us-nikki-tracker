import { createError } from 'h3'

import { toErrorMessage } from '#shared/utils/errors'

const MAX_SUGGESTION_IDS = 100

const createBadRequestError = (message: string) =>
  createError({
    statusCode: 400,
    statusMessage: message,
    message,
  })

const parseSuggestionIds = (value: unknown) => {
  if (value === null || value === undefined || value === '') return []
  const raw = Array.isArray(value) ? value.join(',') : String(value)
  const suggestionIds = Array.from(
    new Set(
      raw
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
    )
  )

  if (suggestionIds.length > MAX_SUGGESTION_IDS) {
    throw createBadRequestError(
      `A maximum of ${MAX_SUGGESTION_IDS} feedback suggestion ids can be requested at once`
    )
  }

  return suggestionIds
}

export default defineEventHandler(async (event) => {
  applyNoStoreHeaders(event)

  try {
    const user = await requireAuthenticatedUser(event)
    const query = getQuery(event)
    const suggestionIds = parseSuggestionIds(query.ids)
    const isMaintainer = isItemSearchMaintainerUser(user, event)

    return {
      votes:
        suggestionIds.length > 0
          ? await getFeedbackVotesForUser(suggestionIds, user.id)
          : {},
      isMaintainer,
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

    const message = toErrorMessage(
      error,
      'Failed to fetch viewer feedback state'
    )
    if (isTransientSupabaseError(error)) {
      console.warn(`Failed to fetch viewer feedback state: ${message}`)
      throw createUpstreamUnavailableError('feedback viewer state')
    }

    console.error(`Failed to fetch viewer feedback state: ${message}`)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch viewer feedback state',
      message: 'Failed to fetch viewer feedback state',
    })
  }
})
