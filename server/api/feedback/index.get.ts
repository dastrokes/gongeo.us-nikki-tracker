import { createError, getHeader } from 'h3'

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

const hasAuthorizationHeader = (event: Parameters<typeof getHeader>[0]) =>
  Boolean(getHeader(event, 'authorization')?.trim())

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const hasAuthorization = hasAuthorizationHeader(event)
    const user = await getAuthenticatedUser(event)
    const requestedScope = parseScope(query.scope?.toString() ?? null)
    const requestedReviewState = parseReviewState(
      query.reviewState?.toString() ?? null
    )
    if (requestedScope === 'mine' && !user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required',
        message: 'Authentication required',
      })
    }

    const scope = requestedScope === 'mine' ? 'mine' : 'all'
    const reviewState =
      scope === 'mine' ? 'all' : user ? requestedReviewState : 'all'

    const response = await listFeedbackSuggestions({
      entityType: parseEntityType(query.entityType?.toString() ?? null),
      entityId: parseEntityId(query.entityId),
      status: parseStatus(query.status?.toString() ?? null),
      changedField: parseChangedField(query.changedField?.toString() ?? null),
      reviewState,
      scope,
      userId: user?.id ?? null,
      sort: parseSort(query.sort?.toString() ?? null),
      page: parsePage(query.page),
    })

    if (!hasAuthorization && requestedScope === 'all' && scope === 'all') {
      setCacheHeaders(event, 'feedback', {
        varyQuery: true,
        varyHeaders: ['Authorization'],
      })
    } else {
      applyNoStoreHeaders(event)
    }

    return response
  } catch (error) {
    applyNoStoreHeaders(event)

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
