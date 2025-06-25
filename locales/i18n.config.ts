export const defaultLocale = 'en'

export const i18nLocales = [
  {
    code: 'en',
    iso: 'en-US',
    name: 'English',
    files: ['en/common.json', 'en/outfit.json'],
  },
  {
    code: 'de',
    iso: 'de-DE',
    name: 'Deutsch',
    files: ['de/common.json', 'de/outfit.json'],
  },
  {
    code: 'zh',
    iso: 'zh-CN',
    name: '中文',
    files: ['zh/common.json', 'zh/outfit.json'],
  },
]

export default defineI18nConfig(() => ({
  fallbackLocale: defaultLocale,
}))
