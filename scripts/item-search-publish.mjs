import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  buildItemAttributeRow,
  loadEnvFile,
  refreshItemSearchLocalCopy,
  syncItemIndexToPinecone,
  syncItemIndexToSupabase,
} from './item-search-index-lib.mjs'
import {
  markFeedbackSuggestionsApplied,
  promoteFeedbackSuggestions,
} from './item-search-feedback.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const defaultOutputRoot = path.join(
  repoRoot,
  '..',
  'gongeo.us-image-search',
  'index'
)
const publishReportsRoot = path.join(
  repoRoot,
  'data',
  'item-search',
  'generated',
  'reports',
  'publish'
)
const overridesPath = path.join(
  repoRoot,
  'data',
  'item-search',
  'generated',
  'overrides.json'
)

const validScopes = new Set([
  'full',
  'types',
  'item-ids',
  'refresh-only',
  'locales-only',
  'feedback-selected',
])

const normalizeString = (value) =>
  typeof value === 'string' && value.trim() ? value.trim() : null

const normalizeNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.floor(parsed) : null
}

const uniqueStrings = (values) =>
  Array.from(
    new Set(
      (values ?? [])
        .filter((value) => typeof value === 'string')
        .map((value) => value.trim())
        .filter(Boolean)
    )
  )

const uniqueNumbers = (values) =>
  Array.from(
    new Set(
      (values ?? [])
        .map((value) => normalizeNumber(value))
        .filter((value) => value !== null)
    )
  ).sort((left, right) => left - right)

const parseArgs = (argv) => {
  const args = {
    scope: 'full',
    types: [],
    itemIds: [],
    namespaces: [],
    feedbackIds: [],
    maintainer: process.env.USERNAME || process.env.USER || 'maintainer',
    outputRoot: defaultOutputRoot,
    itemAttributesPath: null,
    overridesOnly: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (!arg) continue

    if (arg === '--scope') {
      args.scope = normalizeString(argv[index + 1]) ?? args.scope
      index += 1
      continue
    }

    if (arg === '--type') {
      const value = normalizeString(argv[index + 1])
      if (value) args.types.push(value)
      index += 1
      continue
    }

    if (arg === '--item-id') {
      const value = normalizeNumber(argv[index + 1])
      if (value !== null) args.itemIds.push(value)
      index += 1
      continue
    }

    if (arg === '--namespace') {
      const value = normalizeString(argv[index + 1])
      if (value) args.namespaces.push(value)
      index += 1
      continue
    }

    if (arg === '--feedback-id') {
      const value = normalizeString(argv[index + 1])
      if (value) args.feedbackIds.push(value)
      index += 1
      continue
    }

    if (arg === '--maintainer') {
      args.maintainer = normalizeString(argv[index + 1]) ?? args.maintainer
      index += 1
      continue
    }

    if (arg === '--output-root') {
      args.outputRoot = path.resolve(repoRoot, argv[index + 1])
      index += 1
      continue
    }

    if (arg === '--item-attributes-path') {
      args.itemAttributesPath = path.resolve(repoRoot, argv[index + 1])
      index += 1
      continue
    }

    if (arg === '--overrides-only') {
      args.overridesOnly = true
    }
  }

  args.types = uniqueStrings(args.types)
  args.itemIds = uniqueNumbers(args.itemIds)
  args.namespaces = uniqueStrings(args.namespaces)
  args.feedbackIds = uniqueStrings(args.feedbackIds)
  return args
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

const createEmptyOverrides = () => ({
  revision: 1,
  updatedAt: null,
  items: {},
})

const writeJsonLines = (filePath, rows) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(
    filePath,
    rows
      .map((row) => JSON.stringify(row))
      .join('\n')
      .concat(rows.length > 0 ? '\n' : ''),
    'utf8'
  )
}

const loadOverrideItemAttributeRows = (itemIds) => {
  const overrides = fs.existsSync(overridesPath)
    ? JSON.parse(fs.readFileSync(overridesPath, 'utf8'))
    : createEmptyOverrides()
  const items = isRecord(overrides?.items) ? overrides.items : {}

  return itemIds.map((itemId) => {
    const entry = items[String(itemId)]
    if (!isRecord(entry)) {
      throw new Error(
        `No canonical override row found for item ${itemId}. Approve the feedback first or add the item to data/item-search/generated/overrides.json.`
      )
    }

    return buildItemAttributeRow(entry)
  })
}

const stageOverrideItemAttributes = ({ itemIds, scope }) => {
  const rows = loadOverrideItemAttributeRows(itemIds)
  const stageRoot = path.join(publishReportsRoot, 'staging')
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const itemAttributesPath = path.join(
    stageRoot,
    `item-attributes-${scope}-${stamp}.jsonl`
  )

  writeJsonLines(itemAttributesPath, rows)
  return itemAttributesPath
}

const resolveItemAttributesPath = ({ itemAttributesPath, outputRoot }) =>
  path.resolve(
    itemAttributesPath ?? path.join(outputRoot, 'item-attributes.jsonl')
  )

const assertItemAttributesPathExists = (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Canonical item-attributes output not found at ${filePath}. Run the Python image-search pipeline separately first, or pass --item-attributes-path to an existing JSONL file.`
    )
  }
}

const readItemAttributesSummary = (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Canonical item-attributes output not found: ${filePath}`)
  }

  const rows = parseJsonLines(filePath)
  const itemIds = uniqueNumbers(rows.map((row) => row.item_id))

  return {
    rowCount: rows.length,
    itemIds,
  }
}

const writePublishReport = (report) => {
  fs.mkdirSync(publishReportsRoot, { recursive: true })
  const reportPath = path.join(publishReportsRoot, `${report.publishId}.json`)
  const latestPath = path.join(publishReportsRoot, 'latest.json')
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  fs.writeFileSync(latestPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  return reportPath
}

export const runItemSearchPublish = async (argv = process.argv.slice(2)) => {
  loadEnvFile()
  const args = parseArgs(argv)

  if (!validScopes.has(args.scope)) {
    throw new Error(
      `Unsupported scope '${args.scope}'. Expected one of: ${Array.from(validScopes).join(', ')}`
    )
  }

  if (
    args.overridesOnly &&
    args.scope !== 'item-ids' &&
    args.scope !== 'feedback-selected'
  ) {
    throw new Error(
      '--overrides-only is only supported for item-ids and feedback-selected scopes'
    )
  }

  let effectiveScope = args.scope
  let effectiveItemIds = [...args.itemIds]
  const promotedFeedback =
    effectiveScope === 'feedback-selected'
      ? await promoteFeedbackSuggestions({
          ids: args.feedbackIds,
          maintainer: args.maintainer,
        })
      : { ids: [], itemIds: [], overrideRevision: null }

  if (effectiveScope === 'feedback-selected') {
    effectiveItemIds = uniqueNumbers([
      ...effectiveItemIds,
      ...promotedFeedback.itemIds,
    ])
  }

  if (
    (effectiveScope === 'item-ids' || effectiveScope === 'feedback-selected') &&
    effectiveItemIds.length === 0
  ) {
    throw new Error(`${effectiveScope} scope requires at least one item id`)
  }

  if (effectiveScope === 'types' && args.types.length === 0) {
    throw new Error('types scope requires at least one --type value')
  }

  const shouldSyncFromOverrides =
    args.overridesOnly || effectiveScope === 'feedback-selected'

  let itemAttributesPath = resolveItemAttributesPath(args)
  let itemAttributesSource = {
    mode: 'external-item-attributes',
    path: itemAttributesPath,
  }

  if (shouldSyncFromOverrides) {
    itemAttributesPath = stageOverrideItemAttributes({
      itemIds: effectiveItemIds,
      scope: effectiveScope,
    })
    itemAttributesSource = {
      mode: 'staged-overrides',
      path: itemAttributesPath,
    }
  } else if (effectiveScope !== 'locales-only') {
    assertItemAttributesPathExists(itemAttributesPath)
  }

  let localCopyResult =
    effectiveScope === 'locales-only'
      ? await refreshItemSearchLocalCopy()
      : null

  if (localCopyResult?.item_attributes_path) {
    itemAttributesPath = localCopyResult.item_attributes_path
    itemAttributesSource = {
      mode: 'local-copy',
      path: itemAttributesPath,
    }
  }

  const finalSummary = readItemAttributesSummary(itemAttributesPath)

  const supabaseResult =
    effectiveScope === 'locales-only'
      ? null
      : await syncItemIndexToSupabase([
          '--item-attributes-path',
          itemAttributesPath,
          '--overwrite',
        ])

  const namespaces = args.namespaces.length > 0 ? args.namespaces : ['en', 'zh']
  const pineconeResult = {}
  for (const namespace of namespaces) {
    pineconeResult[namespace] = await syncItemIndexToPinecone([
      '--item-attributes-path',
      itemAttributesPath,
      '--overwrite',
      '--namespace',
      namespace,
    ])
  }

  if (!localCopyResult) {
    localCopyResult = await refreshItemSearchLocalCopy()
  }

  const publishId = `publish-${new Date().toISOString().replace(/[:.]/g, '-')}`
  const report = {
    publishId,
    scope: args.scope,
    effectiveScope,
    maintainer: args.maintainer,
    requestedTypes: args.types,
    requestedItemIds: args.itemIds,
    touchedItemIds: finalSummary.itemIds,
    finalRowCount: finalSummary.rowCount,
    supabase: supabaseResult,
    pinecone: pineconeResult,
    localCopy: localCopyResult,
    feedback: promotedFeedback,
    itemAttributesSource,
    overridesOnly: shouldSyncFromOverrides,
    failedItems: [],
  }
  const reportPath = writePublishReport(report)

  if (promotedFeedback.ids.length > 0) {
    await markFeedbackSuggestionsApplied({
      ids: promotedFeedback.ids,
    })
  }

  return {
    reportPath,
    ...report,
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
  const result = await runItemSearchPublish(process.argv.slice(2))
  console.log(JSON.stringify(result, null, 2))
}
