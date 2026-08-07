import { intlLocaleMap, type SupportedLocaleCode } from '~/locales/locales'

export const BANNER_CANONICAL_TIME_UTC = '20:00:00'

export const getBannerDateTime = (date: string) =>
  new Date(`${date}T${BANNER_CANONICAL_TIME_UTC}Z`)

export const getBannerDateTimestamp = (date: string) =>
  getBannerDateTime(date).getTime()

export const isBannerDateRangeActive = (
  startDate: string,
  endDate: string,
  now = Date.now()
) =>
  now >= getBannerDateTimestamp(startDate) &&
  now < getBannerDateTimestamp(endDate)

export const useIntlLocale = () => {
  const { locale } = useI18n()

  return computed(
    () => intlLocaleMap[locale.value as SupportedLocaleCode] ?? intlLocaleMap.en
  )
}
