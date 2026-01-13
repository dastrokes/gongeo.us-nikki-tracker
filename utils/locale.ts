import {
  defaultLocale,
  i18nLocales,
  type SupportedLocaleCode,
} from '~/locales/locales'

export const LOCALE_HEADER = 'X-Locale'

const supportedLocaleCodes = new Set(i18nLocales.map((locale) => locale.code))

export const resolveLocaleCode = (
  value?: string | null
): SupportedLocaleCode => {
  if (!value) return defaultLocale

  const normalized = value.toLowerCase()
  if (supportedLocaleCodes.has(normalized as SupportedLocaleCode)) {
    return normalized as SupportedLocaleCode
  }

  return defaultLocale
}
