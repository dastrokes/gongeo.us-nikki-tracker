export const getDataApiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const configuredBaseUrl = useRuntimeConfig().public.dataApiBaseUrl
  const baseUrl =
    typeof configuredBaseUrl === 'string'
      ? configuredBaseUrl.trim().replace(/\/+$/, '')
      : ''

  if (!baseUrl) return `/api${normalizedPath}`
  const requestBaseUrl = normalizedPath.startsWith('/_internal/')
    ? baseUrl.replace(/\/v1$/, '')
    : baseUrl
  return `${requestBaseUrl}${normalizedPath}`
}
