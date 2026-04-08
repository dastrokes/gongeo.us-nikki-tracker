import { createError } from 'h3'

import type {
  FeedbackEntityType,
  FeedbackReviewState,
  FeedbackScope,
  FeedbackSortKey,
  ItemTagFeedbackField,
} from '#shared/types/feedback'
import {
  ALL_ITEM_TAG_FEEDBACK_FIELDS,
  isFeedbackEntityType,
  isFeedbackReviewState,
  isFeedbackSortKey,
  isFeedbackSuggestionStatus,
} from '#shared/utils/feedback'
import { toErrorMessage } from '#shared/utils/errors'

const createBadRequestError = (message: string) =>
  createError({
    statusCode: 400,
    statusMessage: message,
    message,
  })

const parsePage = (value: unknown) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return 1
  return Math.floor(parsed)
}

const parseEntityType = (value: unknown): FeedbackEntityType | null => {
  if (value === null || value === undefined || value === '') return null
  if (!isFeedbackEntityType(value)) {
    throw createBadRequestError('Invalid feedback entity type')
  }
  return value
}

const parseEntityId = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    throw createBadRequestError('Invalid feedback entity id')
  }
  return Math.floor(parsed)
}

const parseStatus = (value: unknown) => {
  if (value === null || value === undefined || value === '')
    return 'open' as const
  if (value === 'all') return null
  if (!isFeedbackSuggestionStatus(value)) {
    throw createBadRequestError('Invalid feedback status')
  }
  return value
}

const parseSort = (value: unknown): FeedbackSortKey => {
  if (!value) return 'needs-review'
  if (!isFeedbackSortKey(value)) {
    throw createBadRequestError('Invalid feedback sort')
  }
  return value
}

const parseReviewState = (value: unknown): FeedbackReviewState => {
  if (value === null || value === undefined || value === '') {
    return 'unreviewed'
  }
  if (!isFeedbackReviewState(value)) {
    throw createBadRequestError('Invalid feedback review state')
  }
  return value
}

const parseScope = (value: unknown): FeedbackScope => {
  if (value === null || value === undefined || value === '') {
    return 'all'
  }
  if (value === 'all' || value === 'mine') {
    return value
  }
  throw createBadRequestError('Invalid feedback scope')
}

const parseChangedField = (value: unknown): ItemTagFeedbackField | null => {
  if (value === null || value === undefined || value === '') return null
  if (
    typeof value !== 'string' ||
    !ALL_ITEM_TAG_FEEDBACK_FIELDS.includes(
      value as (typeof ALL_ITEM_TAG_FEEDBACK_FIELDS)[number]
    )
  ) {
    throw createBadRequestError('Invalid feedback field filter')
  }
  return value as ItemTagFeedbackField
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const user = await getAuthenticatedUser(event)
    const requestedScope = parseScope(query.scope?.toString() ?? null)
    const requestedReviewState = parseReviewState(
      query.reviewState?.toString() ?? null
    )
    const scope = user && requestedScope === 'mine' ? 'mine' : 'all'

    return await listFeedbackSuggestions({
      entityType: parseEntityType(query.entityType?.toString() ?? null),
      entityId: parseEntityId(query.entityId),
      status: parseStatus(query.status?.toString() ?? null),
      changedField: parseChangedField(query.changedField?.toString() ?? null),
      reviewState:
        scope === 'mine' ? 'all' : user ? requestedReviewState : 'all',
      scope,
      userId: user?.id ?? null,
      sort: parseSort(query.sort?.toString() ?? null),
      page: parsePage(query.page),
    })
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'statusCode' in error &&
      typeof (error as { statusCode?: unknown }).statusCode === 'number'
    ) {
      throw error
    }

    const message = toErrorMessage(error, 'Failed to fetch feedback queue')
    if (isTransientSupabaseError(error)) {
      console.warn(`Failed to fetch feedback queue: ${message}`)
      throw createUpstreamUnavailableError('feedback queue')
    }

    console.error(`Failed to fetch feedback queue: ${message}`)
    throw createInternalError('feedback queue')
  }
})
