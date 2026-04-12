import { createError } from 'h3'

import { useSupabaseDataClient } from '~/composables/useSupabaseClient'

import enFilter from '../../app/locales/en/filter.json'
import enMisc from '../../app/locales/en/misc.json'
import zhFilter from '../../app/locales/zh/filter.json'
import zhMisc from '../../app/locales/zh/misc.json'
import {
  ITEM_SEARCH_FIELD_KIND_BY_NAME,
  ITEM_SEARCH_SEARCH_NAMESPACES,
} from '#shared/constants/itemSearchRegistry'
import type {
  FeedbackMaintainerApplyResult,
  FeedbackSuggestion,
} from '#shared/types/feedback'
import type {
  ItemSearchField,
  ItemSearchMetadata,
} from '#shared/types/itemSearch'
import { normalizeItemTagFeedbackSnapshot } from '#shared/utils/feedback'
import {
  getItemSearchAdvancedFields,
  isSupportedItemSearchItemType,
  normalizeItemSearchItemType,
  normalizeItemSearchTokenKey,
} from '#shared/utils/itemSearch'

type ItemAttributeRow = {
  item_id: number
  item_type: string
  category: string | null
  subcategory: string | null
  metadata: Record<string, string | string[]>
}

type SearchNamespace = (typeof ITEM_SEARCH_SEARCH_NAMESPACES)[number]

type PineconeUpsertRow = {
  id: string
  data: string
  metadata: ItemSearchMetadata
}

type LocaleResources = {
  filter: Record<string, unknown>
  misc: Record<string, unknown>
}

const PINECONE_API_VERSION = '2025-10'
const PINECONE_TEXT_FIELD = 'text'

const LOCALE_RESOURCES = {
  en: {
    filter: enFilter,
    misc: enMisc,
  },
  zh: {
    filter: zhFilter,
    misc: zhMisc,
  },
} satisfies Record<SearchNamespace, LocaleResources>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const getNestedString = (
  value: Record<string, unknown>,
  pathSegments: string[]
) => {
  let current: unknown = value

  for (const segment of pathSegments) {
    if (!isRecord(current)) return null
    current = current[segment]
  }

  return typeof current === 'string' ? current : null
}

const titleCaseWord = (value: string) =>
  value.length > 0 ? value[0]!.toUpperCase() + value.slice(1) : value

const humanizeToken = (value: string) =>
  value.split('_').filter(Boolean).map(titleCaseWord).join(' ')

const toUniqueValues = (values: string[]) =>
  Array.from(
    new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean))
  )

const toUniqueStrings = (values: unknown) =>
  Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .filter((entry): entry is string => typeof entry === 'string')
        .map((entry) => normalizeItemSearchTokenKey(entry))
        .filter(Boolean)
    )
  ).sort((left, right) => left.localeCompare(right))

const normalizeNullableToken = (value: unknown) =>
  typeof value === 'string' ? normalizeItemSearchTokenKey(value) || null : null

const resolvePineconeBaseUrl = (host: string) => {
  const normalizedHost = host.trim().replace(/\/$/, '')
  return /^https?:\/\//i.test(normalizedHost)
    ? normalizedHost
    : `https://${normalizedHost}`
}

const normalizeRuntimeConfigString = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : ''

const getLocalizedItemType = (namespace: SearchNamespace, itemType: string) =>
  getNestedString(LOCALE_RESOURCES[namespace].misc, [`type.${itemType}`]) ??
  getNestedString(LOCALE_RESOURCES.en.misc, [`type.${itemType}`]) ??
  humanizeToken(itemType)

const getLocalizedFieldValue = ({
  namespace,
  itemType,
  field,
  value,
}: {
  namespace: SearchNamespace
  itemType: string
  field: ItemSearchField
  value: string
}) => {
  const resourcePath =
    field === 'category' || field === 'subcategory'
      ? ['filter', field, itemType, value]
      : ['filter', field, value]

  return (
    getNestedString(LOCALE_RESOURCES[namespace].filter, resourcePath) ??
    getNestedString(LOCALE_RESOURCES.en.filter, resourcePath) ??
    humanizeToken(value)
  )
}

const getMetadataFieldValues = (
  metadata: ItemSearchMetadata,
  field: ItemSearchField
) => {
  const value = metadata[field]
  const kind =
    ITEM_SEARCH_FIELD_KIND_BY_NAME[
      field as keyof typeof ITEM_SEARCH_FIELD_KIND_BY_NAME
    ]

  if (kind === 'array') {
    return Array.isArray(value)
      ? toUniqueValues(
          value.filter((entry): entry is string => typeof entry === 'string')
        )
      : []
  }

  return typeof value === 'string' && value.trim() ? [value.trim()] : []
}

const buildSearchMetadata = (row: ItemAttributeRow): ItemSearchMetadata => {
  const metadata: ItemSearchMetadata = {
    item_id: row.item_id,
    item_type: row.item_type,
    slot: row.item_type,
  }
  const metadataRecord = metadata as Record<string, unknown>

  if (row.category) {
    metadata.category = row.category
  }

  if (row.subcategory) {
    metadata.subcategory = row.subcategory
  }

  getItemSearchAdvancedFields(row.item_type).forEach((field) => {
    const value = row.metadata[field]
    if (Array.isArray(value) && value.length > 0) {
      metadataRecord[field] = value
      return
    }

    if (typeof value === 'string' && value.trim()) {
      metadataRecord[field] = value
    }
  })

  return metadata
}

const buildLocalizedSearchText = (
  metadata: ItemSearchMetadata,
  namespace: SearchNamespace
) => {
  const itemType =
    typeof metadata.item_type === 'string' ? metadata.item_type : ''
  const fields = [
    'category',
    'subcategory',
    ...getItemSearchAdvancedFields(itemType),
  ] as ItemSearchField[]
  const terms = [getLocalizedItemType(namespace, itemType)]

  for (const field of fields) {
    terms.push(
      ...getMetadataFieldValues(metadata, field).map((value) =>
        getLocalizedFieldValue({
          namespace,
          itemType,
          field,
          value,
        })
      )
    )
  }

  return toUniqueValues(terms).join(' ')
}

const buildSearchVectorUpsertRows = (itemAttributeRow: ItemAttributeRow) => {
  const metadata = buildSearchMetadata(itemAttributeRow)

  return ITEM_SEARCH_SEARCH_NAMESPACES.map((namespace) => ({
    namespace,
    row: {
      id: String(itemAttributeRow.item_id),
      data: buildLocalizedSearchText(metadata, namespace),
      metadata: { ...metadata },
    } satisfies PineconeUpsertRow,
  }))
}

const buildPineconeNdjson = (row: PineconeUpsertRow) =>
  JSON.stringify({
    _id: row.id,
    [PINECONE_TEXT_FIELD]: row.data,
    ...row.metadata,
  })

const buildItemAttributeRow = ({
  itemId,
  itemType,
  metadata,
  patch,
}: {
  itemId: number
  itemType: string
  metadata: ItemSearchMetadata | null
  patch: FeedbackSuggestion['proposedPatch']
}): ItemAttributeRow => {
  const normalizedItemType = normalizeItemSearchItemType(itemType)
  const baseSnapshot = normalizeItemTagFeedbackSnapshot(
    metadata ?? {},
    normalizedItemType
  )
  const snapshot = normalizeItemTagFeedbackSnapshot(
    {
      ...baseSnapshot,
      ...patch,
    },
    normalizedItemType
  )
  const rowMetadata: ItemAttributeRow['metadata'] = {}

  getItemSearchAdvancedFields(normalizedItemType).forEach((field) => {
    const value = snapshot[field]
    if (Array.isArray(value)) {
      const normalizedValues = toUniqueStrings(value)
      if (normalizedValues.length > 0) {
        rowMetadata[field] = normalizedValues
      }
      return
    }

    const normalizedValue = normalizeNullableToken(value)
    if (normalizedValue) {
      rowMetadata[field] = normalizedValue
    }
  })

  return {
    item_id: itemId,
    item_type: normalizedItemType,
    category: normalizeNullableToken(snapshot.category),
    subcategory: normalizeNullableToken(snapshot.subcategory),
    metadata: rowMetadata,
  }
}

const upsertItemAttributeRow = async (row: ItemAttributeRow) => {
  const supabase = useSupabaseDataClient()
  const { error } = await withSupabaseRetry(() =>
    supabase.from('item_attributes').upsert(row as never, {
      onConflict: 'item_id',
      ignoreDuplicates: false,
    })
  )

  if (error) {
    throw error
  }
}

const upsertPineconeRows = async (row: ItemAttributeRow) => {
  const runtimeConfig = useRuntimeConfig()
  const pineconeApiKey = normalizeRuntimeConfigString(
    runtimeConfig.pineconeApiKey
  )
  const pineconeIndexHost = normalizeRuntimeConfigString(
    runtimeConfig.pineconeIndexHost
  )

  if (!pineconeApiKey || !pineconeIndexHost) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Search index is not configured',
      message: 'Search index is not configured',
    })
  }

  const pineconeBaseUrl = resolvePineconeBaseUrl(pineconeIndexHost)
  const upsertedNamespaces: SearchNamespace[] = []

  for (const { namespace, row: vectorRow } of buildSearchVectorUpsertRows(
    row
  )) {
    const endpoint = `${pineconeBaseUrl}/records/namespaces/${encodeURIComponent(namespace)}/upsert`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Api-Key': pineconeApiKey,
        'Content-Type': 'application/x-ndjson',
        'X-Pinecone-Api-Version': PINECONE_API_VERSION,
      },
      body: buildPineconeNdjson(vectorRow),
    })

    if (!response.ok) {
      const message = await response.text().catch(() => '')
      throw new Error(
        `Pinecone upsert failed for namespace ${namespace} with ${response.status} ${response.statusText}${message ? `: ${message}` : ''}`
      )
    }

    upsertedNamespaces.push(namespace)
  }

  return upsertedNamespaces
}

export const applyItemFeedbackSuggestion = async (
  suggestion: FeedbackSuggestion
): Promise<FeedbackMaintainerApplyResult> => {
  if (suggestion.entityType !== 'item') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Only item feedback is supported',
      message: 'Only item feedback is supported',
    })
  }

  const sourceItem = await getFeedbackSourceItem(suggestion.entityId)
  if (!sourceItem) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Feedback item not found',
      message: 'Feedback item not found',
    })
  }

  if (!isSupportedItemSearchItemType(sourceItem.itemType)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Unsupported item feedback type',
      message: 'Unsupported item feedback type',
    })
  }

  const itemAttributeRow = buildItemAttributeRow({
    itemId: sourceItem.entityId,
    itemType: sourceItem.itemType,
    metadata: sourceItem.metadata,
    patch: suggestion.proposedPatch,
  })

  await upsertItemAttributeRow(itemAttributeRow)
  const searchNamespaces = await upsertPineconeRows(itemAttributeRow)
  await updateFeedbackSuggestionStatus({
    suggestionId: suggestion.id,
    status: 'applied',
  })

  return {
    applyId: `feedback-apply-${suggestion.id}`,
    touchedItemIds: [itemAttributeRow.item_id],
    searchNamespaces,
  }
}
