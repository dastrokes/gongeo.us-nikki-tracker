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

// Map locale codes to Intl locale strings for proper formatting
export const intlLocaleMap: Record<SupportedLocaleCode, string> = {
  en: 'en-US',
  de: 'de-DE',
  es: 'es-ES',
  fr: 'fr-FR',
  id: 'id-ID',
  it: 'it-IT',
  ja: 'ja-JP',
  ko: 'ko-KR',
  pt: 'pt-BR',
  th: 'th-TH',
  tw: 'zh-TW',
  zh: 'zh-CN',
}

export const i18nLocales: LocaleObject<SupportedLocaleCode>[] = [
  {
    code: 'en',
    iso: 'en',
    name: 'English',
    files: [
      'en/common.json',
      'en/banner.json',
      'en/outfit.json',
      'en/item.json',
      'en/misc.json',
    ],
  },
  {
    code: 'de',
    iso: 'de',
    name: 'Deutsch',
    files: [
      'de/common.json',
      'de/banner.json',
      'de/outfit.json',
      'de/item.json',
      'de/misc.json',
    ],
  },
  {
    code: 'es',
    iso: 'es',
    name: 'Español',
    files: [
      'es/common.json',
      'es/banner.json',
      'es/outfit.json',
      'es/item.json',
      'es/misc.json',
    ],
  },
  {
    code: 'fr',
    iso: 'fr',
    name: 'Français',
    files: [
      'fr/common.json',
      'fr/banner.json',
      'fr/outfit.json',
      'fr/item.json',
      'fr/misc.json',
    ],
  },
  {
    code: 'id',
    iso: 'id',
    name: 'Bahasa Indonesia',
    files: [
      'id/common.json',
      'id/banner.json',
      'id/outfit.json',
      'id/item.json',
      'id/misc.json',
    ],
  },
  {
    code: 'it',
    iso: 'it',
    name: 'Italiano',
    files: [
      'it/common.json',
      'it/banner.json',
      'it/outfit.json',
      'it/item.json',
      'it/misc.json',
    ],
  },
  {
    code: 'ja',
    iso: 'ja',
    name: '日本語',
    files: [
      'ja/common.json',
      'ja/banner.json',
      'ja/outfit.json',
      'ja/item.json',
      'ja/misc.json',
    ],
  },
  {
    code: 'ko',
    iso: 'ko',
    name: '한국어',
    files: [
      'ko/common.json',
      'ko/banner.json',
      'ko/outfit.json',
      'ko/item.json',
      'ko/misc.json',
    ],
  },
  {
    code: 'pt',
    iso: 'pt',
    name: 'Português',
    files: [
      'pt/common.json',
      'pt/banner.json',
      'pt/outfit.json',
      'pt/item.json',
      'pt/misc.json',
    ],
  },
  {
    code: 'th',
    iso: 'th',
    name: 'ไทย',
    files: [
      'th/common.json',
      'th/banner.json',
      'th/outfit.json',
      'th/item.json',
      'th/misc.json',
    ],
  },
  {
    code: 'tw',
    iso: 'zh-TW',
    name: '繁體中文',
    files: [
      'tw/common.json',
      'tw/banner.json',
      'tw/outfit.json',
      'tw/item.json',
      'tw/misc.json',
    ],
  },
  {
    code: 'zh',
    iso: 'zh-CN',
    name: '简体中文',
    files: [
      'zh/common.json',
      'zh/banner.json',
      'zh/outfit.json',
      'zh/item.json',
      'zh/misc.json',
    ],
  },
]
