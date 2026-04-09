import type { LocaleObject } from '@nuxtjs/i18n'

export type SupportedLocaleCode =
  | 'en'
  | 'de'
  | 'es'
  | 'fr'
  | 'it'
  | 'pt'
  | 'ja'
  | 'ko'
  | 'zh'
  | 'tw'

export const defaultLocale: SupportedLocaleCode = 'en'

// Map locale codes to Intl locale strings for proper formatting
export const intlLocaleMap: Record<SupportedLocaleCode, string> = {
  en: 'en-US',
  de: 'de-DE',
  es: 'es-ES',
  fr: 'fr-FR',
  it: 'it-IT',
  pt: 'pt-BR',
  ja: 'ja-JP',
  ko: 'ko-KR',
  zh: 'zh-CN',
  tw: 'zh-TW',
}

export const i18nLocales: LocaleObject<SupportedLocaleCode>[] = [
  {
    code: 'en',
    language: 'en',
    name: 'English',
    files: [
      'en/common.json',
      'en/filter.json',
      'en/banner.json',
      'en/outfit.json',
      'en/item.json',
      'en/misc.json',
    ],
  },
  {
    code: 'de',
    language: 'de',
    name: 'Deutsch',
    files: [
      'de/common.json',
      'de/filter.json',
      'de/banner.json',
      'de/outfit.json',
      'de/item.json',
      'de/misc.json',
    ],
  },
  {
    code: 'es',
    language: 'es',
    name: 'Español',
    files: [
      'es/common.json',
      'es/filter.json',
      'es/banner.json',
      'es/outfit.json',
      'es/item.json',
      'es/misc.json',
    ],
  },
  {
    code: 'fr',
    language: 'fr',
    name: 'Français',
    files: [
      'fr/common.json',
      'fr/filter.json',
      'fr/banner.json',
      'fr/outfit.json',
      'fr/item.json',
      'fr/misc.json',
    ],
  },
  {
    code: 'it',
    language: 'it',
    name: 'Italiano',
    files: [
      'it/common.json',
      'it/filter.json',
      'it/banner.json',
      'it/outfit.json',
      'it/item.json',
      'it/misc.json',
    ],
  },
  {
    code: 'pt',
    language: 'pt',
    name: 'Português',
    files: [
      'pt/common.json',
      'pt/filter.json',
      'pt/banner.json',
      'pt/outfit.json',
      'pt/item.json',
      'pt/misc.json',
    ],
  },
  {
    code: 'ja',
    language: 'ja',
    name: '日本語',
    files: [
      'ja/common.json',
      'ja/filter.json',
      'ja/banner.json',
      'ja/outfit.json',
      'ja/item.json',
      'ja/misc.json',
    ],
  },
  {
    code: 'ko',
    language: 'ko',
    name: '한국어',
    files: [
      'ko/common.json',
      'ko/filter.json',
      'ko/banner.json',
      'ko/outfit.json',
      'ko/item.json',
      'ko/misc.json',
    ],
  },

  {
    code: 'zh',
    language: 'zh-CN',
    name: '简体中文',
    files: [
      'zh/common.json',
      'zh/filter.json',
      'zh/banner.json',
      'zh/outfit.json',
      'zh/item.json',
      'zh/misc.json',
    ],
  },
  {
    code: 'tw',
    language: 'zh-TW',
    name: '繁體中文',
    files: [
      'tw/common.json',
      'tw/filter.json',
      'tw/banner.json',
      'tw/outfit.json',
      'tw/item.json',
      'tw/misc.json',
    ],
  },
]
