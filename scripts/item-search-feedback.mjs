import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { buildItemAttributeRow, loadEnvFile } from './item-search-index-lib.mjs'
import { loadItemSearchRegistry } from '../data/item-search/registry.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const overridesPath = path.join(
  repoRoot,
  'data',
  'item-search',
  'generated',
  'overrides.json'
)
const supportedItemTypeSet = new Set(
  loadItemSearchRegistry().supportedItemTypes
)

const createEmptyOverrides = () => ({
  revision: 1,
  updatedAt: null,
  items: {},
})

const normalizeString = (value) =>
  typeof value === 'string' && value.trim() ? value.trim() : null

const normalizeNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const toUniqueStrings = (values) =>
  Array.from(
    new Set(
      (values ?? [])
        .filter((value) => typeof value === 'string')
        .map((value) => value.trim())
        .filter(Boolean)
    )
  )

const createDataSupabaseClient = () => {
  loadEnvFile()

  if (!process.env.SUPABASE_DATA_URL || !process.env.SUPABASE_DATA_SECRET_KEY) {
    throw new Error(
      'SUPABASE_DATA_URL and SUPABASE_DATA_SECRET_KEY must be set in the environment or .env'
    )
  }

  return createClient(
    process.env.SUPABASE_DATA_URL,
    process.env.SUPABASE_DATA_SECRET_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  )
}

const parseArgs = (argv) => {
  const args = {
    command: argv[0] ?? 'list',
    ids: [],
    status: 'open',
    minScore: null,
    itemType: null,
    limit: 50,
    output: null,
    maintainer: process.env.USERNAME || process.env.USER || 'maintainer',
  }

  for (let index = 1; index < argv.length; index += 1) {
    const arg = argv[index]
    if (!arg) continue

    if (arg === '--id') {
      const value = normalizeString(argv[index + 1])
      if (value) args.ids.push(value)
      index += 1
      continue
    }

    if (arg === '--ids') {
      const value = normalizeString(argv[index + 1])
      if (value) {
        args.ids.push(
          ...value
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean)
        )
      }
      index += 1
      continue
    }

    if (arg === '--status') {
      args.status = normalizeString(argv[index + 1]) ?? args.status
      index += 1
      continue
    }

    if (arg === '--min-score') {
      args.minScore = normalizeNumber(argv[index + 1])
      index += 1
      continue
    }

    if (arg === '--item-type') {
      args.itemType = normalizeString(argv[index + 1])
      index += 1
      continue
    }

    if (arg === '--limit') {
      const limit = normalizeNumber(argv[index + 1])
      if (limit !== null && limit > 0) {
        args.limit = Math.floor(limit)
      }
      index += 1
      continue
    }

    if (arg === '--output') {
      args.output = normalizeString(argv[index + 1])
      index += 1
      continue
    }

    if (arg === '--maintainer') {
      args.maintainer = normalizeString(argv[index + 1]) ?? args.maintainer
      index += 1
      continue
    }
  }

  args.ids = toUniqueStrings(args.ids)
  return args
}

const readOverrides = () =>
  fs.existsSync(overridesPath)
    ? JSON.parse(fs.readFileSync(overridesPath, 'utf8'))
    : createEmptyOverrides()

const writeOverrides = (payload) => {
  fs.mkdirSync(path.dirname(overridesPath), { recursive: true })
  fs.writeFileSync(
    overridesPath,
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8'
  )
}

const isRecord = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const fetchItemTypesById = async (client, itemIds) => {
  if (itemIds.length === 0) {
    return new Map()
  }

  const { data, error } = await client
    .from('items')
    .select('id,type')
    .in('id', itemIds)
  if (error) throw error

  const rows = Array.isArray(data) ? data : []
  return new Map(
    rows.flatMap((row) => {
      const itemId = normalizeNumber(row.id)
      if (itemId === null) return []
      return [[itemId, normalizeString(row.type)]]
    })
  )
}

const fetchItemAttributesById = async (client, itemIds) => {
  if (itemIds.length === 0) {
    return new Map()
  }

  const { data, error } = await client
    .from('item_attributes')
    .select('item_id,item_type,category,subcategory,metadata')
    .in('item_id', itemIds)
  if (error) throw error

  const rows = Array.isArray(data) ? data : []
  return new Map(
    rows.flatMap((row) => {
      const itemId = normalizeNumber(row.item_id)
      if (itemId === null) return []
      return [[itemId, buildItemAttributeRow(row)]]
    })
  )
}

const resolveOverrideBaseRow = ({
  itemId,
  itemType,
  existingEntry,
  currentRow,
}) => {
  const fallbackRow =
    currentRow ??
    (itemType
      ? buildItemAttributeRow({
          item_id: itemId,
          item_type: itemType,
          category: null,
          subcategory: null,
          metadata: {},
        })
      : null)

  if (!fallbackRow) {
    return null
  }

  if (isRecord(existingEntry) && 'item_id' in existingEntry) {
    return buildItemAttributeRow({
      ...existingEntry,
      item_id: itemId,
      item_type: itemType ?? existingEntry.item_type ?? fallbackRow.item_type,
    })
  }

  const legacyMetadata = isRecord(existingEntry?.metadata)
    ? existingEntry.metadata
    : null

  if (!legacyMetadata) {
    return fallbackRow
  }

  return buildItemAttributeRow({
    ...fallbackRow,
    metadata: {
      ...(fallbackRow.metadata ?? {}),
      ...legacyMetadata,
    },
  })
}

const fetchSuggestions = async (client, ids) => {
  let query = client.from('feedback_queue').select('*')

  if (ids.length > 0) {
    query = query.in('id', ids)
  }

  const { data, error } = await query
  if (error) throw error
  return Array.isArray(data) ? data : []
}

export const listFeedbackSuggestionsForMaintainer = async ({
  ids = [],
  status = 'open',
  minScore = null,
  itemType = null,
  limit = 50,
} = {}) => {
  const client = createDataSupabaseClient()
  const rows = await fetchSuggestions(client, ids)
  const itemTypeById = await fetchItemTypesById(
    client,
    rows
      .map((row) => normalizeNumber(row.entity_id))
      .filter((value) => value !== null)
  )

  return rows
    .map((row) => ({
      ...row,
      item_type: itemTypeById.get(normalizeNumber(row.entity_id)) ?? null,
    }))
    .filter((row) => !row.item_type || supportedItemTypeSet.has(row.item_type))
    .filter((row) => !status || row.status === status)
    .filter((row) => minScore === null || Number(row.score ?? 0) >= minScore)
    .filter((row) => !itemType || row.item_type === itemType)
    .sort((left, right) => Number(right.score ?? 0) - Number(left.score ?? 0))
    .slice(0, limit)
}

export const promoteFeedbackSuggestions = async ({ ids, maintainer }) => {
  const client = createDataSupabaseClient()
  const suggestions = await listFeedbackSuggestionsForMaintainer({
    ids,
    status: '',
    limit: ids.length || 50,
  })

  if (suggestions.length === 0) {
    return {
      ids: [],
      itemIds: [],
      overrideRevision: null,
    }
  }

  const suggestionItemIds = suggestions
    .map((suggestion) => normalizeNumber(suggestion.entity_id))
    .filter((value) => value !== null)
  const itemTypeById = await fetchItemTypesById(client, suggestionItemIds)
  const itemAttributesById = await fetchItemAttributesById(
    client,
    suggestionItemIds
  )

  const overrides = readOverrides()
  const nextItems = { ...(overrides.items ?? {}) }
  const now = new Date().toISOString()
  const touchedItemIds = []

  for (const suggestion of suggestions) {
    const itemId = normalizeNumber(suggestion.entity_id)
    if (suggestion.entity_type !== 'item' || itemId === null) {
      continue
    }

    touchedItemIds.push(itemId)
    const existingEntry =
      typeof nextItems[itemId] === 'object' && nextItems[itemId] !== null
        ? nextItems[itemId]
        : {}
    const baseRow = resolveOverrideBaseRow({
      itemId,
      itemType: itemTypeById.get(itemId) ?? null,
      existingEntry,
      currentRow: itemAttributesById.get(itemId) ?? null,
    })
    if (!baseRow) {
      continue
    }
    const proposedPatch = isRecord(suggestion.proposed_patch)
      ? suggestion.proposed_patch
      : {}
    const existingAudit = isRecord(existingEntry.audit)
      ? existingEntry.audit
      : {}
    const metadataPatch = Object.fromEntries(
      Object.entries(proposedPatch).filter(
        ([field]) =>
          field !== 'item_id' &&
          field !== 'item_type' &&
          field !== 'slot' &&
          field !== 'category' &&
          field !== 'subcategory'
      )
    )
    const nextRow = buildItemAttributeRow({
      item_id: baseRow.item_id,
      item_type: baseRow.item_type,
      category: proposedPatch.category ?? baseRow.category,
      subcategory: proposedPatch.subcategory ?? baseRow.subcategory,
      metadata: {
        ...(baseRow.metadata ?? {}),
        ...metadataPatch,
      },
    })

    nextItems[itemId] = {
      ...nextRow,
      audit: {
        ...existingAudit,
        maintainer,
        acceptedAt: now,
        acceptedBy: maintainer,
        feedbackSuggestionIds: toUniqueStrings([
          ...(existingAudit.feedbackSuggestionIds ?? []),
          suggestion.id,
        ]),
      },
    }
  }

  const nextRevision = Number(overrides.revision ?? 0) + 1
  writeOverrides({
    ...overrides,
    revision: nextRevision,
    updatedAt: now,
    items: nextItems,
  })

  const promotedIds = suggestions
    .map((suggestion) => suggestion.id)
    .filter(Boolean)
  if (promotedIds.length > 0) {
    const { error } = await client
      .from('feedback_suggestions')
      .update({
        status: 'accepted',
        updated_at: now,
      })
      .in('id', promotedIds)
    if (error) throw error
  }

  return {
    ids: promotedIds,
    itemIds: Array.from(new Set(touchedItemIds)).sort(
      (left, right) => left - right
    ),
    overrideRevision: nextRevision,
  }
}

export const rejectFeedbackSuggestions = async ({ ids }) => {
  const client = createDataSupabaseClient()
  if (ids.length === 0) {
    return { ids: [] }
  }

  const now = new Date().toISOString()
  const { error } = await client
    .from('feedback_suggestions')
    .update({
      status: 'rejected',
      updated_at: now,
    })
    .in('id', ids)
  if (error) throw error

  return { ids }
}

export const markFeedbackSuggestionsApplied = async ({ ids }) => {
  const client = createDataSupabaseClient()
  if (ids.length === 0) {
    return { ids: [] }
  }

  const now = new Date().toISOString()
  const { error } = await client
    .from('feedback_suggestions')
    .update({
      status: 'applied',
      updated_at: now,
    })
    .in('id', ids)
  if (error) throw error

  return { ids }
}

const isDirectRun = () => {
  const entryPath = process.argv[1]
  if (!entryPath) {
    return false
  }

  return import.meta.url === pathToFileURL(path.resolve(entryPath)).href
}

if (isDirectRun()) {
  const args = parseArgs(process.argv.slice(2))

  let result
  if (args.command === 'promote') {
    result = await promoteFeedbackSuggestions({
      ids: args.ids,
      maintainer: args.maintainer,
    })
  } else if (args.command === 'reject') {
    result = await rejectFeedbackSuggestions({
      ids: args.ids,
      maintainer: args.maintainer,
    })
  } else if (args.command === 'mark-applied') {
    result = await markFeedbackSuggestionsApplied({
      ids: args.ids,
    })
  } else {
    result = await listFeedbackSuggestionsForMaintainer({
      ids: args.ids,
      status: args.status,
      minScore: args.minScore,
      itemType: args.itemType,
      limit: args.limit,
    })
  }

  if (args.output) {
    const outputPath = path.resolve(repoRoot, args.output)
    fs.mkdirSync(path.dirname(outputPath), { recursive: true })
    fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8')
  } else {
    console.log(JSON.stringify(result, null, 2))
  }
}
