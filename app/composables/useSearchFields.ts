import { getOutfitSearchAliases as getOutfitAliases } from '~~/data/aliases'

const CHINESE_CHAR_REGEX = /[\u4e00-\u9fff]/
const DEFAULT_SEARCH_KEYS = ['name', 'searchAliases']
const CHINESE_SEARCH_KEYS = [
  'name',
  'searchAliases',
  'pinyin',
  'pinyinInitials',
]

type PinyinFunction = (typeof import('pinyin-pro'))['pinyin']

export type SearchPinyinMeta = {
  pinyin?: string[]
  pinyinInitials?: string[]
}

const toUniqueValues = (values: string[]): string[] =>
  Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))

export const useSearchFields = (isChineseLocale: () => boolean) => {
  const pinyinFunction = shallowRef<PinyinFunction | null>(null)
  let pinyinLoadPromise: Promise<void> | null = null

  const ensurePinyinLoaded = async () => {
    if (import.meta.server || !isChineseLocale() || pinyinFunction.value) {
      return
    }

    if (!pinyinLoadPromise) {
      pinyinLoadPromise = import('pinyin-pro')
        .then(({ pinyin }) => {
          pinyinFunction.value = pinyin
        })
        .finally(() => {
          pinyinLoadPromise = null
        })
    }

    await pinyinLoadPromise
  }

  const getChineseSearchMeta = (
    values: string | readonly string[]
  ): SearchPinyinMeta => {
    if (!isChineseLocale()) {
      return {}
    }

    const pinyin = pinyinFunction.value
    if (!pinyin) {
      return {}
    }

    const pinyinCandidates: string[] = []
    const initialsCandidates: string[] = []
    const normalizedValues = (Array.isArray(values) ? values : [values])
      .map((value) => value.trim())
      .filter((value) => value.length > 0 && CHINESE_CHAR_REGEX.test(value))

    for (const value of normalizedValues) {
      const syllables = pinyin(value, {
        toneType: 'none',
        type: 'array',
        nonZh: 'removed',
      }) as string[]

      if (syllables.length === 0) {
        continue
      }

      pinyinCandidates.push(syllables.join(' '), syllables.join(''))

      const initialsArray = pinyin(value, {
        pattern: 'first',
        type: 'array',
        toneType: 'none',
        nonZh: 'removed',
      }) as string[]

      initialsCandidates.push(initialsArray.join(' '), initialsArray.join(''))
    }

    const uniquePinyinCandidates = toUniqueValues(pinyinCandidates)
    const uniqueInitialsCandidates = toUniqueValues(initialsCandidates)

    return {
      ...(uniquePinyinCandidates.length > 0
        ? { pinyin: uniquePinyinCandidates }
        : {}),
      ...(uniqueInitialsCandidates.length > 0
        ? { pinyinInitials: uniqueInitialsCandidates }
        : {}),
    }
  }

  const getSearchKeys = (): string[] => [
    ...(isChineseLocale() ? CHINESE_SEARCH_KEYS : DEFAULT_SEARCH_KEYS),
  ]

  return {
    ensurePinyinLoaded,
    getChineseSearchMeta,
    getOutfitSearchAliases: getOutfitAliases,
    getSearchKeys,
  }
}
