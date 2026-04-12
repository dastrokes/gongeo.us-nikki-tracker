import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import prettier from 'prettier'
import { loadItemSearchRegistry } from '../data/item-search/registry.mjs'
import {
  buildAttributeEntries,
  buildImageSearchExport,
  buildRegistryModuleSource,
  buildTaxonomyModuleSource,
} from './item-search-registry-lib.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const termsPath = path.join(repoRoot, 'data', 'item-search', 'terms.json')
const taxonomyPath = path.join(repoRoot, 'data', 'item-search', 'taxonomy.json')
const defaultItemAttributesPath = path.join(
  repoRoot,
  'data',
  'item-search',
  'generated',
  'supabase',
  'item-attributes.jsonl'
)
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
const englishFilterPath = path.join(
  repoRoot,
  'app',
  'locales',
  'en',
  'filter.json'
)

const normalizeString = (value) =>
  typeof value === 'string' && value.trim() ? value.trim() : null

const parseArgs = (argv) => {
  const args = {
    itemAttributesPath: defaultItemAttributesPath,
    dryRun: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (!arg) continue

    if (arg === '--item-attributes-path') {
      args.itemAttributesPath = path.resolve(
        repoRoot,
        normalizeString(argv[index + 1]) ?? ''
      )
      index += 1
      continue
    }

    if (arg === '--dry-run') {
      args.dryRun = true
      continue
    }

    if (arg === '--help' || arg === '-h') {
      args.help = true
    }
  }

  return args
}

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'))

const writeGeneratedJson = (filePath, value) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

const writeSourceJson = async (filePath, value) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  const config = await prettier.resolveConfig(filePath)
  const formatted = await prettier.format(`${JSON.stringify(value)}\n`, {
    ...(config ?? {}),
    filepath: filePath,
    parser: 'json',
  })
  fs.writeFileSync(filePath, formatted, 'utf8')
}

const formatAndWriteTs = async (filePath, source) => {
  const config = await prettier.resolveConfig(filePath)
  const formatted = await prettier.format(source, {
    ...(config ?? {}),
    filepath: filePath,
  })
  fs.writeFileSync(filePath, formatted, 'utf8')
}

const parseJsonLines = (filePath) =>
  fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line))

const isRecord = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const normalizeTokenKey = (value) =>
  typeof value === 'string'
    ? value
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, '_')
    : ''

const sortStrings = (values) =>
  [...values].sort((left, right) =>
    left.localeCompare(right, undefined, {
      sensitivity: 'base',
      numeric: true,
    })
  )

const ensureTermValue = (terms, field, itemType, value, summary) => {
  if (!value) return

  if (itemType) {
    const valuesByItemType = (terms.scopedFieldValues[field] ??= {})
    const values = (valuesByItemType[itemType] ??= [])
    if (!values.includes(value)) {
      values.push(value)
      valuesByItemType[itemType] = sortStrings(values)
      ;((summary.scoped[field] ??= {})[itemType] ??= []).push(value)
    }
    return
  }

  const values = (terms.sharedFieldValues[field] ??= [])
  if (!values.includes(value)) {
    values.push(value)
    terms.sharedFieldValues[field] = sortStrings(values)
    ;(summary.shared[field] ??= []).push(value)
  }
}

const ensureTaxonomyParent = ({
  taxonomy,
  itemType,
  subcategory,
  category,
  summary,
}) => {
  if (!subcategory || !category) {
    if (subcategory) {
      summary.ungroupedSubcategories.push(`${itemType}.${subcategory}`)
    }
    return
  }

  taxonomy.subcategoryParentByType ??= {}
  const parentMap = (taxonomy.subcategoryParentByType[itemType] ??= {})
  const existingParent = parentMap[subcategory]
  if (existingParent && existingParent !== category) {
    summary.parentConflicts.push({
      itemType,
      subcategory,
      existingParent,
      observedParent: category,
    })
    return
  }

  if (!existingParent) {
    parentMap[subcategory] = category
    taxonomy.subcategoryParentByType[itemType] = Object.fromEntries(
      Object.entries(parentMap).sort(([left], [right]) =>
        left.localeCompare(right)
      )
    )
    ;(summary.taxonomy[itemType] ??= {})[subcategory] = category
  }
}

const titleCaseToken = (value) =>
  value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const loadExistingEnglishTranslations = () => {
  if (!fs.existsSync(englishFilterPath)) return {}

  try {
    return readJson(englishFilterPath).filter ?? {}
  } catch {
    return {}
  }
}

const buildEnglishFilterMessages = (registry) => {
  const existingTranslations = loadExistingEnglishTranslations()
  const sharedFieldValues = registry.terms.sharedFieldValues ?? {}
  const scopedFieldValues = registry.terms.scopedFieldValues ?? {}
  const translations = Object.fromEntries(
    Object.entries(sharedFieldValues).map(([field, values]) => [
      field,
      Object.fromEntries(
        values.map((value) => [
          value,
          existingTranslations?.[field]?.[value] ??
            existingTranslations?.[`${field}_by_item_type`]?.[value] ??
            titleCaseToken(value),
        ])
      ),
    ])
  )

  for (const field of ['category', 'subcategory']) {
    translations[field] = Object.fromEntries(
      Object.entries(scopedFieldValues[field] ?? {}).map(
        ([itemType, values]) => [
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
        ]
      )
    )
  }

  return { filter: translations }
}

const collectAndApplyTerms = ({ terms, taxonomy, rows, registry }) => {
  const summary = {
    shared: {},
    scoped: {},
    taxonomy: {},
    parentConflicts: [],
    ungroupedSubcategories: [],
  }
  const sharedFields = Object.keys(terms.sharedFieldValues ?? {})
  const normalizeItemType = (value) =>
    registry.normalizeItemType(normalizeString(value) ?? '') || 'unknown'

  for (const row of rows) {
    if (!isRecord(row)) continue

    const metadata = isRecord(row.metadata) ? row.metadata : {}
    const itemType = normalizeItemType(
      row.item_type ?? metadata.item_type ?? metadata.slot
    )
    const category = normalizeTokenKey(row.category ?? metadata.category)
    const subcategory = normalizeTokenKey(
      row.subcategory ?? metadata.subcategory
    )

    if (category) {
      ensureTermValue(terms, 'category', itemType, category, summary)
    }
    if (subcategory) {
      ensureTermValue(terms, 'subcategory', itemType, subcategory, summary)
      ensureTaxonomyParent({
        taxonomy,
        itemType,
        subcategory,
        category,
        summary,
      })
    }

    for (const field of sharedFields) {
      const value = metadata[field]
      const values = Array.isArray(value) ? value : [value]
      for (const entry of values) {
        const normalized = normalizeTokenKey(entry)
        if (normalized) {
          ensureTermValue(terms, field, null, normalized, summary)
        }
      }
    }
  }

  summary.ungroupedSubcategories = sortStrings([
    ...new Set(summary.ungroupedSubcategories),
  ])
  summary.parentConflicts = Array.from(
    new Map(
      summary.parentConflicts.map((conflict) => [
        `${conflict.itemType}.${conflict.subcategory}:${conflict.existingParent}->${conflict.observedParent}`,
        conflict,
      ])
    ).values()
  )
  return summary
}

const writeGeneratedAssets = async (registry) => {
  writeGeneratedJson(attributePath, buildAttributeEntries(registry))
  await formatAndWriteTs(
    registryModulePath,
    buildRegistryModuleSource(registry)
  )
  await formatAndWriteTs(
    taxonomyModulePath,
    buildTaxonomyModuleSource(registry)
  )
  writeGeneratedJson(trackerExportPath, buildImageSearchExport(registry))
  writeGeneratedJson(englishFilterPath, buildEnglishFilterMessages(registry))

  return {
    attributePath,
    registryModulePath,
    taxonomyModulePath,
    trackerExportPath,
    englishFilterPath,
  }
}

export const syncItemSearchTermsFromAttributes = async (
  argv = process.argv.slice(2)
) => {
  const args = parseArgs(argv)
  if (args.help) {
    return {
      usage:
        'node scripts/sync-item-search-terms-from-attributes.mjs [--item-attributes-path <path>] [--dry-run]',
    }
  }

  if (!fs.existsSync(args.itemAttributesPath)) {
    throw new Error(
      `Item attributes file not found: ${args.itemAttributesPath}`
    )
  }

  const terms = readJson(termsPath)
  const taxonomy = readJson(taxonomyPath)
  const registry = loadItemSearchRegistry()
  const rows = parseJsonLines(args.itemAttributesPath)
  const summary = collectAndApplyTerms({
    terms,
    taxonomy,
    rows,
    registry,
  })

  if (args.dryRun) {
    return {
      dryRun: true,
      itemAttributesPath: args.itemAttributesPath,
      rows: rows.length,
      ...summary,
    }
  }

  await writeSourceJson(termsPath, terms)
  writeGeneratedJson(taxonomyPath, taxonomy)

  const updatedRegistry = loadItemSearchRegistry()
  const outputs = await writeGeneratedAssets(updatedRegistry)

  return {
    dryRun: false,
    itemAttributesPath: args.itemAttributesPath,
    rows: rows.length,
    outputs,
    ...summary,
  }
}

const isDirectRun = () => {
  const entryPath = process.argv[1]
  if (!entryPath) return false
  return import.meta.url === pathToFileURL(path.resolve(entryPath)).href
}

if (isDirectRun()) {
  const result = await syncItemSearchTermsFromAttributes(process.argv.slice(2))
  console.log(JSON.stringify(result, null, 2))
}
