import { defaultLocale } from './locales'

export default defineI18nConfig(() => ({
  fallbackLocale: defaultLocale,
  flatJson: true,
}))
