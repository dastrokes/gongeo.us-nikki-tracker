export const toErrorMessage = (
  value: unknown,
  fallbackMessage = 'Unknown error'
): string => {
  if (typeof value === 'string') {
    return value
  }

  if (value && typeof value === 'object') {
    const message = (value as { message?: unknown }).message
    if (typeof message === 'string') {
      return message
    }

    try {
      return JSON.stringify(value)
    } catch {
      return fallbackMessage
    }
  }

  return fallbackMessage
}

export const toError = (
  value: unknown,
  fallbackMessage = 'Unknown error'
): Error => {
  if (value instanceof Error) {
    return value
  }

  return new Error(toErrorMessage(value, fallbackMessage))
}
