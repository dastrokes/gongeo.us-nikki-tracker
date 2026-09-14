import { createError } from 'h3'

export const createInvalidIdError = (resource: string) =>
  createError({
    statusCode: 400,
    statusMessage: `Invalid ${resource} ID`,
    message: `Invalid ${resource} ID`,
    data: { code: 'INVALID_ID' },
  })

export const createNotFoundError = (resource: string) =>
  createError({
    statusCode: 404,
    statusMessage: `${resource} not found`,
    message: `${resource} not found`,
    data: { code: 'NOT_FOUND' },
  })

export const createApiFailureError = (
  operation: string,
  options: { transient?: boolean } = {}
) => {
  const transient = options.transient ?? false
  const message = `Failed to ${operation}`

  return createError({
    statusCode: transient ? 503 : 500,
    statusMessage: message,
    message,
    data: {
      code: transient ? 'UPSTREAM_UNAVAILABLE' : 'INTERNAL_ERROR',
    },
  })
}

export const createInternalError = (resource: string) =>
  createApiFailureError(`fetch ${resource}`)

export const createUpstreamUnavailableError = (resource: string) =>
  createApiFailureError(`fetch ${resource}`, { transient: true })
