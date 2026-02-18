import {
  defaultLocale,
  i18nLocales,
  type SupportedLocaleCode,
} from '~/locales/locales'

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
