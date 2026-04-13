import { createError } from 'h3'

type VoteFeedbackBody = {
  suggestionId?: unknown
  vote?: unknown
}

const createBadRequestError = (message: string) =>
  createError({
    statusCode: 400,
    statusMessage: message,
    message,
  })

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuthenticatedUser(event)
    const body = (await readBody(event)) as VoteFeedbackBody

    if (typeof body?.suggestionId !== 'string' || !body.suggestionId.trim()) {
      throw createBadRequestError('Feedback suggestion id is required')
    }

    const normalizedVote = body.vote === null ? null : Number(body.vote)

    if (normalizedVote !== null && !isFeedbackVoteValue(normalizedVote)) {
      throw createBadRequestError('Invalid feedback vote')
    }

    const suggestion = await updateFeedbackVote({
      suggestionId: body.suggestionId.trim(),
      userId: user.id,
      vote: normalizedVote,
    })

    return {
      suggestion,
      vote: normalizedVote,
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

    const message = toErrorMessage(error, 'Failed to update feedback vote')
    if (isTransientSupabaseError(error)) {
      console.warn(`Failed to update feedback vote: ${message}`)
      throw createUpstreamUnavailableError('feedback vote')
    }

    console.error(`Failed to update feedback vote: ${message}`)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update feedback vote',
      message: 'Failed to update feedback vote',
    })
  }
})
