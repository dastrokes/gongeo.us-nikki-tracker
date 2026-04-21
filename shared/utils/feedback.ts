import type {
  FeedbackEntityType,
  FeedbackReviewState,
  FeedbackSortKey,
  FeedbackSuggestionStatus,
  FeedbackVoteValue,
  ItemTagFeedbackField,
  ItemTagFeedbackPatch,
  ItemTagFeedbackSnapshot,
  ItemTagFeedbackValue,
} from '../types/feedback'
import type {
  ItemSearchArrayField,
  ItemSearchMetadata,
} from '../types/itemSearch'
import {
  getItemSearchAdvancedFields,
  isSupportedItemSearchItemType,
  isItemSearchArrayField,
  normalizeItemSearchTaxonomySelection,
  normalizeItemSearchTokenKey,
} from './itemSearch'

export const FEEDBACK_PAGE_SIZE = 10

export const FEEDBACK_ENTITY_TYPES = ['item', 'outfit'] as const
export const FEEDBACK_SUGGESTION_STATUSES = [
  'open',
  'accepted',
  'rejected',
  'applied',
] as const
export const FEEDBACK_SORT_KEYS = ['needs-review', 'top', 'new'] as const
export const FEEDBACK_REVIEW_STATES = ['unreviewed', 'all', 'voted'] as const
export const FEEDBACK_VOTE_VALUES = [-1, 1] as const

const ITEM_TAG_BASE_FIELDS = ['category', 'subcategory'] as const

export const ALL_ITEM_TAG_FEEDBACK_FIELDS: ItemTagFeedbackField[] = [
  ...ITEM_TAG_BASE_FIELDS,
  ...getItemSearchAdvancedFields(),
]

export const isFeedbackEntityType = (
  value: unknown
): value is FeedbackEntityType =>
  typeof value === 'string' &&
  FEEDBACK_ENTITY_TYPES.includes(value as FeedbackEntityType)

export const isFeedbackSuggestionStatus = (
  value: unknown
): value is FeedbackSuggestionStatus =>
  typeof value === 'string' &&
  FEEDBACK_SUGGESTION_STATUSES.includes(value as FeedbackSuggestionStatus)

export const isFeedbackSortKey = (value: unknown): value is FeedbackSortKey =>
  typeof value === 'string' &&
  FEEDBACK_SORT_KEYS.includes(value as FeedbackSortKey)

export const isFeedbackReviewState = (
  value: unknown
): value is FeedbackReviewState =>
  typeof value === 'string' &&
  FEEDBACK_REVIEW_STATES.includes(value as FeedbackReviewState)

export const isFeedbackVoteValue = (
  value: unknown
): value is FeedbackVoteValue =>
  typeof value === 'number' &&
  FEEDBACK_VOTE_VALUES.includes(value as FeedbackVoteValue)

export const getItemTagFeedbackFields = (
  itemType?: string | null
): ItemTagFeedbackField[] => {
  if (itemType && !isSupportedItemSearchItemType(itemType)) {
    return []
  }

  return [...ITEM_TAG_BASE_FIELDS, ...getItemSearchAdvancedFields(itemType)]
}

export const isItemTagFeedbackMultiField = (
  field: ItemTagFeedbackField
): field is ItemSearchArrayField =>
  isItemSearchArrayField(field as ItemSearchArrayField)

const normalizeFeedbackScalarValue = (value: unknown) => {
  if (value === null) return null
  if (typeof value !== 'string') return null

  const normalized = normalizeItemSearchTokenKey(value)
  return normalized || null
}

const normalizeFeedbackArrayValue = (value: unknown) => {
  if (!Array.isArray(value)) return null

  const normalized = Array.from(
    new Set(
      value
        .filter((entry): entry is string => typeof entry === 'string')
        .map((entry) => normalizeItemSearchTokenKey(entry))
        .filter((entry): entry is string => Boolean(entry))
    )
  ).sort((left, right) => left.localeCompare(right))

  return normalized.length > 0 ? normalized : null
}

const normalizeFeedbackValue = (
  field: ItemTagFeedbackField,
  value: unknown
): ItemTagFeedbackValue =>
  isItemTagFeedbackMultiField(field)
    ? normalizeFeedbackArrayValue(value)
    : normalizeFeedbackScalarValue(value)

const normalizeFeedbackSnapshotTaxonomy = (
  snapshot: ItemTagFeedbackSnapshot,
  itemType?: string | null
) => {
  const normalizedTaxonomy = normalizeItemSearchTaxonomySelection({
    itemType,
    category: typeof snapshot.category === 'string' ? snapshot.category : null,
    subcategory:
      typeof snapshot.subcategory === 'string' ? snapshot.subcategory : null,
  })

  return {
    ...snapshot,
    category: normalizedTaxonomy.category,
    subcategory: normalizedTaxonomy.subcategory,
  }
}

const createItemTagFeedbackSnapshotFromValue = (
  value: Record<string, unknown> | null | undefined,
  fields: ItemTagFeedbackField[]
): ItemTagFeedbackSnapshot =>
  Object.fromEntries(
    fields.map((field) => [
      field,
      normalizeFeedbackValue(field, value?.[field]),
    ])
  ) as ItemTagFeedbackSnapshot

export const createItemTagFeedbackSnapshot = (
  metadata: ItemSearchMetadata | null | undefined,
  itemType?: string | null
): ItemTagFeedbackSnapshot => {
  const fields = getItemTagFeedbackFields(itemType)

  return normalizeFeedbackSnapshotTaxonomy(
    createItemTagFeedbackSnapshotFromValue(metadata, fields),
    itemType
  )
}

export const createRawItemTagFeedbackSnapshot = (
  metadata: ItemSearchMetadata | null | undefined,
  itemType?: string | null
): ItemTagFeedbackSnapshot =>
  createItemTagFeedbackSnapshotFromValue(
    metadata,
    getItemTagFeedbackFields(itemType)
  )

export const normalizeItemTagFeedbackSnapshot = (
  value: Record<string, unknown> | null | undefined,
  itemType?: string | null
): ItemTagFeedbackSnapshot => {
  const fields = itemType
    ? getItemTagFeedbackFields(itemType)
    : ALL_ITEM_TAG_FEEDBACK_FIELDS

  return normalizeFeedbackSnapshotTaxonomy(
    createItemTagFeedbackSnapshotFromValue(value, fields),
    itemType
  )
}

export const normalizeItemTagFeedbackPatch = (
  value: Record<string, unknown> | null | undefined,
  itemType?: string | null,
  fields?: readonly ItemTagFeedbackField[]
): ItemTagFeedbackPatch => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  const availableFields = getItemTagFeedbackFields(itemType)
  const availableFieldSet = new Set<ItemTagFeedbackField>(availableFields)
  const candidateFields = fields ?? availableFields
  const patch: ItemTagFeedbackPatch = {}

  candidateFields.forEach((field) => {
    if (!availableFieldSet.has(field)) return
    if (!Object.prototype.hasOwnProperty.call(value, field)) return
    patch[field] = normalizeFeedbackValue(field, value[field])
  })

  return patch
}

export const buildItemTagFeedbackPatch = (
  baseSnapshot: ItemTagFeedbackSnapshot,
  nextSnapshot: ItemTagFeedbackSnapshot,
  itemType?: string | null
): ItemTagFeedbackPatch => {
  const patch: ItemTagFeedbackPatch = {}

  getItemTagFeedbackFields(itemType).forEach((field) => {
    const baseValue = baseSnapshot[field] ?? null
    const nextValue = nextSnapshot[field] ?? null
    if (
      stableSerializeFeedbackValue(baseValue) ===
      stableSerializeFeedbackValue(nextValue)
    ) {
      return
    }
    patch[field] = nextValue
  })

  return patch
}

export const hasItemTagFeedbackChanges = (patch: ItemTagFeedbackPatch) =>
  Object.keys(patch).length > 0

export const stableSerializeFeedbackRecord = (
  value: ItemTagFeedbackSnapshot | ItemTagFeedbackPatch
) => {
  const normalizedEntries = Object.entries(value)
    .filter(
      (entry): entry is [string, ItemTagFeedbackValue] => entry[1] !== undefined
    )
    .sort(([left], [right]) => left.localeCompare(right))

  return JSON.stringify(
    Object.fromEntries(
      normalizedEntries.map(([key, entryValue]) => [
        key,
        getStableFeedbackValue(entryValue),
      ])
    )
  )
}

const getStableFeedbackValue = (value: ItemTagFeedbackValue) =>
  Array.isArray(value)
    ? [...value].sort((left, right) => left.localeCompare(right))
    : (value ?? null)

const stableSerializeFeedbackValue = (value: ItemTagFeedbackValue) => {
  return JSON.stringify(getStableFeedbackValue(value))
}
