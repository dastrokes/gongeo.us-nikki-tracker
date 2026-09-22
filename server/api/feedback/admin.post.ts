import { createError } from 'h3'

const createBadRequestError = (message: string) =>
  createError({
    statusCode: 400,
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

    let applyResult: FeedbackMaintainerApplyResult | null = null

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
      if (suggestion.entityType !== 'item') {
        throw createBadRequestError('Only item feedback can be applied')
      }
      if (suggestion.status !== 'accepted' && suggestion.status !== 'applied') {
        throw createBadRequestError('Only accepted suggestions can be applied')
      }

      const sourceItem = await getFeedbackSourceItem(suggestion.entityId)
      if (!sourceItem) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Feedback item not found',
          message: 'Feedback item not found',
        })
      }
      if (!suggestion.itemType || suggestion.itemType !== sourceItem.itemType) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Feedback item type changed; refresh and try again',
          message: 'Feedback item type changed; refresh and try again',
        })
      }

      const currentSnapshot = createRawItemTagFeedbackSnapshot(
        sourceItem.metadata,
        sourceItem.itemType
      )
      applyResult = await applyCatalogFeedback({
        suggestion,
        searchTexts: buildFeedbackApplySearchTexts(suggestion, currentSnapshot),
      })

      if (suggestion.status === 'accepted') {
        await markFeedbackSuggestionApplied(suggestionId)
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
