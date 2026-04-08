import { createError } from 'h3'

import {
  createFeedbackSuggestion,
  hasOpenFeedbackSuggestions,
} from '../../utils/feedback'
import { isFeedbackEntityType } from '#shared/utils/feedback'
import { createInternalError } from '#server/utils/apiErrors'
import { isSupportedItemSearchItemType } from '#shared/utils/itemSearch'
import { toErrorMessage } from '#shared/utils/errors'

type SubmitFeedbackBody = {
  entityType?: unknown
  entityId?: unknown
  proposedPatch?: unknown
}

const createBadRequestError = (message: string) =>
  createError({
    statusCode: 400,
    statusMessage: message,
    message,
  })

const parseBody = (value: unknown): SubmitFeedbackBody => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw createBadRequestError('Feedback payload must be an object')
  }
  return value as SubmitFeedbackBody
}

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuthenticatedUser(event)
    const body = parseBody(await readBody(event))

    if (!isFeedbackEntityType(body.entityType)) {
      throw createBadRequestError('Invalid feedback entity type')
    }

    if (body.entityType !== 'item') {
      throw createBadRequestError('Only item feedback is supported right now')
    }

    const entityId = Number(body.entityId)
    if (!Number.isFinite(entityId)) {
      throw createBadRequestError('Invalid feedback entity id')
    }

    if (
      !body.proposedPatch ||
      typeof body.proposedPatch !== 'object' ||
      Array.isArray(body.proposedPatch)
    ) {
      throw createBadRequestError('Feedback patch must be an object')
    }

    const sourceItem = await getFeedbackSourceItem(Math.floor(entityId))
    if (!sourceItem) {
      throw createNotFoundError('feedback item')
    }
    if (!isSupportedItemSearchItemType(sourceItem.itemType)) {
      throw createBadRequestError(
        'Feedback is not available for this item type'
      )
    }

    if (
      await hasOpenFeedbackSuggestions({
        entityType: sourceItem.entityType,
        entityId: sourceItem.entityId,
      })
    ) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Feedback already pending for this item',
        message: 'Feedback already pending for this item',
      })
    }

    return await createFeedbackSuggestion(
      buildFeedbackCreationInput({
        entityType: sourceItem.entityType,
        entityId: sourceItem.entityId,
        metadata: sourceItem.metadata,
        itemType: sourceItem.itemType,
        nextSnapshot: body.proposedPatch as Record<string, unknown>,
        userId: user.id,
      })
    )
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
      'Failed to submit feedback suggestion'
    )
    if (isTransientSupabaseError(error)) {
      console.warn(`Failed to submit feedback suggestion: ${message}`)
      throw createUpstreamUnavailableError('feedback suggestion')
    }

    console.error(`Failed to submit feedback suggestion: ${message}`)
    throw createInternalError('feedback suggestion')
  }
})
