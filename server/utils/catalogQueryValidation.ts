import { createError } from 'h3'

export const createCatalogBadRequestError = (message: string) =>
  createError({
    statusCode: 400,
    statusMessage: message,
    message,
  })

export const getSingleQueryValue = (value: unknown): string | null => {
  if (value === null || value === undefined) return null
  if (Array.isArray(value)) {
    if (value.length !== 1) {
      throw createCatalogBadRequestError(
        'Query parameter must be specified once'
      )
    }
    return getSingleQueryValue(value[0])
  }
  const normalized = String(value).trim()
  return normalized.length > 0 ? normalized : null
}

export const rejectUnknownQueryParams = (
  query: Record<string, unknown>,
  allowedKeys: ReadonlySet<string>
) => {
  for (const key of Object.keys(query)) {
    if (!allowedKeys.has(key)) {
      throw createCatalogBadRequestError(`Unsupported query parameter: ${key}`)
    }
  }
}

const parseStrictSafeInteger = (raw: string, message: string) => {
  if (!/^\d+$/.test(raw)) {
    throw createCatalogBadRequestError(message)
  }

  const parsed = Number.parseInt(raw, 10)
  if (!Number.isSafeInteger(parsed)) {
    throw createCatalogBadRequestError(message)
  }

  return parsed
}

export const parseOptionalNumberFilter = (value: unknown, name: string) => {
  const raw = getSingleQueryValue(value)
  if (raw === null || raw === 'all') return null
  return parseStrictSafeInteger(raw, `${name} must be an integer`)
}

export const parseOptionalStringFilter = (value: unknown) => {
  const raw = getSingleQueryValue(value)
  return raw === null || raw === 'all' ? null : raw
}
