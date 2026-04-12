import { createError } from 'h3'

import type {
  FeedbackMaintainerAction,
  FeedbackMaintainerActionRequest,
  FeedbackMaintainerActionResponse,
} from '#shared/types/feedback'
import { toErrorMessage } from '#shared/utils/errors'

let maintainerActionInFlight = false

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
  if (maintainerActionInFlight) {
    throw createConflictError('Another feedback maintainer action is running')
  }

  maintainerActionInFlight = true

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
      })
    } else {
      if (suggestion.status !== 'open' && suggestion.status !== 'accepted') {
        throw createBadRequestError(
          'Only open or accepted suggestions can be applied'
        )
      }

      applyResult = await applyItemFeedbackSuggestion(suggestion)
    }

    const refreshedSuggestion = await getFeedbackSuggestionById(suggestionId)
    if (!refreshedSuggestion) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to refresh feedback suggestion',
        message: 'Failed to refresh feedback suggestion',
      })
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

    const message = toErrorMessage(
      error,
      'Failed to run feedback maintainer action'
    )
    console.error(`Failed to run feedback maintainer action: ${message}`)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to run feedback maintainer action',
      message: 'Failed to run feedback maintainer action',
    })
  } finally {
    maintainerActionInFlight = false
  }
})
