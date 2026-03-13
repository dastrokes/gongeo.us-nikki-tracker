export interface StyleDefinition {
  key: string
  index: number
  i18nKey: string
}

export interface TagDefinition {
  id: number
  key: string
  i18nKey: string
  color: [number, number, number]
}

export const STYLE_DEFINITIONS: StyleDefinition[] = [
  { key: 'elegant', index: 0, i18nKey: 'style.elegant' },
  { key: 'fresh', index: 1, i18nKey: 'style.fresh' },
  { key: 'sweet', index: 2, i18nKey: 'style.sweet' },
  { key: 'sexy', index: 3, i18nKey: 'style.sexy' },
  { key: 'cool', index: 4, i18nKey: 'style.cool' },
]

export const STYLE_BACKGROUND_COLORS: Record<string, string> = {
  elegant: '#e1c08f',
  fresh: '#a9c28f',
  sweet: '#f2a5b0',
  sexy: '#b28acb',
  cool: '#8ea8d3',
}

export const TAG_DEFINITIONS: TagDefinition[] = [
  { id: 1, key: 'warm', i18nKey: 'label.1.name', color: [49, 104, 133] },
  { id: 2, key: 'summer', i18nKey: 'label.2.name', color: [237, 78, 96] },
  { id: 3, key: 'home', i18nKey: 'label.3.name', color: [97, 149, 60] },
  { id: 4, key: 'formal', i18nKey: 'label.4.name', color: [206, 133, 43] },
  { id: 5, key: 'simple', i18nKey: 'label.5.name', color: [239, 77, 53] },
  { id: 6, key: 'fantasy', i18nKey: 'label.6.name', color: [60, 149, 109] },
  {
    id: 7,
    key: 'intellectual',
    i18nKey: 'label.7.name',
    color: [233, 103, 40],
  },
  { id: 8, key: 'adventure', i18nKey: 'label.8.name', color: [239, 77, 53] },
  { id: 9, key: 'romance', i18nKey: 'label.9.name', color: [237, 78, 96] },
  { id: 10, key: 'retro', i18nKey: 'label.10.name', color: [233, 103, 40] },
  { id: 11, key: 'fashion', i18nKey: 'label.11.name', color: [97, 149, 60] },
  { id: 12, key: 'uniform', i18nKey: 'label.12.name', color: [63, 96, 223] },
  { id: 100, key: 'fairy', i18nKey: 'label.100.name', color: [60, 149, 109] },
  {
    id: 101,
    key: 'ballroom',
    i18nKey: 'label.101.name',
    color: [233, 103, 40],
  },
  { id: 102, key: 'royal', i18nKey: 'label.102.name', color: [239, 77, 53] },
  { id: 103, key: 'linlang', i18nKey: 'label.103.name', color: [206, 133, 43] },
  { id: 104, key: 'pastoral', i18nKey: 'label.104.name', color: [97, 149, 60] },
  { id: 105, key: 'playful', i18nKey: 'label.105.name', color: [63, 96, 223] },
  { id: 106, key: 'trendy', i18nKey: 'label.106.name', color: [233, 103, 40] },
  { id: 107, key: 'cute', i18nKey: 'label.107.name', color: [237, 78, 96] },
  { id: 108, key: 'light', i18nKey: 'label.108.name', color: [206, 133, 43] },
  {
    id: 109,
    key: 'more-light',
    i18nKey: 'label.109.name',
    color: [206, 133, 43],
  },
  { id: 110, key: 'divine', i18nKey: 'label.110.name', color: [233, 103, 40] },
  { id: 111, key: 'forest', i18nKey: 'label.111.name', color: [60, 149, 109] },
  {
    id: 112,
    key: 'spirited',
    i18nKey: 'label.112.name',
    color: [49, 104, 133],
  },
  {
    id: 113,
    key: 'classical',
    i18nKey: 'label.113.name',
    color: [239, 77, 53],
  },
  { id: 114, key: 'terra', i18nKey: 'label.114.name', color: [206, 133, 43] },
  {
    id: 115,
    key: 'aesthetic',
    i18nKey: 'label.115.name',
    color: [63, 96, 223],
  },
  { id: 116, key: 'whimsy', i18nKey: 'label.116.name', color: [237, 78, 96] },
  { id: 117, key: 'glow', i18nKey: 'label.117.name', color: [97, 149, 60] },
]

export const TAG_COLOR_BY_ID: Record<number, [number, number, number]> =
  Object.fromEntries(
    TAG_DEFINITIONS.map((definition) => [definition.id, definition.color])
  )

export const normalizeTraitKey = (value: string) => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
}

export const STYLE_BY_KEY = new Map(
  STYLE_DEFINITIONS.map((definition) => [definition.key, definition])
)

export const resolveStyleKeyFromI18nKey = (value?: string | null) => {
  if (!value) return null
  const normalized = normalizeTraitKey(value)
  const direct = STYLE_BY_KEY.get(normalized)
  if (direct) return direct.key
  const match = STYLE_DEFINITIONS.find(
    (style) => style.i18nKey === value || style.i18nKey === normalized
  )
  return match?.key ?? null
}

export const getStyleBackgroundColor = (styleKey?: string | null) =>
  styleKey ? (STYLE_BACKGROUND_COLORS[styleKey] ?? null) : null

export const getStyleTagTheme = (styleKey?: string | null) => {
  const color = getStyleBackgroundColor(styleKey)
  if (!color) return undefined
  return {
    color,
    textColor: '#ffffff',
    borderColor: 'transparent',
  }
}

export const getLabelTagTheme = (value?: string | number | null) => {
  if (value === null || value === undefined) return undefined
  let id: number | null = null
  if (typeof value === 'number') {
    id = value
  } else if (typeof value === 'string') {
    const direct = Number(value)
    if (!Number.isNaN(direct)) {
      id = direct
    } else {
      const match = value.match(/label\.(\d+)\.name/i)
      if (match && match[1]) {
        id = Number(match[1])
      }
    }
  }

  if (!id) return undefined
  const color = TAG_COLOR_BY_ID[id]
  if (!color) return undefined
  const [r, g, b] = color
  const mixWithWhite = (value: number, ratio: number) =>
    Math.round(value + (255 - value) * ratio)
  const bg = {
    r: mixWithWhite(r, 1),
    g: mixWithWhite(g, 1),
    b: mixWithWhite(b, 1),
  }
  const border = {
    r: mixWithWhite(r, 0.5),
    g: mixWithWhite(g, 0.5),
    b: mixWithWhite(b, 0.5),
  }
  const text = {
    r: mixWithWhite(r, 0.5),
    g: mixWithWhite(g, 0.5),
    b: mixWithWhite(b, 0.5),
  }
  return {
    color: `rgb(${bg.r}, ${bg.g}, ${bg.b})`,
    textColor: `rgb(${text.r}, ${text.g}, ${text.b})`,
    borderColor: `rgb(${border.r}, ${border.g}, ${border.b})`,
  }
}

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
