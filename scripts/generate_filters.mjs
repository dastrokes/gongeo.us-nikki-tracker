import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const attributePath = path.join(repoRoot, 'data', 'attribute.json')
const localesRoot = path.join(repoRoot, 'app', 'locales')
const scopedFieldNames = new Set(['category', 'subcategory'])

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

const listLocaleCodes = () =>
  fs
    .readdirSync(localesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right))

const loadExistingTranslations = (lang) => {
  const localePath = path.join(localesRoot, lang, 'filter.json')
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

const seedTranslation = (existingTranslations, field, value) =>
  existingTranslations?.[field]?.[value] ??
  existingTranslations?.[`${field}_by_item_type`]?.[value] ??
  titleCaseToken(value)

const buildScopedTranslations = (
  existingTranslations,
  field,
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
        values.map((value) => [
          value,
          existingTranslations?.[field]?.[itemType]?.[value] ??
            existingTranslations?.[`${field}_by_item_type`]?.[itemType]?.[
              value
            ] ??
            existingTranslations?.[field]?.[value] ??
            titleCaseToken(value),
        ])
      ),
    ])
  )
}

export const generateFilters = (inputPath = attributePath) => {
  const data = loadAttributeData(inputPath)
  const { sortedFields, sortedScopedFields } = collectFieldValues(data)
  for (const lang of listLocaleCodes()) {
    const existingTranslations = loadExistingTranslations(lang)
    const translations = Object.fromEntries(
      Object.entries(sortedFields).map(([field, values]) => [
        field,
        Object.fromEntries(
          values.map((value) => [
            value,
            seedTranslation(existingTranslations, field, value),
          ])
        ),
      ])
    )

    translations.category = buildScopedTranslations(
      existingTranslations,
      'category',
      sortedScopedFields
    )
    translations.subcategory = buildScopedTranslations(
      existingTranslations,
      'subcategory',
      sortedScopedFields
    )

    const outputPath = path.join(localesRoot, lang, 'filter.json')

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
