import type { LocaleObject } from '@nuxtjs/i18n'

export type SupportedLocaleCode = 'en' | 'de' | 'zh' | 'ko'

export const defaultLocale: SupportedLocaleCode = 'en'

export const i18nLocales: LocaleObject<SupportedLocaleCode>[] = [
  {
    code: 'en',
    iso: 'en-US',
    name: 'English',
    files: [
      'en/common.json',
      'en/outfit.json',
      'en/item.json',
      'en/version.json',
    ],
  },
  {
    code: 'de',
    iso: 'de-DE',
    name: 'Deutsch',
    files: [
      'de/common.json',
      'de/outfit.json',
      'de/item.json',
      'de/version.json',
    ],
  },
  {
    code: 'zh',
    iso: 'zh-CN',
    name: '中文',
    files: [
      'zh/common.json',
      'zh/outfit.json',
      'zh/item.json',
      'zh/version.json',
    ],
  },
  {
    code: 'ko',
    iso: 'ko-KR',
    name: '한국어',
    files: [
      'ko/common.json',
      'ko/outfit.json',
      'ko/item.json',
      'ko/version.json',
    ],
  },
]
