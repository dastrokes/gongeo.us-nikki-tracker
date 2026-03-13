import { getQuery, type H3Event } from 'h3'

import {
  defaultLocale,
  i18nLocales,
  type SupportedLocaleCode,
} from '../../app/locales/locales'

const supportedLocaleCodeSet = new Set<SupportedLocaleCode>(
  i18nLocales.map((locale) => locale.code)
)

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
  return resolveLocaleCode(langQuery)
}
