import { createError } from 'h3'

const createBadRequestError = (message: string) =>
  createError({
    statusCode: 400,
    statusMessage: message,
    message,
  })

const createConflictError = (message: string) =>
  createError({
    statusCode: 409,
    statusMessage: message,
    message,
  })

const normalizeAction = (value: unknown): FeedbackMaintainerAction => {
  if (value === 'approve' || value === 'reject' || value === 'apply') {
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

    let applyResult = null

    if (action === 'approve') {
      if (suggestion.status !== 'open') {
        throw createBadRequestError('Only open suggestions can be approved')
      }

      await updateFeedbackSuggestionStatus({
        suggestionId,
        status: 'accepted',
        expectedStatuses: ['open'],
      })
    } else if (action === 'reject') {
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
    } else {
      if (suggestion.status !== 'accepted') {
        throw createBadRequestError('Only accepted suggestions can be applied')
      }

      const claim = await claimFeedbackSuggestionApply(suggestionId)
      if (!claim) {
        throw createConflictError(
          'This suggestion is already being applied by another maintainer'
        )
      }

      try {
        applyResult = await applyItemFeedback(
          claim.suggestion,
          claim.operationId
        )
        await completeFeedbackSuggestionApply({
          suggestionId,
          claimToken: claim.claimToken,
        })
      } catch (error) {
        const message = toErrorMessage(error, 'Failed to apply feedback')
        try {
          await failFeedbackSuggestionApply({
            suggestionId,
            claimToken: claim.claimToken,
            message,
          })
        } catch (claimError) {
          console.error(
            `Failed to record feedback apply failure: ${toErrorMessage(claimError, 'Unknown claim error')}`
          )
        }
        throw error
      }
    }

    const refreshedSuggestion = await getFeedbackSuggestionById(suggestionId)
    if (!refreshedSuggestion) {
      throw createApiFailureError('refresh feedback suggestion')
    }

    return {
      suggestion: refreshedSuggestion,
      applyResult,
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
