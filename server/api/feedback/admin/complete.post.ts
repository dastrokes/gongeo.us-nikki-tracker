import { createError } from 'h3'

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string')

const parseApplyResult = (
  value: unknown,
  expectedItemId: number
): FeedbackMaintainerApplyResult => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw createError({ statusCode: 400, message: 'Invalid catalog result' })
  }
  const result = value as Partial<FeedbackMaintainerApplyResult>
  if (
    typeof result.applyId !== 'string' ||
    !Array.isArray(result.touchedItemIds) ||
    result.touchedItemIds.length !== 1 ||
    result.touchedItemIds[0] !== expectedItemId ||
    !isStringArray(result.purgedCacheTags) ||
    !isStringArray(result.searchNamespaces) ||
    typeof result.revision !== 'string' ||
    typeof result.replayed !== 'boolean'
  ) {
    throw createError({ statusCode: 400, message: 'Invalid catalog result' })
  }
  return result as FeedbackMaintainerApplyResult
}

export default defineEventHandler(async (event) => {
  await requireItemSearchMaintainerUser(event)
  const body = (await readBody(
    event
  )) as Partial<FeedbackMaintainerCompleteRequest>
  const suggestionId =
    typeof body?.suggestionId === 'string' ? body.suggestionId.trim() : ''
  if (!suggestionId) {
    throw createError({ statusCode: 400, message: 'Suggestion id is required' })
  }

  const suggestion = await getFeedbackSuggestionById(suggestionId)
  if (!suggestion) {
    throw createError({
      statusCode: 404,
      message: 'Feedback suggestion not found',
    })
  }
  if (suggestion.status !== 'accepted' && suggestion.status !== 'applied') {
    throw createError({
      statusCode: 409,
      message: 'Feedback suggestion is not ready to complete',
    })
  }

  const applyResult = parseApplyResult(body.applyResult, suggestion.entityId)
  if (applyResult.applyId !== `feedback-apply-${suggestion.id}`) {
    throw createError({
      statusCode: 400,
      message: 'Catalog result does not match suggestion',
    })
  }

  if (suggestion.status === 'accepted') {
    await markFeedbackSuggestionApplied(suggestionId)
  }
  const refreshedSuggestion = await getFeedbackSuggestionById(suggestionId)
  if (!refreshedSuggestion) {
    throw createApiFailureError('refresh feedback suggestion')
  }

  return {
    suggestion: refreshedSuggestion,
    applyResult,
    catalogApply: null,
  } satisfies FeedbackMaintainerActionResponse
})
