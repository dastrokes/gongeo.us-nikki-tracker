export interface StyleDefinition {
  key: string
  index: number
  i18nKey: string
}

export interface TagDefinition {
  id: number
  key: string
  i18nKey: string
}

export const STYLE_DEFINITIONS: StyleDefinition[] = [
  { key: 'elegant', index: 0, i18nKey: 'style.elegant' },
  { key: 'fresh', index: 1, i18nKey: 'style.fresh' },
  { key: 'sweet', index: 2, i18nKey: 'style.sweet' },
  { key: 'sexy', index: 3, i18nKey: 'style.sexy' },
  { key: 'cool', index: 4, i18nKey: 'style.cool' },
]

export const TAG_DEFINITIONS: TagDefinition[] = [
  { id: 1, key: 'warm', i18nKey: 'label.1.name' },
  { id: 2, key: 'summer', i18nKey: 'label.2.name' },
  { id: 3, key: 'home', i18nKey: 'label.3.name' },
  { id: 4, key: 'formal', i18nKey: 'label.4.name' },
  { id: 5, key: 'simple', i18nKey: 'label.5.name' },
  { id: 6, key: 'fantasy', i18nKey: 'label.6.name' },
  { id: 7, key: 'intellectual', i18nKey: 'label.7.name' },
  { id: 8, key: 'adventure', i18nKey: 'label.8.name' },
  { id: 9, key: 'romance', i18nKey: 'label.9.name' },
  { id: 10, key: 'retro', i18nKey: 'label.10.name' },
  { id: 11, key: 'fashion', i18nKey: 'label.11.name' },
  { id: 12, key: 'uniform', i18nKey: 'label.12.name' },
  { id: 100, key: 'fairy', i18nKey: 'label.100.name' },
  { id: 101, key: 'ballroom', i18nKey: 'label.101.name' },
  { id: 102, key: 'royal', i18nKey: 'label.102.name' },
  { id: 103, key: 'linlang', i18nKey: 'label.103.name' },
  { id: 104, key: 'pastoral', i18nKey: 'label.104.name' },
  { id: 105, key: 'playful', i18nKey: 'label.105.name' },
  { id: 106, key: 'trendy', i18nKey: 'label.106.name' },
  { id: 107, key: 'cute', i18nKey: 'label.107.name' },
  { id: 108, key: 'light', i18nKey: 'label.108.name' },
  { id: 109, key: 'more-light', i18nKey: 'label.109.name' },
  { id: 110, key: 'divine', i18nKey: 'label.110.name' },
  { id: 111, key: 'forest', i18nKey: 'label.111.name' },
  { id: 112, key: 'spirited', i18nKey: 'label.112.name' },
  { id: 113, key: 'classical', i18nKey: 'label.113.name' },
  { id: 114, key: 'terra', i18nKey: 'label.114.name' },
  { id: 115, key: 'aesthetic', i18nKey: 'label.115.name' },
  { id: 116, key: 'whimsy', i18nKey: 'label.116.name' },
  { id: 117, key: 'glow', i18nKey: 'label.117.name' },
]

export const normalizeTraitKey = (value: string) => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
}

export const STYLE_BY_KEY = new Map(
  STYLE_DEFINITIONS.map((definition) => [definition.key, definition])
)

export const TAG_BY_KEY = new Map(
  TAG_DEFINITIONS.map((definition) => [definition.key, definition])
)

export const TAG_I18N_BY_ID = new Map(
  TAG_DEFINITIONS.map((definition) => [definition.id, definition.i18nKey])
)

export const resolveStyleKeyFromProps = (
  props?: Array<number | string> | null
) => {
  if (!props || props.length === 0) return null

  const values = props
    .map((value) => Number(value))
    .filter((value) => !Number.isNaN(value))

  if (values.length === 0) return null

  const firstValue = values[0]
  if (firstValue === undefined) return null

  let maxValue = firstValue
  let maxIndex = 0

  for (let i = 1; i < values.length; i += 1) {
    const currentValue = values[i]
    if (currentValue === undefined) continue

    if (currentValue > maxValue) {
      maxValue = currentValue
      maxIndex = i
    }
  }

  return STYLE_DEFINITIONS[maxIndex]?.key ?? null
}

export const resolveStyleI18nKeyFromProps = (
  props?: Array<number | string> | null
) => {
  const styleKey = resolveStyleKeyFromProps(props)
  return styleKey ? (STYLE_BY_KEY.get(styleKey)?.i18nKey ?? null) : null
}

export const resolveTagI18nKeys = (tags?: Array<number | string> | null) => {
  if (!tags || tags.length === 0) return []

  const keys = tags
    .map((value) => Number(value))
    .filter((value) => !Number.isNaN(value))
    .map((value) => TAG_I18N_BY_ID.get(value))
    .filter((value): value is string => Boolean(value))

  return keys
}
