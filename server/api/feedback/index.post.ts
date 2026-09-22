import { createError } from 'h3'

import {
  createFeedbackSuggestion,
  hasOpenFeedbackSuggestions,
} from '../../utils/feedback'

type SubmitFeedbackBody = {
  entityType?: unknown
  entityId?: unknown
  itemType?: unknown
  baseSnapshot?: unknown
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

    const normalizedEntityId = Math.floor(entityId)
    const itemType = getItemType(normalizedEntityId)
    if (
      !isSupportedItemSearchItemType(itemType) ||
      body.itemType !== itemType
    ) {
      throw createBadRequestError(
        'Feedback is not available for this item type'
      )
    }

    if (
      !body.baseSnapshot ||
      typeof body.baseSnapshot !== 'object' ||
      Array.isArray(body.baseSnapshot)
    ) {
      throw createBadRequestError('Feedback base snapshot must be an object')
    }

    if (
      await hasOpenFeedbackSuggestions({
        entityType: 'item',
        entityId: normalizedEntityId,
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
        entityType: 'item',
        entityId: normalizedEntityId,
        baseSnapshot: body.baseSnapshot as Record<string, unknown>,
        itemType,
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
    const operation = 'submit feedback suggestion'
    if (isTransientSupabaseError(error)) {
      console.warn(`Failed to ${operation}: ${message}`)
      throw createApiFailureError(operation, { transient: true })
    }

    console.error(`Failed to ${operation}: ${message}`)
    throw createApiFailureError(operation)
  }
})
