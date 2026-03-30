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

const ARRAY_FIELDS = ['pattern', 'material', 'structure', 'ornament']
const SCALAR_FIELDS = [
  'category',
  'subcategory',
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
const isMain = process.argv[1]
  ? path.resolve(process.argv[1]) === __filename
  : false

const loadEnvFile = (filePath) => {
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

const parseArgs = (argv) => {
  const args = {
    documentsPath: defaultDocumentsPath,
    replaceTypes: false,
    batchSize: 250,
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

const parseJsonLines = (filePath) => {
  const raw = fs.readFileSync(filePath, 'utf8')

  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line))
}

const chunkArray = (values, chunkSize) => {
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

export const main = async (argv = process.argv.slice(2)) => {
  loadEnvFile(envPath)

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
    const { error } = await client
      .from('item_attributes')
      .upsert(batch, { onConflict: 'item_id' })

    if (error) {
      throw error
    }
  }

  console.log(
    JSON.stringify(
      {
        documents_path: args.documentsPath,
        imported_count: itemRows.length,
        item_types: distinctTypes,
        replace_types: args.replaceTypes,
      },
      null,
      2
    )
  )
}

if (isMain) {
  await main()
}
