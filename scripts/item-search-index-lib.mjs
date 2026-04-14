import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { loadItemSearchRegistry } from '../data/item-search/registry.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const envPath = path.join(repoRoot, '.env')
const defaultItemAttributesPath = path.resolve(
  repoRoot,
  '..',
  'gongeo.us-image-search',
  'index',
  'item-attributes.jsonl'
)
const defaultLocalCopyRoot = path.resolve(
  repoRoot,
  'data',
  'item-search',
  'generated',
  'supabase'
)
const itemSearchRegistry = loadItemSearchRegistry()
const DEFAULT_EXPORT_PAGE_SIZE = 1000

export const SEARCH_NAMESPACE_CONFIG = itemSearchRegistry.searchNamespaces.map(
  (namespace) => ({ namespace })
)

const localesRoot = path.join(repoRoot, 'app', 'locales')
const searchLocaleCache = new Map()
const ARRAY_FIELDS = Object.entries(itemSearchRegistry.fieldKindByName)
  .filter(([, kind]) => kind === 'array')
  .map(([field]) => field)
const SCALAR_FIELDS = Object.entries(itemSearchRegistry.fieldKindByName)
  .filter(
    ([field, kind]) =>
      kind === 'scalar' && field !== 'category' && field !== 'subcategory'
  )
  .map(([field]) => field)
const SEARCH_DOCUMENT_VALUE_EXCLUDED_FIELDS = new Set([
  'category',
  'subcategory',
  'placement',
  'primary_color',
  'secondary_color',
  'ornament',
])
const LOCAL_COPY_FIELD_ORDER_BY_ITEM_TYPE = {
  hair: [
    'category',
    'subcategory',
    'hair_length',
    'haircut',
    'texture',
    'bangs',
  ],
  dresses: [
    'category',
    'subcategory',
    'bottom_length',
    'dress_silhouette',
    'fit',
    'waistline',
    'neckline',
    'collar_style',
    'shoulder_style',
    'sleeve_length',
    'sleeve_style',
    'pattern',
    'material',
    'structure',
    'ornament',
    'garment_feature',
  ],
  outerwear: [
    'category',
    'subcategory',
    'top_length',
    'fit',
    'neckline',
    'collar_style',
    'shoulder_style',
    'sleeve_length',
    'sleeve_style',
    'pattern',
    'material',
    'structure',
    'ornament',
    'garment_feature',
  ],
  tops: [
    'category',
    'subcategory',
    'top_length',
    'fit',
    'neckline',
    'collar_style',
    'shoulder_style',
    'sleeve_length',
    'sleeve_style',
    'pattern',
    'material',
    'structure',
    'ornament',
    'garment_feature',
  ],
  bottoms: [
    'category',
    'subcategory',
    'bottom_length',
    'skirt_silhouette',
    'pant_shape',
    'waist_height',
    'pattern',
    'material',
    'structure',
    'ornament',
    'garment_feature',
  ],
  socks: [
    'category',
    'subcategory',
    'sock_height',
    'pattern',
    'material',
    'structure',
    'ornament',
  ],
  shoes: [
    'category',
    'subcategory',
    'heel_type',
    'heel_height',
    'sole_height',
    'shaft_height',
    'pattern',
    'material',
    'structure',
    'ornament',
  ],
}
const ACCESSORY_LOCAL_COPY_FIELDS = [
  'category',
  'subcategory',
  'pattern',
  'material',
  'structure',
  'ornament',
]

export const loadEnvFile = (filePath = envPath) => {
  if (!fs.existsSync(filePath)) return

  const raw = fs.readFileSync(filePath, 'utf8')

  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue

    const eq = line.indexOf('=')
    if (eq === -1) continue

    const key = line.slice(0, eq).trim()
    const value = line.slice(eq + 1).trim()

    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

export const parseArgs = (argv) => {
  // Shared CLI flags for both sync entrypoints:
  // --item-attributes-path <path> selects the canonical JSONL source
  // --batch-size <n> controls write batch size
  // --overwrite forces existing records to be updated instead of skipped
  // --namespace <en|zh> applies to Pinecone sync flows
  const args = {
    itemAttributesPath: defaultItemAttributesPath,
    replaceTypes: false,
    batchSize: 250,
    namespace: null,
    overwrite: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (!arg) continue

    if (arg === '--item-attributes-path' || arg === '--documents-path') {
      args.itemAttributesPath = argv[index + 1]
      index += 1
      continue
    }

    if (arg === '--batch-size') {
      const parsed = Number(argv[index + 1])
      if (Number.isFinite(parsed) && parsed > 0) {
        args.batchSize = Math.floor(parsed)
      }
      index += 1
      continue
    }

    if (arg === '--replace-types') {
      args.replaceTypes = true
    }

    if (arg === '--namespace') {
      args.namespace = argv[index + 1]?.trim() || null
      index += 1
    }

    if (arg === '--overwrite') {
      args.overwrite = true
    }
  }

  return args
}

const normalizeItemType = (value) => {
  if (typeof value !== 'string') return 'unknown'
  if (value === 'abilityHandhelds') return 'handhelds'
  return value.trim() || 'unknown'
}

const normalizeTokenKey = (value) => {
  if (typeof value !== 'string') return ''
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
}

const normalizeStringArray = (value) => {
  if (!Array.isArray(value)) return []

  return Array.from(
    new Set(
      value
        .filter((entry) => typeof entry === 'string')
        .map((entry) => entry.trim())
        .filter(Boolean)
    )
  )
}

const normalizeNullableString = (value) => {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

const normalizeSearchDataValue = (value) =>
  typeof value === 'string' ? value.trim().toLowerCase() : ''

const toUniqueValues = (values) =>
  Array.from(new Set(values.map(normalizeSearchDataValue).filter(Boolean)))

const readLocaleJson = (namespace, fileName) =>
  JSON.parse(
    fs.readFileSync(path.join(localesRoot, namespace, fileName), 'utf8')
  )

const getSearchLocaleResources = (namespace) => {
  if (searchLocaleCache.has(namespace)) {
    return searchLocaleCache.get(namespace)
  }

  const resources = {
    filter: readLocaleJson(namespace, 'filter.json'),
    misc: readLocaleJson(namespace, 'misc.json'),
  }

  searchLocaleCache.set(namespace, resources)
  return resources
}

const titleCaseWord = (value) =>
  value.length > 0 ? value[0].toUpperCase() + value.slice(1) : value

const humanizeToken = (value) => {
  if (typeof value !== 'string') return ''

  return value.split('_').filter(Boolean).map(titleCaseWord).join(' ')
}

const getNestedValue = (value, pathSegments) => {
  let current = value

  for (const segment of pathSegments) {
    if (!current || typeof current !== 'object') {
      return null
    }
    current = current[segment]
  }

  return typeof current === 'string' ? current : null
}

const getLocalizedItemType = (namespace, itemType) => {
  const localized =
    getNestedValue(getSearchLocaleResources(namespace).misc, [
      `type.${itemType}`,
    ]) ??
    getNestedValue(getSearchLocaleResources('en').misc, [`type.${itemType}`])

  return localized ?? humanizeToken(itemType)
}

const getLocalizedFieldValue = (namespace, itemType, field, value) => {
  const namespaceResources = getSearchLocaleResources(namespace)
  const englishResources = getSearchLocaleResources('en')

  const localized =
    (field === 'category' || field === 'subcategory'
      ? getNestedValue(namespaceResources.filter, [
          'filter',
          field,
          itemType,
          value,
        ])
      : getNestedValue(namespaceResources.filter, ['filter', field, value])) ??
    (field === 'category' || field === 'subcategory'
      ? getNestedValue(englishResources.filter, [
          'filter',
          field,
          itemType,
          value,
        ])
      : getNestedValue(englishResources.filter, ['filter', field, value]))

  return localized ?? humanizeToken(value)
}

const getMetadataFieldValues = (metadata, field) => {
  if (
    field === 'category' ||
    field === 'subcategory' ||
    SCALAR_FIELDS.includes(field)
  ) {
    const value = metadata[field]
    return typeof value === 'string' ? [value] : []
  }

  if (ARRAY_FIELDS.includes(field)) {
    return Array.isArray(metadata[field]) ? toUniqueValues(metadata[field]) : []
  }

  return []
}

const buildLocalizedSearchText = (metadata, namespace) => {
  const itemType =
    typeof metadata.item_type === 'string' ? metadata.item_type : ''
  const terms = [getLocalizedItemType(namespace, itemType)]

  for (const field of [
    'category',
    'subcategory',
    ...SCALAR_FIELDS,
    ...ARRAY_FIELDS,
  ]) {
    terms.push(
      ...getMetadataFieldValues(metadata, field).map((value) =>
        getLocalizedFieldValue(namespace, itemType, field, value)
      )
    )
  }

  return toUniqueValues(terms).join(' ')
}

export const parseJsonLines = (filePath) => {
  const raw = fs.readFileSync(filePath, 'utf8')

  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line))
}

export const chunkArray = (values, chunkSize) => {
  const chunks = []

  for (let index = 0; index < values.length; index += chunkSize) {
    chunks.push(values.slice(index, index + chunkSize))
  }

  return chunks
}

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

const hasStructuredValue = (value) => {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value).length > 0
  return true
}

const normalizeSearchTextValue = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()

const dedupeSearchTerms = (values) => {
  const deduped = []
  const seen = new Set()

  values.forEach((value) => {
    const normalized = normalizeSearchTextValue(value)
    if (!normalized || seen.has(normalized)) {
      return
    }

    seen.add(normalized)
    deduped.push(normalized)
  })

  return deduped
}

const flattenSearchValues = (value) => {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => flattenSearchValues(entry))
  }

  if (value && typeof value === 'object') {
    return Object.values(value).flatMap((entry) => flattenSearchValues(entry))
  }

  const normalized = normalizeSearchTextValue(value)
  return normalized ? [normalized] : []
}

const isRecord = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const getStructuredFieldOrder = (itemType) =>
  LOCAL_COPY_FIELD_ORDER_BY_ITEM_TYPE[normalizeItemType(itemType)] ??
  ACCESSORY_LOCAL_COPY_FIELDS

const getMetadataFieldOrder = (itemType) =>
  (
    itemSearchRegistry.fieldNamesByItemType?.[normalizeItemType(itemType)] ??
    getStructuredFieldOrder(itemType)
  ).filter((field) => field !== 'category' && field !== 'subcategory')

const normalizeCanonicalMetadata = (metadataValue, itemType) => {
  const metadata = isRecord(metadataValue) ? metadataValue : {}
  const normalizedMetadata = {}

  getMetadataFieldOrder(itemType).forEach((field) => {
    const fieldKind = itemSearchRegistry.fieldKindByName[field]
    if (fieldKind === 'array') {
      const normalized = normalizeStringArray(metadata[field]).map(
        normalizeTokenKey
      )
      if (normalized.length > 0) {
        normalizedMetadata[field] = normalized
      }
      return
    }

    const normalized = normalizeNullableString(metadata[field])
    if (normalized) {
      normalizedMetadata[field] = normalizeTokenKey(normalized)
    }
  })

  return normalizedMetadata
}

const buildStructuredDataFromMetadata = (metadata, itemType) => {
  const structuredData = {}

  getStructuredFieldOrder(itemType).forEach((field) => {
    const fieldKind = itemSearchRegistry.fieldKindByName[field]
    if (fieldKind === 'array') {
      structuredData[field] = normalizeStringArray(metadata[field]).map(
        normalizeTokenKey
      )
      return
    }

    const normalized = normalizeNullableString(metadata[field])
    structuredData[field] = normalized ? normalizeTokenKey(normalized) : null
  })

  return structuredData
}

const normalizeItemAttributeRow = (row) => {
  const metadata = isRecord(row?.metadata) ? row.metadata : {}
  const itemId = Number(row?.item_id ?? metadata.item_id)

  if (!Number.isFinite(itemId)) {
    throw new Error(`Invalid item id in row ${JSON.stringify(row)}`)
  }

  const itemType = normalizeItemType(
    row?.item_type ?? metadata.item_type ?? metadata.slot
  )
  const category = normalizeNullableString(row?.category ?? metadata.category)
  const subcategory = normalizeNullableString(
    row?.subcategory ?? metadata.subcategory
  )

  return {
    item_id: itemId,
    item_type: itemType,
    category: category ? normalizeTokenKey(category) : null,
    subcategory: subcategory ? normalizeTokenKey(subcategory) : null,
    metadata: normalizeCanonicalMetadata(metadata, itemType),
  }
}

const buildStructuredRecordFromItemAttributeRow = (row) => {
  const normalizedRow = normalizeItemAttributeRow(row)
  const structuredData = buildStructuredDataFromMetadata(
    {
      ...normalizedRow.metadata,
      category: normalizedRow.category,
      subcategory: normalizedRow.subcategory,
    },
    normalizedRow.item_type
  )

  return {
    item_id: normalizedRow.item_id,
    item_type: normalizedRow.item_type,
    data: structuredData,
    parse_error: null,
  }
}

const buildSearchTextFromStructuredRecord = (structuredRecord) => {
  const searchTerms = [normalizeSearchTextValue(structuredRecord.item_type)]
  const category = normalizeSearchTextValue(structuredRecord.data.category)
  if (category) {
    searchTerms.push(category)
  }

  const subcategory = normalizeSearchTextValue(
    structuredRecord.data.subcategory
  )
  if (subcategory) {
    searchTerms.push(subcategory)
  }

  const placement = normalizeSearchTextValue(structuredRecord.data.placement)
  if (placement) {
    searchTerms.push(placement)
  }

  searchTerms.push(
    ...dedupeSearchTerms(flattenSearchValues(structuredRecord.data.ornament))
  )

  const fieldOrder = getStructuredFieldOrder(structuredRecord.item_type)
  const extraFields = Object.keys(structuredRecord.data)
    .filter((field) => !fieldOrder.includes(field))
    .sort((left, right) => left.localeCompare(right))
  const attributeValues = dedupeSearchTerms(
    [...fieldOrder, ...extraFields].flatMap((field) =>
      SEARCH_DOCUMENT_VALUE_EXCLUDED_FIELDS.has(field)
        ? []
        : flattenSearchValues(structuredRecord.data[field])
    )
  )
  searchTerms.push(...attributeValues)

  return dedupeSearchTerms(searchTerms).join(' ').trim()
}

const hydrateSearchMetadataFromItemAttributeRow = (row) => {
  const normalizedRow = normalizeItemAttributeRow(row)
  const metadata = {
    item_id: normalizedRow.item_id,
    item_type: normalizedRow.item_type,
  }

  if (normalizedRow.category) {
    metadata.category = normalizedRow.category
  }

  if (normalizedRow.subcategory) {
    metadata.subcategory = normalizedRow.subcategory
  }

  getMetadataFieldOrder(normalizedRow.item_type).forEach((field) => {
    const value = normalizedRow.metadata[field]
    if (!hasStructuredValue(value)) {
      return
    }

    metadata[field] = value
  })

  return metadata
}

export const buildSearchDocumentRowFromItemAttributeRow = (row) => {
  const normalizedRow = normalizeItemAttributeRow(row)
  const structuredRecord =
    buildStructuredRecordFromItemAttributeRow(normalizedRow)

  return {
    id: normalizedRow.item_id,
    data: buildSearchTextFromStructuredRecord(structuredRecord),
    metadata: hydrateSearchMetadataFromItemAttributeRow(normalizedRow),
  }
}

export const buildItemAttributeRow = (row) => normalizeItemAttributeRow(row)

export const toUpsertRow = buildItemAttributeRow

const createDataSupabaseClient = () => {
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

const fetchAllItemAttributeRows = async ({
  client,
  pageSize = DEFAULT_EXPORT_PAGE_SIZE,
}) => {
  const rows = []
  let from = 0

  while (true) {
    const { data, error } = await client
      .from('item_attributes')
      .select('item_id,item_type,category,subcategory,metadata')
      .order('item_id', { ascending: true })
      .range(from, from + pageSize - 1)

    if (error) {
      throw error
    }

    const batch = Array.isArray(data) ? data : []
    rows.push(...batch)

    if (batch.length < pageSize) {
      break
    }

    from += pageSize
  }

  return rows
}

export const refreshItemSearchLocalCopy = async ({
  outputRoot = defaultLocalCopyRoot,
  pageSize = DEFAULT_EXPORT_PAGE_SIZE,
} = {}) => {
  loadEnvFile()
  const client = createDataSupabaseClient()
  const rawRows = await fetchAllItemAttributeRows({
    client,
    pageSize,
  })
  const normalizedRows = rawRows.map((row) => normalizeItemAttributeRow(row))

  const normalizedOutputRoot = path.resolve(outputRoot)
  const itemAttributesPath = path.join(
    normalizedOutputRoot,
    'item-attributes.jsonl'
  )
  for (const staleFileName of [
    'item-structured-final.jsonl',
    'item-search-documents.jsonl',
    'item-search-snapshot.jsonl',
  ]) {
    fs.rmSync(path.join(normalizedOutputRoot, staleFileName), {
      force: true,
    })
  }

  writeJsonLines(itemAttributesPath, normalizedRows)

  return {
    output_root: normalizedOutputRoot,
    item_attributes_path: itemAttributesPath,
    exported_count: normalizedRows.length,
  }
}

export const exportItemSearchLocalCopy = refreshItemSearchLocalCopy

export const buildSearchVectorUpsertRows = (itemAttributeRow) => {
  const normalizedRow = normalizeItemAttributeRow(itemAttributeRow)
  const metadata = hydrateSearchMetadataFromItemAttributeRow(normalizedRow)

  return SEARCH_NAMESPACE_CONFIG.map(({ namespace }) => {
    return {
      namespace,
      row: {
        id: String(metadata.item_id),
        data: buildLocalizedSearchText(metadata, namespace),
        metadata: { ...metadata },
      },
    }
  })
}

export const syncItemIndexToSupabase = async (argv = process.argv.slice(2)) => {
  loadEnvFile()

  const args = parseArgs(argv)
  const client = createDataSupabaseClient()

  const itemRows = parseJsonLines(args.itemAttributesPath).map((row) =>
    buildItemAttributeRow(row)
  )
  const distinctTypes = Array.from(
    new Set(itemRows.map((row) => row.item_type))
  ).sort()
  let supabaseWrittenCount = 0

  if (args.replaceTypes && distinctTypes.length > 0) {
    const { error: deleteError } = await client
      .from('item_attributes')
      .delete()
      .in('item_type', distinctTypes)

    if (deleteError) {
      throw deleteError
    }
  }

  for (const batch of chunkArray(itemRows, args.batchSize)) {
    // Default behavior is append-only: existing item_id rows are skipped.
    // Pass --overwrite to update existing rows in place.
    const { data, error } = await client
      .from('item_attributes')
      .upsert(batch, {
        onConflict: 'item_id',
        ignoreDuplicates: !args.overwrite,
      })
      .select('item_id')

    if (error) {
      throw error
    }

    supabaseWrittenCount += Array.isArray(data) ? data.length : 0
  }

  return {
    item_attributes_path: args.itemAttributesPath,
    imported_count: itemRows.length,
    item_types: distinctTypes,
    replace_types: args.replaceTypes,
    overwrite: args.overwrite,
    supabase_written: supabaseWrittenCount,
  }
}

const PINECONE_API_VERSION = '2025-10'
const PINECONE_TEXT_FIELD = 'text'
const PINECONE_MAX_UPSERT_BATCH_SIZE = 96

const resolvePineconeBaseUrl = (host) => {
  const normalizedHost = host.trim().replace(/\/$/, '')
  return /^https?:\/\//i.test(normalizedHost)
    ? normalizedHost
    : `https://${normalizedHost}`
}

const buildPineconeNdjson = (rows, textField = PINECONE_TEXT_FIELD) =>
  rows
    .map((row) =>
      JSON.stringify({
        _id: row.id,
        [textField]: row.data,
        ...row.metadata,
      })
    )
    .join('\n')

export const syncItemIndexToPinecone = async (argv = process.argv.slice(2)) => {
  loadEnvFile()

  if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_HOST) {
    throw new Error(
      'PINECONE_API_KEY and PINECONE_INDEX_HOST must be set in the environment or .env'
    )
  }

  const args = parseArgs(argv)
  const targetNamespaces = args.namespace
    ? SEARCH_NAMESPACE_CONFIG.filter(
        ({ namespace }) => namespace === args.namespace
      )
    : SEARCH_NAMESPACE_CONFIG

  if (args.namespace && targetNamespaces.length === 0) {
    throw new Error(
      `Unsupported namespace '${args.namespace}'. Expected one of: ${SEARCH_NAMESPACE_CONFIG.map(({ namespace }) => namespace).join(', ')}`
    )
  }

  const pineconeBaseUrl = resolvePineconeBaseUrl(
    process.env.PINECONE_INDEX_HOST
  )
  const textField = process.env.PINECONE_TEXT_FIELD || PINECONE_TEXT_FIELD
  const effectiveBatchSize = Math.min(
    args.batchSize,
    PINECONE_MAX_UPSERT_BATCH_SIZE
  )
  const itemRows = parseJsonLines(args.itemAttributesPath).map((row) =>
    buildItemAttributeRow(row)
  )
  const pineconeWrittenCounts = Object.fromEntries(
    targetNamespaces.map(({ namespace }) => [namespace, 0])
  )
  const vectorRowsByNamespace = targetNamespaces.reduce(
    (accumulator, { namespace }) => {
      accumulator[namespace] = []
      return accumulator
    },
    {}
  )

  for (const itemRow of itemRows) {
    const searchRows = buildSearchVectorUpsertRows(itemRow)

    searchRows.forEach(({ namespace, row }) => {
      if (!(namespace in vectorRowsByNamespace)) return
      vectorRowsByNamespace[namespace].push(row)
    })
  }

  for (const { namespace } of targetNamespaces) {
    const upsertEndpoint = `${pineconeBaseUrl}/records/namespaces/${encodeURIComponent(namespace)}/upsert`
    const fetchEndpoint = `${pineconeBaseUrl}/vectors/fetch`

    for (const batch of chunkArray(
      vectorRowsByNamespace[namespace],
      effectiveBatchSize
    )) {
      let rowsToWrite = batch

      if (!args.overwrite) {
        // Default behavior is append-only for Pinecone too: probe existing ids
        // in the target namespace and only write rows that are missing.
        const fetchUrl = new URL(fetchEndpoint)
        fetchUrl.searchParams.set('namespace', namespace)
        batch.forEach((row) => {
          fetchUrl.searchParams.append('ids', row.id)
        })

        const fetchResponse = await fetch(fetchUrl, {
          method: 'GET',
          headers: {
            'Api-Key': process.env.PINECONE_API_KEY,
            'X-Pinecone-Api-Version': PINECONE_API_VERSION,
          },
        })

        if (!fetchResponse.ok) {
          const message = await fetchResponse.text().catch(() => '')
          throw new Error(
            `Pinecone fetch failed for namespace ${namespace} with ${fetchResponse.status} ${fetchResponse.statusText}${message ? `: ${message}` : ''}`
          )
        }

        const fetchPayload = await fetchResponse.json()
        const fetchedVectors = fetchPayload?.vectors ?? {}

        rowsToWrite = batch.filter((row) => !fetchedVectors[row.id])
      }

      if (rowsToWrite.length === 0) {
        continue
      }

      const response = await fetch(upsertEndpoint, {
        method: 'POST',
        headers: {
          'Api-Key': process.env.PINECONE_API_KEY,
          'Content-Type': 'application/x-ndjson',
          'X-Pinecone-Api-Version': PINECONE_API_VERSION,
        },
        body: buildPineconeNdjson(rowsToWrite, textField),
      })

      if (!response.ok) {
        const message = await response.text().catch(() => '')
        throw new Error(
          `Pinecone upsert failed for namespace ${namespace} with ${response.status} ${response.statusText}${message ? `: ${message}` : ''}`
        )
      }

      pineconeWrittenCounts[namespace] += rowsToWrite.length
    }
  }

  return {
    item_attributes_path: args.itemAttributesPath,
    imported_count: itemRows.length,
    namespace: args.namespace,
    overwrite: args.overwrite,
    batch_size: effectiveBatchSize,
    pinecone_namespaces: Object.fromEntries(
      targetNamespaces.map(({ namespace }) => [
        namespace,
        vectorRowsByNamespace[namespace].length,
      ])
    ),
    pinecone_written: pineconeWrittenCounts,
    text_field: textField,
  }
}
