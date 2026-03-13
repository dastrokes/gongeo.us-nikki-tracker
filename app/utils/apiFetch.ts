export interface ApiErrorResponse {
  message?: string
  data?: { code?: string }
}

export const isNotFoundResponse = (response: { status: number }) =>
  response.status === 404

export const getApiErrorMessage = (
  response: { _data?: ApiErrorResponse } | undefined,
  fallbackMessage: string
) => response?._data?.message || fallbackMessage
