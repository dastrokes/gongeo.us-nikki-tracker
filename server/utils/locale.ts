import { getCookie, getQuery, type H3Event } from 'h3'

import {
  defaultLocale,
  i18nLocales,
  type SupportedLocaleCode,
} from '../../app/locales/locales'

const supportedLocaleCodeSet = new Set<SupportedLocaleCode>(
  i18nLocales.map((locale) => locale.code)
)
const cjkLocaleCodeSet = new Set<SupportedLocaleCode>(['ja', 'ko', 'zh', 'tw'])
const hybridSearchLocaleCodeSet = new Set<SupportedLocaleCode>([
  'en',
  'zh',
  'tw',
])

export type UpstashSearchNamespace = 'en' | 'zh'
export type UpstashSearchMode = 'HYBRID' | 'DENSE'

export const resolveLocaleCode = (
  value?: string | null
): SupportedLocaleCode => {
  if (!value) return defaultLocale

  const normalized = value.toLowerCase()
  if (supportedLocaleCodeSet.has(normalized as SupportedLocaleCode)) {
    return normalized as SupportedLocaleCode
  }

  return defaultLocale
}

export const resolveRequestLocale = (event: H3Event): SupportedLocaleCode => {
  const query = getQuery(event)
  const langQuery = Array.isArray(query.lang) ? query.lang[0] : query.lang
  const cookieLocale = getCookie(event, 'i18n_redirected')

  return resolveLocaleCode(
    langQuery?.toString() ?? cookieLocale?.toString() ?? null
  )
}

export const resolveUpstashSearchNamespace = (
  locale: SupportedLocaleCode
): UpstashSearchNamespace => (cjkLocaleCodeSet.has(locale) ? 'zh' : 'en')

export const resolveRequestUpstashSearchNamespace = (
  event: H3Event
): UpstashSearchNamespace =>
  resolveUpstashSearchNamespace(resolveRequestLocale(event))

export const resolveUpstashSearchMode = (
  locale: SupportedLocaleCode
): UpstashSearchMode =>
  hybridSearchLocaleCodeSet.has(locale) ? 'HYBRID' : 'DENSE'

export const resolveRequestUpstashSearchMode = (
  event: H3Event
): UpstashSearchMode => resolveUpstashSearchMode(resolveRequestLocale(event))
