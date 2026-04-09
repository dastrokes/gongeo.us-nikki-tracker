import type { Context } from '@netlify/edge-functions'

const LOCALE_COOKIE_KEY = 'i18n_redirected'
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365
const SUPPORTED_LOCALE_CODES = [
  'en',
  'de',
  'es',
  'fr',
  'it',
  'pt',
  'ja',
  'ko',
  'zh',
  'tw',
] as const
type SupportedLocaleCode = (typeof SUPPORTED_LOCALE_CODES)[number]
const DEFAULT_LOCALE: SupportedLocaleCode = 'en'
const SUPPORTED_LOCALES = new Set<SupportedLocaleCode>(SUPPORTED_LOCALE_CODES)
const DIRECT_LANGUAGE_LOCALES = new Set<SupportedLocaleCode>(
  SUPPORTED_LOCALE_CODES.filter((code) => code !== 'tw')
)

function resolveLocaleFromCookie(
  cookieLocale: string | null | undefined
): SupportedLocaleCode | null {
  if (!cookieLocale) return null

  const normalized = cookieLocale.trim().toLowerCase()
  return SUPPORTED_LOCALES.has(normalized as SupportedLocaleCode)
    ? (normalized as SupportedLocaleCode)
    : null
}

function parseQuality(value: string | undefined): number {
  if (!value) return 1

  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed)) return 0

  return Math.min(Math.max(parsed, 0), 1)
}

function resolveLocaleFromLanguageTag(
  languageTag: string
): SupportedLocaleCode | null {
  const normalized = languageTag.trim().toLowerCase()
  if (!normalized) return null

  if (normalized === '*') {
    return DEFAULT_LOCALE
  }

  if (
    normalized === 'zh-hant' ||
    normalized.startsWith('zh-hant-') ||
    normalized.startsWith('zh-tw') ||
    normalized.startsWith('zh-hk') ||
    normalized.startsWith('zh-mo')
  ) {
    return 'tw'
  }

  if (
    normalized === 'zh-hans' ||
    normalized.startsWith('zh-hans-') ||
    normalized.startsWith('zh-sg')
  ) {
    return 'zh'
  }

  const [baseLanguage] = normalized.split('-')
  if (!baseLanguage) return null

  if (baseLanguage === 'zh') {
    return 'zh'
  }

  return DIRECT_LANGUAGE_LOCALES.has(baseLanguage as SupportedLocaleCode)
    ? (baseLanguage as SupportedLocaleCode)
    : null
}

function resolveLocaleFromAcceptLanguage(
  acceptLanguageHeader: string | null
): SupportedLocaleCode {
  if (!acceptLanguageHeader) return DEFAULT_LOCALE

  let resolvedLocale: SupportedLocaleCode | null = null
  let highestQuality = -1

  for (const range of acceptLanguageHeader.split(',')) {
    const [languageTag, ...params] = range.trim().split(';')
    const normalizedLanguageTag = languageTag?.trim()
    if (!normalizedLanguageTag) continue

    let quality = 1
    for (const param of params) {
      const normalizedParam = param.trim().toLowerCase()
      if (normalizedParam.startsWith('q=')) {
        quality = parseQuality(normalizedParam.slice(2))
        break
      }
    }

    if (quality <= 0 || quality <= highestQuality) continue

    const locale = resolveLocaleFromLanguageTag(normalizedLanguageTag)
    if (!locale) continue

    if (quality === 1) {
      return locale
    }

    resolvedLocale = locale
    highestQuality = quality
  }

  return resolvedLocale ?? DEFAULT_LOCALE
}

function buildLocaleCookie(locale: SupportedLocaleCode): string {
  return [
    `${LOCALE_COOKIE_KEY}=${locale}`,
    'Path=/',
    `Max-Age=${COOKIE_MAX_AGE_SECONDS}`,
    'SameSite=Lax',
  ].join('; ')
}

export default (request: Request, context: Context) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return context.next()
  }

  const cookieLocale = resolveLocaleFromCookie(
    context.cookies.get(LOCALE_COOKIE_KEY)
  )
  const resolvedLocale =
    cookieLocale ??
    resolveLocaleFromAcceptLanguage(request.headers.get('accept-language'))

  if (resolvedLocale === DEFAULT_LOCALE) {
    return context.next()
  }

  const url = new URL(request.url)
  const redirectUrl = new URL(`/${resolvedLocale}${url.search}`, url.origin)
  const headers = new Headers({
    Location: redirectUrl.toString(),
    'Cache-Control': 'private, no-store',
    'Netlify-CDN-Cache-Control': 'no-store',
  })
  headers.append('Set-Cookie', buildLocaleCookie(resolvedLocale))

  console.log('root-redirect:', {
    from: '/',
    to: redirectUrl.pathname,
    locale: resolvedLocale,
    source: cookieLocale ? 'cookie' : 'accept-language',
  })

  return new Response(null, {
    headers,
    status: 302,
  })
}
