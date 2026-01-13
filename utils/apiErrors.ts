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

export const createInternalError = (resource: string) =>
  createError({
    statusCode: 500,
    statusMessage: `Failed to fetch ${resource}`,
    message: `Failed to fetch ${resource}`,
    data: { code: 'INTERNAL_ERROR' },
  })
