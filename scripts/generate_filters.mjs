import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const attributePath = path.join(repoRoot, 'data', 'attribute.json')
const scopedFieldNames = new Set(['category', 'subcategory'])

const commonMap = {}

const normalizeItemType = (value) => {
  if (typeof value !== 'string') return ''

  const normalized = value.trim()
  if (!normalized) return ''

  return normalized === 'abilityHandhelds' ? 'handhelds' : normalized
}

const normalizeFilterValue = (value) => {
  if (typeof value !== 'string') return ''

  const normalized = value.trim()
  if (!normalized || normalized === 'null') {
    return ''
  }

  return normalized
}

const loadAttributeData = (inputPath = attributePath) =>
  JSON.parse(fs.readFileSync(inputPath, 'utf8'))

const collectFieldValues = (data) => {
  const fields = new Map()
  const scopedFields = {
    category: new Map(),
    subcategory: new Map(),
  }

  for (const item of data) {
    const field = item.field
    const value = normalizeFilterValue(item.value)

    if (!field || !value) {
      continue
    }

    if (scopedFieldNames.has(field)) {
      const itemType = normalizeItemType(item.itemType)
      if (!itemType) {
        continue
      }

      if (!scopedFields[field].has(itemType)) {
        scopedFields[field].set(itemType, new Set())
      }

      scopedFields[field].get(itemType).add(value)
      continue
    }

    if (!fields.has(field)) {
      fields.set(field, new Set())
    }

    fields.get(field).add(value)
  }

  const sortedFields = Object.fromEntries(
    Array.from(fields.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([field, values]) => [field, Array.from(values).sort()])
  )

  const sortedScopedFields = Object.fromEntries(
    Object.entries(scopedFields).map(([field, valuesByItemType]) => [
      field,
      Object.fromEntries(
        Array.from(valuesByItemType.entries())
          .sort(([itemTypeA], [itemTypeB]) =>
            itemTypeA.localeCompare(itemTypeB)
          )
          .map(([itemType, values]) => [itemType, Array.from(values).sort()])
      ),
    ])
  )

  return { sortedFields, sortedScopedFields }
}

const buildTemplateMap = (sortedFields, sortedScopedFields) =>
  Object.fromEntries(
    [
      ...Object.entries(sortedFields).map(([field, values]) => [
        field,
        Object.fromEntries(values.map((value) => [value, ''])),
      ]),
      ...Object.entries(sortedScopedFields)
        .filter(
          ([, valuesByItemType]) => Object.keys(valuesByItemType).length > 0
        )
        .map(([field, valuesByItemType]) => [
          field,
          Object.fromEntries(
            Object.entries(valuesByItemType).map(([itemType, values]) => [
              itemType,
              Object.fromEntries(values.map((value) => [value, ''])),
            ])
          ),
        ]),
    ].sort(([fieldA], [fieldB]) => fieldA.localeCompare(fieldB))
  )

export const buildFilterTemplate = (inputPath = attributePath) => {
  const data = loadAttributeData(inputPath)
  const { sortedFields, sortedScopedFields } = collectFieldValues(data)
  return { filter: buildTemplateMap(sortedFields, sortedScopedFields) }
}

const titleCaseToken = (value) =>
  value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const loadExistingTranslations = (lang) => {
  const localePath = path.join(repoRoot, 'app', 'locales', lang, 'filter.json')
  if (!fs.existsSync(localePath)) {
    return {}
  }

  try {
    const locale = JSON.parse(fs.readFileSync(localePath, 'utf8'))
    return locale.filter ?? {}
  } catch {
    return {}
  }
}

const isNestedTranslationMap = (value) =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  Object.values(value).every(
    (entry) =>
      typeof entry === 'object' && entry !== null && !Array.isArray(entry)
  )

const getScopedTranslations = (existingTranslations, field) => {
  const nestedValue = existingTranslations[field]
  if (isNestedTranslationMap(nestedValue)) {
    return nestedValue
  }

  const legacyValue = existingTranslations[`${field}_by_item_type`]
  if (isNestedTranslationMap(legacyValue)) {
    return legacyValue
  }

  return {}
}

const translateValue = (field, value) => {
  if (commonMap[value]) {
    const { en, zh, tw } = commonMap[value]

    if (field === 'hair_length' || field === 'texture') {
      if (value === 'straight') return ['Straight', '直发', '直髮']
      if (value === 'curly') return ['Curly', '卷发', '捲髮']
    }

    return [en, zh, tw]
  }

  const en = titleCaseToken(value)
  let zh = ''
  let tw = ''

  if (field === 'hair_length') {
    if (value.includes('long')) {
      zh = '长发'
      tw = '長髮'
    }
    if (value.includes('short')) {
      zh = '短发'
      tw = '短髮'
    }
    if (value.includes('medium')) {
      zh = '中发'
      tw = '中髮'
    }
  } else if (field === 'top_length') {
    if (value.includes('waist')) {
      zh = '齐腰'
      tw = '齊腰'
    }
    if (value.includes('hip')) {
      zh = '及臀'
      tw = '及臀'
    }
  }

  return [en, zh, tw]
}

const buildScopedTranslations = (
  existingTranslations,
  field,
  localeIndex,
  sortedScopedFields
) => {
  const discoveredScopedTranslations = sortedScopedFields[field] ?? {}

  if (Object.keys(discoveredScopedTranslations).length === 0) {
    return getScopedTranslations(existingTranslations, field)
  }

  return Object.fromEntries(
    Object.entries(discoveredScopedTranslations).map(([itemType, values]) => [
      itemType,
      Object.fromEntries(
        values.map((value) => {
          const seededValue =
            existingTranslations?.[field]?.[itemType]?.[value] ??
            existingTranslations?.[`${field}_by_item_type`]?.[itemType]?.[
              value
            ] ??
            existingTranslations?.[field]?.[value]

          if (seededValue !== undefined) {
            return [value, seededValue]
          }

          return [value, translateValue(field, value)[localeIndex] ?? '']
        })
      ),
    ])
  )
}

export const generateFilters = (inputPath = attributePath) => {
  const data = loadAttributeData(inputPath)
  const { sortedFields, sortedScopedFields } = collectFieldValues(data)
  const existingEnTranslations = loadExistingTranslations('en')
  const existingZhTranslations = loadExistingTranslations('zh')
  const existingTwTranslations = loadExistingTranslations('tw')
  const enTranslations = {}
  const zhTranslations = {}
  const twTranslations = {}

  for (const [field, values] of Object.entries(sortedFields)) {
    enTranslations[field] = {}
    zhTranslations[field] = {}
    twTranslations[field] = {}

    for (const value of values) {
      const [en, zh, tw] = translateValue(field, value)
      enTranslations[field][value] =
        existingEnTranslations[field]?.[value] ?? en ?? ''
      zhTranslations[field][value] =
        existingZhTranslations[field]?.[value] ?? zh ?? ''
      twTranslations[field][value] =
        existingTwTranslations[field]?.[value] ?? tw ?? ''
    }
  }

  for (const [lang, translations] of [
    [
      'en',
      {
        ...enTranslations,
        category: buildScopedTranslations(
          existingEnTranslations,
          'category',
          0,
          sortedScopedFields
        ),
        subcategory: buildScopedTranslations(
          existingEnTranslations,
          'subcategory',
          0,
          sortedScopedFields
        ),
      },
    ],
    [
      'zh',
      {
        ...zhTranslations,
        category: buildScopedTranslations(
          existingZhTranslations,
          'category',
          1,
          sortedScopedFields
        ),
        subcategory: buildScopedTranslations(
          existingZhTranslations,
          'subcategory',
          1,
          sortedScopedFields
        ),
      },
    ],
    [
      'tw',
      {
        ...twTranslations,
        category: buildScopedTranslations(
          existingTwTranslations,
          'category',
          2,
          sortedScopedFields
        ),
        subcategory: buildScopedTranslations(
          existingTwTranslations,
          'subcategory',
          2,
          sortedScopedFields
        ),
      },
    ],
  ]) {
    const outputPath = path.join(
      repoRoot,
      'app',
      'locales',
      lang,
      'filter.json'
    )

    fs.writeFileSync(
      outputPath,
      `${JSON.stringify({ filter: translations }, null, 2)}\n`,
      'utf8'
    )
  }
}

const isDirectRun = () => {
  const entryPath = process.argv[1]
  if (!entryPath) {
    return false
  }

  return import.meta.url === pathToFileURL(path.resolve(entryPath)).href
}

if (isDirectRun()) {
  generateFilters()
  console.log('Done')
}
