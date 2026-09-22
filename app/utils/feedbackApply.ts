import enFilter from '../locales/en/filter.json'
import enMisc from '../locales/en/misc.json'
import zhFilter from '../locales/zh/filter.json'
import zhMisc from '../locales/zh/misc.json'
import { ITEM_SEARCH_SEARCH_NAMESPACES } from '#shared/constants/itemSearchRegistry'

type SearchNamespace = (typeof ITEM_SEARCH_SEARCH_NAMESPACES)[number]

type LocaleResources = {
  filter: Record<string, unknown>
  misc: Record<string, unknown>
}

const LOCALE_RESOURCES = {
  en: { filter: enFilter, misc: enMisc },
  zh: { filter: zhFilter, misc: zhMisc },
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

const humanizeToken = (value: string) =>
  value
    .split('_')
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(' ')

const uniqueTerms = (values: string[]) =>
  Array.from(
    new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean))
  )

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
  const path =
    field === 'category' || field === 'subcategory'
      ? ['filter', field, itemType, value]
      : ['filter', field, value]

  return (
    getNestedString(LOCALE_RESOURCES[namespace].filter, path) ??
    getNestedString(LOCALE_RESOURCES.en.filter, path) ??
    humanizeToken(value)
  )
}

const getFieldValues = (
  snapshot: ItemTagFeedbackSnapshot,
  field: ItemSearchField
) => {
  const value = snapshot[field]
  if (Array.isArray(value)) {
    return uniqueTerms(
      value.filter((entry): entry is string => typeof entry === 'string')
    )
  }
  return typeof value === 'string' && value.trim() ? [value.trim()] : []
}

export const buildFeedbackApplySearchTexts = (
  suggestion: FeedbackSuggestion,
  currentSnapshot: ItemTagFeedbackSnapshot
) => {
  const itemType = normalizeItemSearchItemType(suggestion.itemType ?? '')
  if (!isSupportedItemSearchItemType(itemType)) {
    throw new Error('Unsupported item feedback type')
  }

  const snapshot = normalizeItemTagFeedbackSnapshot(
    {
      ...currentSnapshot,
      ...suggestion.proposedPatch,
    },
    itemType
  )
  const fields = [
    'category',
    'subcategory',
    ...getItemSearchAdvancedFields(itemType),
  ] as ItemSearchField[]

  return Object.fromEntries(
    ITEM_SEARCH_SEARCH_NAMESPACES.map((namespace) => {
      const terms = [getLocalizedItemType(namespace, itemType)]
      fields.forEach((field) => {
        terms.push(
          ...getFieldValues(snapshot, field).map((value) =>
            getLocalizedFieldValue({ namespace, itemType, field, value })
          )
        )
      })
      return [namespace, uniqueTerms(terms).join(' ')]
    })
  ) as Record<SearchNamespace, string>
}
