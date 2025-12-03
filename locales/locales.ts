import type { LocaleObject } from '@nuxtjs/i18n'

export type SupportedLocaleCode =
  | 'en'
  | 'de'
  | 'es'
  | 'fr'
  | 'id'
  | 'it'
  | 'ja'
  | 'ko'
  | 'pt'
  | 'th'
  | 'tw'
  | 'zh'

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
    code: 'es',
    iso: 'es-ES',
    name: 'Español',
    files: [
      'es/common.json',
      'es/outfit.json',
      'es/item.json',
      'es/version.json',
    ],
  },
  {
    code: 'fr',
    iso: 'fr-FR',
    name: 'Français',
    files: [
      'fr/common.json',
      'fr/outfit.json',
      'fr/item.json',
      'fr/version.json',
    ],
  },
  {
    code: 'id',
    iso: 'id-ID',
    name: 'Bahasa Indonesia',
    files: [
      'id/common.json',
      'id/outfit.json',
      'id/item.json',
      'id/version.json',
    ],
  },
  {
    code: 'it',
    iso: 'it-IT',
    name: 'Italiano',
    files: [
      'it/common.json',
      'it/outfit.json',
      'it/item.json',
      'it/version.json',
    ],
  },
  {
    code: 'ja',
    iso: 'ja-JP',
    name: '日本語',
    files: [
      'ja/common.json',
      'ja/outfit.json',
      'ja/item.json',
      'ja/version.json',
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
  {
    code: 'pt',
    iso: 'pt-PT',
    name: 'Português',
    files: [
      'pt/common.json',
      'pt/outfit.json',
      'pt/item.json',
      'pt/version.json',
    ],
  },
  {
    code: 'th',
    iso: 'th-TH',
    name: 'ไทย',
    files: [
      'th/common.json',
      'th/outfit.json',
      'th/item.json',
      'th/version.json',
    ],
  },
  {
    code: 'tw',
    iso: 'zh-TW',
    name: '繁體中文',
    files: [
      'tw/common.json',
      'tw/outfit.json',
      'tw/item.json',
      'tw/version.json',
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
]
