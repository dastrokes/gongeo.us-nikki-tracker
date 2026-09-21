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
  itemId: number
  itemType: string
  category: string | null
  subcategory: string | null
  metadata: Record<string, string | string[]>
}

type SearchNamespace = (typeof ITEM_SEARCH_SEARCH_NAMESPACES)[number]

type LocaleResources = {
  filter: Record<string, unknown>
  misc: Record<string, unknown>
}

type CatalogWriteResponse = {
  operationId: string
  itemId: number
  revision: string
  purgedTags: string[]
  searchNamespaces: string[]
  replayed: boolean
}

const LOCALE_RESOURCES = {
  en: { filter: enFilter, misc: enMisc },
  zh: { filter: zhFilter, misc: zhMisc },
} satisfies Record<SearchNamespace, LocaleResources>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const getErrorMessage = (value: unknown) =>
  isRecord(value) && typeof value.message === 'string' ? value.message : null

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
    item_id: row.itemId,
    item_type: row.itemType,
    slot: row.itemType,
  }
  const metadataRecord = metadata as Record<string, unknown>

  if (row.category) metadata.category = row.category
  if (row.subcategory) metadata.subcategory = row.subcategory

  getItemSearchAdvancedFields(row.itemType).forEach((field) => {
    const value = row.metadata[field]
    if (Array.isArray(value) && value.length > 0) {
      metadataRecord[field] = value
    } else if (typeof value === 'string' && value.trim()) {
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
        getLocalizedFieldValue({ namespace, itemType, field, value })
      )
    )
  }

  return toUniqueValues(terms).join(' ')
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
  const snapshot = normalizeItemTagFeedbackSnapshot(
    {
      ...normalizeItemTagFeedbackSnapshot(metadata ?? {}, normalizedItemType),
      ...normalizeItemTagFeedbackPatch(
        patch,
        normalizedItemType,
        changedFields
      ),
    },
    normalizedItemType
  )
  const rowMetadata: ItemAttributeRow['metadata'] = {}

  getItemSearchAdvancedFields(normalizedItemType).forEach((field) => {
    const value = snapshot[field]
    if (Array.isArray(value)) {
      const normalizedValues = toUniqueStrings(value)
      if (normalizedValues.length > 0) rowMetadata[field] = normalizedValues
      return
    }
    const normalizedValue = normalizeNullableToken(value)
    if (normalizedValue) rowMetadata[field] = normalizedValue
  })

  return {
    itemId,
    itemType: normalizedItemType,
    category: normalizeNullableToken(snapshot.category),
    subcategory: normalizeNullableToken(snapshot.subcategory),
    metadata: rowMetadata,
  }
}

const requireRuntimeConfigString = (value: unknown, name: string) => {
  const normalized = typeof value === 'string' ? value.trim() : ''
  if (!normalized) throw new Error(`${name} is required`)
  return normalized
}

const callCatalogWriteApi = async (
  body: Record<string, unknown>
): Promise<CatalogWriteResponse> => {
  const config = useRuntimeConfig()
  const url = requireRuntimeConfigString(
    config.cloudflareCatalogWriteUrl,
    'CLOUDFLARE_CATALOG_WRITE_URL'
  )
  const token = requireRuntimeConfigString(
    config.cloudflareDataToken,
    'CLOUDFLARE_DATA_TOKEN'
  )
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  })
  const payload = (await response.json().catch(() => null)) as
    CatalogWriteResponse | { message?: unknown } | null

  if (!response.ok) {
    const message = getErrorMessage(payload) ?? 'Catalog update failed'
    throw createError({
      statusCode: response.status === 409 ? 409 : 502,
      statusMessage: message,
      message,
    })
  }

  if (
    !payload ||
    !('operationId' in payload) ||
    typeof payload.operationId !== 'string' ||
    !('itemId' in payload) ||
    !Number.isSafeInteger(payload.itemId)
  ) {
    throw new Error('Catalog write API returned an invalid response')
  }
  return payload as CatalogWriteResponse
}

export const applyItemFeedback = async (
  suggestion: FeedbackSuggestion,
  operationId: string
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

  const row = buildItemAttributeRow({
    itemId: sourceItem.entityId,
    itemType: sourceItem.itemType,
    metadata: sourceItem.metadata,
    patch: suggestion.proposedPatch,
    changedFields: suggestion.changedFields,
  })
  const searchMetadata = buildSearchMetadata(row)
  const searchTexts = Object.fromEntries(
    ITEM_SEARCH_SEARCH_NAMESPACES.map((namespace) => [
      namespace,
      buildLocalizedSearchText(searchMetadata, namespace),
    ])
  )

  const result = await callCatalogWriteApi({
    operationId,
    suggestionId: suggestion.id,
    itemId: suggestion.entityId,
    baseSnapshot: suggestion.baseSnapshot,
    proposedPatch: suggestion.proposedPatch,
    changedFields: suggestion.changedFields,
    searchTexts,
  })

  return {
    applyId: result.operationId,
    touchedItemIds: [result.itemId],
    purgedCacheTags: result.purgedTags,
    searchNamespaces: result.searchNamespaces,
    revision: result.revision,
    replayed: result.replayed,
  }
}
