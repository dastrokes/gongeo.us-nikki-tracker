import { createError } from 'h3'

const createBadRequestError = (message: string) =>
  createError({
    statusCode: 400,
    statusMessage: message,
    message,
  })

const normalizeAction = (value: unknown): FeedbackMaintainerAction => {
  if (value === 'approve' || value === 'reject') {
    return value
  }

  throw createBadRequestError('Invalid feedback maintainer action')
}

export default defineEventHandler(async (event) => {
  try {
    await requireItemSearchMaintainerUser(event)
    const body = (await readBody(event)) as FeedbackMaintainerActionRequest
    const suggestionId =
      typeof body?.suggestionId === 'string' ? body.suggestionId.trim() : ''
    const action = normalizeAction(body?.action)

    if (!suggestionId) {
      throw createBadRequestError('Feedback suggestion id is required')
    }

    const suggestion = await getFeedbackSuggestionById(suggestionId)
    if (!suggestion) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Feedback suggestion not found',
        message: 'Feedback suggestion not found',
      })
    }

    if (action === 'approve') {
      if (suggestion.status !== 'open') {
        throw createBadRequestError('Only open suggestions can be approved')
      }

      await updateFeedbackSuggestionStatus({
        suggestionId,
        status: 'accepted',
        expectedStatuses: ['open'],
      })
    } else {
      if (suggestion.status !== 'open' && suggestion.status !== 'accepted') {
        throw createBadRequestError(
          'Only open or accepted suggestions can be rejected'
        )
      }

      await updateFeedbackSuggestionStatus({
        suggestionId,
        status: 'rejected',
        expectedStatuses: ['open', 'accepted'],
      })
    }

    const refreshedSuggestion = await getFeedbackSuggestionById(suggestionId)
    if (!refreshedSuggestion) {
      throw createApiFailureError('refresh feedback suggestion')
    }

    return {
      suggestion: refreshedSuggestion,
      applyResult: null,
    } satisfies FeedbackMaintainerActionResponse
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'statusCode' in error &&
      typeof (error as { statusCode?: unknown }).statusCode === 'number'
    ) {
      throw error
    }

    const operation = 'run feedback maintainer action'
    const message = toErrorMessage(error, `Failed to ${operation}`)
    console.error(`Failed to ${operation}: ${message}`)
    throw createApiFailureError(operation, {
      transient: isTransientSupabaseError(error),
    })
  }
})
