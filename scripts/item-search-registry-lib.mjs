import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { loadItemSearchRegistry } from '../data/item-search/registry.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const localesRoot = path.join(repoRoot, 'app', 'locales')
const attributePath = path.join(repoRoot, 'data', 'attribute.json')
const registryModulePath = path.join(
  repoRoot,
  'shared',
  'constants',
  'itemSearchRegistry.ts'
)
const taxonomyModulePath = path.join(
  repoRoot,
  'shared',
  'constants',
  'itemSearchTaxonomy.ts'
)
const trackerExportPath = path.join(
  repoRoot,
  'data',
  'item-search',
  'generated',
  'image-search-taxonomy.json'
)

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

const seedTranslation = (existingTranslations, field, value) =>
  existingTranslations?.[field]?.[value] ??
  existingTranslations?.[`${field}_by_item_type`]?.[value] ??
  titleCaseToken(value)

const buildScopedTranslations = (
  existingTranslations,
  field,
  scopedValuesByItemType
) =>
  Object.fromEntries(
    Object.entries(scopedValuesByItemType).map(([itemType, values]) => [
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

const sortObjectEntries = (value) =>
  Object.fromEntries(
    Object.entries(value).sort(([left], [right]) => left.localeCompare(right))
  )

export const loadRegistry = () => loadItemSearchRegistry()

export const buildAttributeEntries = (registry = loadRegistry()) => {
  const sharedEntries = Object.entries(registry.terms.sharedFieldValues ?? {})
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([field, values]) =>
      values.map((value) => ({
        field,
        itemType: null,
        value,
      }))
    )

  const scopedEntries = Object.entries(registry.terms.scopedFieldValues ?? {})
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([field, valuesByItemType]) =>
      Object.entries(valuesByItemType)
        .sort(([left], [right]) => left.localeCompare(right))
        .flatMap(([itemType, values]) =>
          values.map((value) => ({
            field,
            itemType,
            value,
          }))
        )
    )

  return [...sharedEntries, ...scopedEntries]
}

export const buildFilterTemplate = (registry = loadRegistry()) => {
  const sharedTranslations = Object.fromEntries(
    Object.entries(registry.terms.sharedFieldValues ?? {}).map(
      ([field, values]) => [
        field,
        Object.fromEntries(values.map((value) => [value, ''])),
      ]
    )
  )

  const scopedTranslations = Object.fromEntries(
    Object.entries(registry.terms.scopedFieldValues ?? {}).map(
      ([field, valuesByItemType]) => [
        field,
        Object.fromEntries(
          Object.entries(valuesByItemType).map(([itemType, values]) => [
            itemType,
            Object.fromEntries(values.map((value) => [value, ''])),
          ])
        ),
      ]
    )
  )

  return {
    filter: sortObjectEntries({
      ...sharedTranslations,
      ...scopedTranslations,
    }),
  }
}

export const generateFilters = (registry = loadRegistry()) => {
  const sharedFieldValues = registry.terms.sharedFieldValues ?? {}
  const scopedFieldValues = registry.terms.scopedFieldValues ?? {}

  for (const lang of listLocaleCodes()) {
    const existingTranslations = loadExistingTranslations(lang)
    const translations = Object.fromEntries(
      Object.entries(sharedFieldValues).map(([field, values]) => [
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
      scopedFieldValues.category ?? {}
    )
    translations.subcategory = buildScopedTranslations(
      existingTranslations,
      'subcategory',
      scopedFieldValues.subcategory ?? {}
    )

    const outputPath = path.join(localesRoot, lang, 'filter.json')
    fs.writeFileSync(
      outputPath,
      `${JSON.stringify({ filter: translations }, null, 2)}\n`,
      'utf8'
    )
  }
}

const serializeTs = (value) => JSON.stringify(value, null, 2)

export const buildTaxonomyModuleSource = (registry = loadRegistry()) =>
  [
    `export const ITEM_SEARCH_TAXONOMY_ITEM_TYPES = ${serializeTs(registry.supportedItemTypes)} as const`,
    '',
    `export const ITEM_SEARCH_SUBCATEGORY_PARENT_BY_TYPE = ${serializeTs(
      registry.taxonomy.subcategoryParentByType ?? {}
    )} as const`,
    '',
  ].join('\n')

export const buildRegistryModuleSource = (registry = loadRegistry()) => {
  const fieldKindByName = sortObjectEntries(registry.fieldKindByName)
  const schemaKeyByItemType = sortObjectEntries(registry.schemaKeyByItemType)
  const schemaSectionsByKey = sortObjectEntries(registry.schemaSectionsByKey)
  const editableSectionsByType = sortObjectEntries(
    registry.editableSectionsByType
  )
  const fieldNamesByItemType = sortObjectEntries(registry.fieldNamesByItemType)
  const itemTypeAliasToSupported = sortObjectEntries(
    registry.itemTypeAliasToSupported
  )

  return [
    `export const ITEM_SEARCH_SUPPORTED_ITEM_TYPES = ${serializeTs(
      registry.supportedItemTypes
    )} as const`,
    '',
    `export const ITEM_SEARCH_SEARCH_NAMESPACES = ${serializeTs(
      registry.searchNamespaces
    )} as const`,
    '',
    `export const ITEM_SEARCH_REVIEW_REQUIRED_LOCALES = ${serializeTs(
      registry.reviewRequiredLocales
    )} as const`,
    '',
    `export const ITEM_SEARCH_SCOPED_FIELD_NAMES = ${serializeTs(
      registry.scopedFieldNames
    )} as const`,
    '',
    `export const ITEM_SEARCH_FIELD_KIND_BY_NAME = ${serializeTs(
      fieldKindByName
    )} as const`,
    '',
    `export const ITEM_SEARCH_ITEM_TYPE_ALIAS_TO_SUPPORTED = ${serializeTs(
      itemTypeAliasToSupported
    )} as const`,
    '',
    `export const ITEM_SEARCH_SCHEMA_KEY_BY_ITEM_TYPE = ${serializeTs(
      schemaKeyByItemType
    )} as const`,
    '',
    `export const ITEM_SEARCH_SCHEMA_SECTIONS_BY_KEY = ${serializeTs(
      schemaSectionsByKey
    )} as const`,
    '',
    `export const ITEM_SEARCH_EDITABLE_SECTIONS_BY_TYPE = ${serializeTs(
      editableSectionsByType
    )} as const`,
    '',
    `export const ITEM_SEARCH_FIELD_NAMES_BY_ITEM_TYPE = ${serializeTs(
      fieldNamesByItemType
    )} as const`,
    '',
  ].join('\n')
}

export const buildImageSearchExport = (registry = loadRegistry()) => ({
  version: registry.version,
  generatedAt: new Date().toISOString(),
  searchNamespaces: registry.searchNamespaces,
  reviewRequiredLocales: registry.reviewRequiredLocales,
  supportedItemTypes: registry.supportedItemTypes,
  itemTypeAliasToSupported: registry.itemTypeAliasToSupported,
  fieldKindByName: registry.fieldKindByName,
  schemaKeyByItemType: registry.schemaKeyByItemType,
  schemaSectionsByKey: registry.schemaSectionsByKey,
  fieldNamesByItemType: registry.fieldNamesByItemType,
  terms: registry.terms,
  taxonomy: registry.taxonomy,
})

export const writeGeneratedAssets = (registry = loadRegistry()) => {
  fs.mkdirSync(path.dirname(trackerExportPath), { recursive: true })

  fs.writeFileSync(
    attributePath,
    `${JSON.stringify(buildAttributeEntries(registry), null, 2)}\n`,
    'utf8'
  )
  fs.writeFileSync(
    taxonomyModulePath,
    buildTaxonomyModuleSource(registry),
    'utf8'
  )
  fs.writeFileSync(
    registryModulePath,
    buildRegistryModuleSource(registry),
    'utf8'
  )
  fs.writeFileSync(
    trackerExportPath,
    `${JSON.stringify(buildImageSearchExport(registry), null, 2)}\n`,
    'utf8'
  )
  generateFilters(registry)

  return {
    attributePath,
    taxonomyModulePath,
    registryModulePath,
    trackerExportPath,
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
  const result = writeGeneratedAssets()
  console.log(JSON.stringify(result, null, 2))
}
