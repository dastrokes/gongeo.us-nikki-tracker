export const getDataApiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const configuredBaseUrl = useRuntimeConfig().public.dataApiBaseUrl
  const baseUrl =
    typeof configuredBaseUrl === 'string'
      ? configuredBaseUrl.trim().replace(/\/+$/, '')
      : ''

  if (!baseUrl) {
    throw new Error(
      'NUXT_PUBLIC_DATA_API_BASE_URL is required for data API requests'
    )
  }
  const requestBaseUrl = normalizedPath.startsWith('/_internal/')
    ? baseUrl.replace(/\/v1$/, '')
    : baseUrl

  if (import.meta.dev && /^https?:\/\//.test(requestBaseUrl)) {
    const upstreamUrl = new URL(requestBaseUrl)
    return `/_dev/data-api${upstreamUrl.pathname.replace(/\/+$/, '')}${normalizedPath}`
  }

  return `${requestBaseUrl}${normalizedPath}`
}
