export interface StyleDefinition {
  key: string
  label: string
  index: number
}

export interface TagDefinition {
  id: number
  key: string
  label: string
}

export const STYLE_DEFINITIONS: StyleDefinition[] = [
  { key: 'elegant', label: 'Elegant', index: 0 },
  { key: 'fresh', label: 'Fresh', index: 1 },
  { key: 'sweet', label: 'Sweet', index: 2 },
  { key: 'sexy', label: 'Sexy', index: 3 },
  { key: 'cool', label: 'Cool', index: 4 },
]

export const TAG_DEFINITIONS: TagDefinition[] = [
  { id: 1, key: 'warm', label: 'warm' },
  { id: 2, key: 'summer', label: 'summer' },
  { id: 3, key: 'home', label: 'home' },
  { id: 4, key: 'formal', label: 'formal' },
  { id: 5, key: 'simple', label: 'simple' },
  { id: 6, key: 'fantasy', label: 'fantasy' },
  { id: 7, key: 'intellectual', label: 'intellectual' },
  { id: 8, key: 'adventure', label: 'adventure' },
  { id: 9, key: 'romance', label: 'romance' },
  { id: 10, key: 'retro', label: 'retro' },
  { id: 11, key: 'fashion', label: 'fashion' },
  { id: 12, key: 'uniform', label: 'uniform' },
  { id: 100, key: 'fairy', label: 'fairy' },
  { id: 101, key: 'ballroom', label: 'ballroom' },
  { id: 102, key: 'royal', label: 'royal' },
  { id: 103, key: 'linlang', label: 'linlang' },
  { id: 104, key: 'pastoral', label: 'pastoral' },
  { id: 105, key: 'playful', label: 'playful' },
  { id: 106, key: 'trendy', label: 'trendy' },
  { id: 107, key: 'cute', label: 'cute' },
  { id: 108, key: 'light', label: 'light' },
  { id: 109, key: 'more-light', label: 'more-light' },
  { id: 110, key: 'divine', label: 'divine' },
  { id: 111, key: 'forest', label: 'forest' },
  { id: 112, key: 'spirited', label: 'spirited' },
  { id: 113, key: 'classical', label: 'classical' },
  { id: 114, key: 'terra', label: 'terra' },
  { id: 115, key: 'aesthetic', label: 'aesthetic' },
  { id: 116, key: 'whimsy', label: 'whimsy' },
  { id: 117, key: 'glow', label: 'glow' },
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

export const TAG_BY_ID = new Map(
  TAG_DEFINITIONS.map((definition) => [definition.id, definition.label])
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

export const resolveStyleLabelFromProps = (
  props?: Array<number | string> | null
) => {
  const styleKey = resolveStyleKeyFromProps(props)
  return styleKey ? (STYLE_BY_KEY.get(styleKey)?.label ?? null) : null
}

export const resolveTagLabels = (tags?: Array<number | string> | null) => {
  if (!tags || tags.length === 0) return []

  const labels = tags
    .map((value) => Number(value))
    .filter((value) => !Number.isNaN(value))
    .map((value) => TAG_BY_ID.get(value))
    .filter((value): value is string => Boolean(value))

  return labels
}
