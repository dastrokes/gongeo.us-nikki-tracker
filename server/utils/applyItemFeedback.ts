import { createError } from 'h3'

import enFilter from '../../app/locales/en/filter.json'
import enMisc from '../../app/locales/en/misc.json'
import zhFilter from '../../app/locales/zh/filter.json'
import zhMisc from '../../app/locales/zh/misc.json'
import {
  ITEM_SEARCH_FIELD_KIND_BY_NAME,
  ITEM_SEARCH_SEARCH_NAMESPACES,
} from '#shared/constants/itemSearchRegistry'

type ItemAttributeRow = {
  item_id: number
  item_type: string
  category: string | null
  subcategory: string | null
  metadata: Record<string, string | string[]>
}

type ItemCatalogRow = {
  quality?: number | null
  style_key?: string | null
  tags?: Array<number | string> | null
  obtain_type?: number | null
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

const normalizeNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const normalizeNumberStringArray = (value: unknown) =>
  Array.isArray(value)
    ? Array.from(
        new Set(
          value
            .map((entry) => normalizeNumber(entry))
            .filter((entry): entry is number => entry !== null)
            .map((entry) => String(entry))
        )
      )
    : []

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

const applyCatalogSearchMetadata = (
  metadata: ItemSearchMetadata,
  catalog: ItemCatalogRow | null
) => {
  if (!catalog) return metadata

  const metadataRecord = metadata as Record<string, unknown>
  const quality = normalizeNumber(catalog.quality)
  const styleKey =
    typeof catalog.style_key === 'string' ? catalog.style_key.trim() : ''
  const labelIds = normalizeNumberStringArray(catalog.tags)
  const obtainType = normalizeNumber(catalog.obtain_type)

  if (quality !== null) {
    metadataRecord.quality = quality
  }

  if (styleKey) {
    metadataRecord.style_key = styleKey
  }

  if (labelIds.length > 0) {
    metadataRecord.label_ids = labelIds
  }

  if (obtainType !== null) {
    metadataRecord.obtain_type = obtainType
  }

  return metadata
}

const buildSearchMetadata = (
  row: ItemAttributeRow,
  catalog: ItemCatalogRow | null = null
): ItemSearchMetadata => {
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

  return applyCatalogSearchMetadata(metadata, catalog)
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

const buildSearchVectorUpsertRows = (
  itemAttributeRow: ItemAttributeRow,
  catalog: ItemCatalogRow | null = null
) => {
  const metadata = buildSearchMetadata(itemAttributeRow, catalog)

  return ITEM_SEARCH_SEARCH_NAMESPACES.map((namespace) => ({
    namespace,
    row: {
      id: String(itemAttributeRow.item_id),
      data: buildLocalizedSearchText(metadata, namespace),
      metadata: { ...metadata },
    } satisfies PineconeUpsertRow,
  }))
}

const buildItemAttributeRow = ({
  itemId,
  itemType,
  metadata,
  patch,
  changedFields,
}: {
  itemId: number
  itemType: string
  metadata: ItemSearchMetadata | null
  patch: FeedbackSuggestion['proposedPatch']
  changedFields: FeedbackSuggestion['changedFields']
}): ItemAttributeRow => {
  const normalizedItemType = normalizeItemSearchItemType(itemType)
  const baseSnapshot = normalizeItemTagFeedbackSnapshot(
    metadata ?? {},
    normalizedItemType
  )
  const normalizedPatch = normalizeItemTagFeedbackPatch(
    patch,
    normalizedItemType,
    changedFields
  )
  const snapshot = normalizeItemTagFeedbackSnapshot(
    {
      ...baseSnapshot,
      ...normalizedPatch,
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

const fetchItemCatalogRow = async (
  itemId: number
): Promise<ItemCatalogRow | null> => {
  const supabase = useSupabaseDataClient()
  const { data, error } = await withSupabaseRetry(() =>
    supabase
      .from('items')
      .select('quality,style_key,tags,obtain_type')
      .eq('id', itemId)
      .maybeSingle()
  )

  if (error) {
    throw error
  }

  return data as ItemCatalogRow | null
}

const upsertPineconeRows = async (row: ItemAttributeRow) => {
  const runtimeConfig = useRuntimeConfig()
  const pineconeApiKey = normalizeRuntimeConfigString(
    runtimeConfig.pineconeApiKey
  )
  const pineconeSearchHost = normalizeRuntimeConfigString(
    runtimeConfig.pineconeSearchHost
  )

  if (!pineconeApiKey || !pineconeSearchHost) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Search index is not configured',
      message: 'Search index is not configured',
    })
  }

  const catalog = await fetchItemCatalogRow(row.item_id)
  const searchRows = buildSearchVectorUpsertRows(row, catalog)
  const embeddings = await embedPineconeTexts({
    apiKey: pineconeApiKey,
    texts: searchRows.map(({ row: vectorRow }) => vectorRow.data),
    inputType: 'passage',
  })
  const upsertedNamespaces: SearchNamespace[] = []

  for (const [index, { namespace, row: vectorRow }] of searchRows.entries()) {
    const embedding = embeddings[index]
    if (!embedding) {
      throw new Error(`Missing Pinecone embedding for namespace ${namespace}`)
    }

    await upsertPineconeDocuments({
      apiKey: pineconeApiKey,
      host: pineconeSearchHost,
      namespace,
      documents: [
        {
          _id: vectorRow.id,
          text: vectorRow.data,
          embedding,
          ...vectorRow.metadata,
        },
      ],
    })
    upsertedNamespaces.push(namespace)
  }

  return upsertedNamespaces
}

export const applyItemFeedback = async (
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
    changedFields: suggestion.changedFields,
  })

  await upsertItemAttributeRow(itemAttributeRow)
  const searchNamespaces = await upsertPineconeRows(itemAttributeRow)
  const applyId = `feedback-apply-${suggestion.id}`
  const touchedItemIds = [itemAttributeRow.item_id]
  let purgedCacheIds: string[]

  try {
    purgedCacheIds = await purgeNetlifyCacheIds([
      CACHE_TAGS.itemSearch,
      ...touchedItemIds.map((itemId) => itemDetailCacheId(String(itemId))),
    ])
  } catch (error: unknown) {
    console.error(
      `Failed to purge Netlify cache for ${applyId} items ${touchedItemIds.join(',')}: ${toErrorMessage(error, 'Unknown purge error')}`
    )
    throw error
  }

  await updateFeedbackSuggestionStatus({
    suggestionId: suggestion.id,
    status: 'applied',
  })

  return {
    applyId,
    touchedItemIds,
    purgedCacheIds,
    searchNamespaces,
  }
}
