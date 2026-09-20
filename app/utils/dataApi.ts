export const getDataApiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const configuredBaseUrl = useRuntimeConfig().public.dataApiBaseUrl
  const baseUrl =
    typeof configuredBaseUrl === 'string'
      ? configuredBaseUrl.trim().replace(/\/+$/, '')
      : ''

  return baseUrl ? `${baseUrl}${normalizedPath}` : `/api${normalizedPath}`
}
