import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const envPath = path.join(repoRoot, '.env')
const defaultDocumentsPath = path.resolve(
  repoRoot,
  '..',
  'gongeo.us-image-search',
  'index',
  'item-search-documents.jsonl'
)

export const SEARCH_NAMESPACE_CONFIG = [
  { namespace: 'en' },
  { namespace: 'zh' },
]

const localesRoot = path.join(repoRoot, 'app', 'locales')
const searchLocaleCache = new Map()
const ARRAY_FIELDS = ['pattern', 'material', 'structure', 'ornament']
const SCALAR_FIELDS = [
  'top_length',
  'bottom_length',
  'hair_length',
  'fit',
  'neckline',
  'shoulder_style',
  'sleeve_length',
  'sleeve_style',
  'skirt_silhouette',
  'pant_shape',
  'waist_height',
  'dress_silhouette',
  'waistline',
  'haircut',
  'texture',
  'bangs',
  'heel_type',
  'heel_height',
  'sole_height',
  'shaft_height',
  'sock_height',
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
  // --documents-path <path> selects the JSONL source
  // --batch-size <n> controls write batch size
  // --overwrite forces existing records to be updated instead of skipped
  // --namespace <en|zh> applies to vector sync flows (Upstash/Pinecone)
  const args = {
    documentsPath: defaultDocumentsPath,
    replaceTypes: false,
    batchSize: 250,
    namespace: null,
    overwrite: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (!arg) continue

    if (arg === '--documents-path') {
      args.documentsPath = argv[index + 1]
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

const normalizeDocumentMetadata = (documentRow) => {
  const metadata = { ...(documentRow.metadata || {}) }
  const itemId = Number(metadata.item_id ?? documentRow.id)

  if (!Number.isFinite(itemId)) {
    throw new Error(`Invalid item id in row ${JSON.stringify(documentRow)}`)
  }

  const itemType = normalizeItemType(metadata.item_type ?? metadata.slot)
  metadata.item_id = itemId
  metadata.item_type = itemType
  metadata.slot = itemType

  for (const field of SCALAR_FIELDS) {
    const normalized = normalizeNullableString(metadata[field])
    if (normalized === null) {
      delete metadata[field]
      continue
    }
    metadata[field] = normalizeTokenKey(normalized)
  }

  for (const field of ARRAY_FIELDS) {
    const normalized = normalizeStringArray(metadata[field]).map(
      normalizeTokenKey
    )
    if (normalized.length === 0) {
      delete metadata[field]
      continue
    }
    metadata[field] = normalized
  }

  return metadata
}

export const buildItemAttributeRow = (documentRow) => {
  const metadata = normalizeDocumentMetadata(documentRow)

  return {
    item_id: metadata.item_id,
    item_type: metadata.item_type,
    category: metadata.category ?? null,
    subcategory: metadata.subcategory ?? null,
    metadata,
  }
}

export const toUpsertRow = buildItemAttributeRow

export const buildSearchVectorUpsertRows = (documentRow) => {
  const { metadata } = buildItemAttributeRow(documentRow)

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

  if (!process.env.SUPABASE_DATA_URL || !process.env.SUPABASE_DATA_SECRET_KEY) {
    throw new Error(
      'SUPABASE_DATA_URL and SUPABASE_DATA_SECRET_KEY must be set in the environment or .env'
    )
  }

  const args = parseArgs(argv)
  const client = createClient(
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

  const documents = parseJsonLines(args.documentsPath)
  const itemRows = documents.map((row) => buildItemAttributeRow(row))
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
    documents_path: args.documentsPath,
    imported_count: itemRows.length,
    item_types: distinctTypes,
    replace_types: args.replaceTypes,
    overwrite: args.overwrite,
    supabase_written: supabaseWrittenCount,
  }
}

export const syncItemIndexToUpstash = async (argv = process.argv.slice(2)) => {
  loadEnvFile()

  if (
    !process.env.UPSTASH_VECTOR_REST_URL ||
    !process.env.UPSTASH_VECTOR_REST_TOKEN
  ) {
    throw new Error(
      'UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN must be set in the environment or .env'
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

  const documents = parseJsonLines(args.documentsPath)
  const vectorWrittenCounts = Object.fromEntries(
    targetNamespaces.map(({ namespace }) => [namespace, 0])
  )
  const vectorRowsByNamespace = targetNamespaces.reduce(
    (accumulator, { namespace }) => {
      accumulator[namespace] = []
      return accumulator
    },
    {}
  )

  for (const documentRow of documents) {
    const searchRows = buildSearchVectorUpsertRows(documentRow)

    searchRows.forEach(({ namespace, row }) => {
      if (!(namespace in vectorRowsByNamespace)) return
      vectorRowsByNamespace[namespace].push(row)
    })
  }

  for (const { namespace } of targetNamespaces) {
    const endpoint = `${process.env.UPSTASH_VECTOR_REST_URL.replace(/\/$/, '')}/upsert-data/${encodeURIComponent(namespace)}`
    const fetchEndpoint = `${process.env.UPSTASH_VECTOR_REST_URL.replace(/\/$/, '')}/fetch/${encodeURIComponent(namespace)}`

    for (const batch of chunkArray(
      vectorRowsByNamespace[namespace],
      args.batchSize
    )) {
      let rowsToWrite = batch

      if (!args.overwrite) {
        // Default behavior is append-only for Vector too: probe existing ids
        // in the target namespace and only write rows that are missing.
        const fetchResponse = await fetch(fetchEndpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.UPSTASH_VECTOR_REST_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ids: batch.map((row) => row.id),
            includeMetadata: false,
            includeData: false,
            includeVectors: false,
          }),
        })

        if (!fetchResponse.ok) {
          const message = await fetchResponse.text().catch(() => '')
          throw new Error(
            `Upstash fetch failed for namespace ${namespace} with ${fetchResponse.status} ${fetchResponse.statusText}${message ? `: ${message}` : ''}`
          )
        }

        const fetchPayload = await fetchResponse.json()
        const fetchedRows = Array.isArray(fetchPayload?.result)
          ? fetchPayload.result
          : []

        rowsToWrite = batch.filter((_, index) => !fetchedRows[index])
      }

      if (rowsToWrite.length === 0) {
        continue
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_VECTOR_REST_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rowsToWrite),
      })

      if (!response.ok) {
        const message = await response.text().catch(() => '')
        throw new Error(
          `Upstash upsert failed for namespace ${namespace} with ${response.status} ${response.statusText}${message ? `: ${message}` : ''}`
        )
      }

      vectorWrittenCounts[namespace] += rowsToWrite.length
    }
  }

  return {
    documents_path: args.documentsPath,
    imported_count: documents.length,
    replace_types: args.replaceTypes,
    namespace: args.namespace,
    overwrite: args.overwrite,
    vector_namespaces: Object.fromEntries(
      targetNamespaces.map(({ namespace }) => [
        namespace,
        vectorRowsByNamespace[namespace].length,
      ])
    ),
    vector_written: vectorWrittenCounts,
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
  const documents = parseJsonLines(args.documentsPath)
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

  for (const documentRow of documents) {
    const searchRows = buildSearchVectorUpsertRows(documentRow)

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
    documents_path: args.documentsPath,
    imported_count: documents.length,
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
