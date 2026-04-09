import type {
  ItemSearchAdvancedFilters,
  ItemSearchAdvancedField,
  ItemSearchAdvancedFilterValue,
  ItemSearchAdvancedScalarField,
  ItemSearchArrayField,
  ItemSearchField,
  ItemSearchFacetResponse,
  ItemSearchMetadata,
  ItemSearchMetadataDisplaySection,
  ItemSearchScalarField,
  ItemSearchSchemaKey,
  ItemSearchAdvancedFacetMap,
} from '../types/itemSearch'
import { ITEM_SEARCH_SUBCATEGORY_PARENT_BY_TYPE } from '../constants/itemSearchTaxonomy'
import {
  ITEM_SEARCH_EDITABLE_SECTIONS_BY_TYPE as ITEM_SEARCH_EDITABLE_SECTIONS_BY_TYPE_DATA,
  ITEM_SEARCH_FIELD_KIND_BY_NAME,
  ITEM_SEARCH_ITEM_TYPE_ALIAS_TO_SUPPORTED,
  ITEM_SEARCH_SCHEMA_KEY_BY_ITEM_TYPE,
  ITEM_SEARCH_SCHEMA_SECTIONS_BY_KEY,
  ITEM_SEARCH_SUPPORTED_ITEM_TYPES,
} from '../constants/itemSearchRegistry'
import attributeOptionsData from '../../data/attribute.json'

export const ITEM_SEARCH_UNCATEGORIZED_VALUE = '__uncategorized__'

const ITEM_SEARCH_ARRAY_FIELDS = Object.entries(ITEM_SEARCH_FIELD_KIND_BY_NAME)
  .filter(([, kind]) => kind === 'array')
  .map(([field]) => field as ItemSearchArrayField)

const ITEM_SEARCH_ARRAY_FIELD_SET = new Set<ItemSearchArrayField>(
  ITEM_SEARCH_ARRAY_FIELDS
)

const ITEM_SEARCH_SCALAR_FIELDS = Object.entries(ITEM_SEARCH_FIELD_KIND_BY_NAME)
  .filter(([, kind]) => kind === 'scalar')
  .map(([field]) => field as ItemSearchScalarField)

const ITEM_SEARCH_SCALAR_FIELD_SET = new Set<ItemSearchScalarField>(
  ITEM_SEARCH_SCALAR_FIELDS
)

export const ITEM_SEARCH_ADVANCED_SCALAR_FIELDS: ItemSearchAdvancedScalarField[] =
  ITEM_SEARCH_SCALAR_FIELDS.filter(
    (field): field is ItemSearchAdvancedScalarField =>
      field !== 'category' && field !== 'subcategory'
  )

const ITEM_SEARCH_ADVANCED_SCALAR_FIELD_SET =
  new Set<ItemSearchAdvancedScalarField>(ITEM_SEARCH_ADVANCED_SCALAR_FIELDS)
const ITEM_SEARCH_ADVANCED_FIELD_SET = new Set<ItemSearchAdvancedField>([
  ...ITEM_SEARCH_ADVANCED_SCALAR_FIELDS,
  ...ITEM_SEARCH_ARRAY_FIELDS,
])
const ITEM_SEARCH_COMPENDIUM_ARRAY_ADVANCED_FIELDS =
  new Set<ItemSearchArrayField>(['garment_feature'])
const ITEM_SEARCH_COMPENDIUM_SINGLE_SELECT_ARRAY_FIELDS =
  new Set<ItemSearchArrayField>(['garment_feature'])

const isItemSearchAdvancedScalarField = (
  field: ItemSearchField
): field is ItemSearchAdvancedScalarField =>
  ITEM_SEARCH_ADVANCED_SCALAR_FIELD_SET.has(
    field as ItemSearchAdvancedScalarField
  )

export function isItemSearchFieldKey(field: string): field is ItemSearchField {
  return (
    ITEM_SEARCH_SCALAR_FIELD_SET.has(field as ItemSearchScalarField) ||
    ITEM_SEARCH_ARRAY_FIELD_SET.has(field as ItemSearchArrayField)
  )
}

const ITEM_SEARCH_TOKEN_LABEL_OVERRIDES: Record<string, string> = {
  a_line: 'A-line',
  t_shirt: 'T-Shirt',
  t_strap_heels: 'T-strap Heels',
  v_neck: 'V-neck',
  peter_pan_collar: 'Peter Pan Collar',
}

type ItemSearchSectionConfig = {
  key: string
  fields: ItemSearchField[]
}

type ItemSearchMetadataSectionOptions = {
  editableOnly?: boolean
}

const ITEM_SEARCH_SECTIONS_BY_SCHEMA =
  ITEM_SEARCH_SCHEMA_SECTIONS_BY_KEY as unknown as Record<
    ItemSearchSchemaKey,
    ItemSearchSectionConfig[]
  >

const ITEM_SEARCH_EDITABLE_SECTIONS_BY_TYPE =
  ITEM_SEARCH_EDITABLE_SECTIONS_BY_TYPE_DATA as unknown as Record<
    string,
    ItemSearchSectionConfig[]
  >

const ITEM_SEARCH_SCHEMA_FIELDS_BY_SCHEMA = Object.fromEntries(
  (
    Object.entries(ITEM_SEARCH_SECTIONS_BY_SCHEMA) as Array<
      [ItemSearchSchemaKey, ItemSearchSectionConfig[]]
    >
  ).map(([schemaKey, sections]) => [
    schemaKey,
    sections.flatMap((section) => section.fields),
  ])
) as Record<ItemSearchSchemaKey, ItemSearchField[]>

const ITEM_SEARCH_ADVANCED_FIELDS_BY_TYPE = Object.fromEntries(
  Object.entries(ITEM_SEARCH_EDITABLE_SECTIONS_BY_TYPE).map(
    ([itemType, sections]) => [
      itemType,
      sections
        .flatMap((section) => section.fields)
        .filter((field): field is ItemSearchAdvancedField =>
          ITEM_SEARCH_ADVANCED_FIELD_SET.has(field as ItemSearchAdvancedField)
        ),
    ]
  )
) as Record<string, ItemSearchAdvancedField[]>

const ITEM_SEARCH_ADVANCED_SCALAR_FIELDS_BY_TYPE = Object.fromEntries(
  Object.entries(ITEM_SEARCH_ADVANCED_FIELDS_BY_TYPE).map(
    ([itemType, fields]) => [
      itemType,
      fields.filter((field): field is ItemSearchAdvancedScalarField =>
        isItemSearchAdvancedScalarField(field)
      ),
    ]
  )
) as Record<string, ItemSearchAdvancedScalarField[]>

const ALL_EDITABLE_ITEM_SEARCH_ADVANCED_FIELDS = Array.from(
  new Set(
    Object.values(ITEM_SEARCH_ADVANCED_FIELDS_BY_TYPE).flatMap(
      (fields) => fields
    )
  )
)

const ITEM_SEARCH_FIELD_LABEL_KEYS: Record<ItemSearchField, string> = {
  category: 'compendium.search_field.category',
  subcategory: 'compendium.search_field.subcategory',
  pattern: 'compendium.search_field.pattern',
  material: 'compendium.search_field.material',
  structure: 'compendium.search_field.structure',
  ornament: 'compendium.search_field.ornament',
  garment_feature: 'compendium.search_field.garment_feature',
  top_length: 'compendium.search_field.top_length',
  bottom_length: 'compendium.search_field.bottom_length',
  hair_length: 'compendium.search_field.hair_length',
  fit: 'compendium.search_field.fit',
  neckline: 'compendium.search_field.neckline',
  collar_style: 'compendium.search_field.collar_style',
  shoulder_style: 'compendium.search_field.shoulder_style',
  sleeve_length: 'compendium.search_field.sleeve_length',
  sleeve_style: 'compendium.search_field.sleeve_style',
  skirt_silhouette: 'compendium.search_field.skirt_silhouette',
  pant_shape: 'compendium.search_field.pant_shape',
  waist_height: 'compendium.search_field.waist_height',
  dress_silhouette: 'compendium.search_field.dress_silhouette',
  waistline: 'compendium.search_field.waistline',
  haircut: 'compendium.search_field.haircut',
  texture: 'compendium.search_field.texture',
  bangs: 'compendium.search_field.bangs',
  heel_type: 'compendium.search_field.heel_type',
  heel_height: 'compendium.search_field.heel_height',
  sole_height: 'compendium.search_field.sole_height',
  shaft_height: 'compendium.search_field.shaft_height',
  sock_height: 'compendium.search_field.sock_height',
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []

  return Array.from(
    new Set(
      value
        .filter((entry): entry is string => typeof entry === 'string')
        .map((entry) => entry.trim())
        .filter(Boolean)
    )
  )
}

const toNullableString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

export const normalizeItemSearchTokenKey = (value?: string | null) => {
  if (!value) return ''
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
}

export const createEmptyItemSearchAdvancedFilters =
  (): ItemSearchAdvancedFilters =>
    Object.fromEntries(
      ALL_EDITABLE_ITEM_SEARCH_ADVANCED_FIELDS.map((field) => [
        field,
        isItemSearchArrayField(field) ? [] : null,
      ])
    ) as ItemSearchAdvancedFilters

export const humanizeItemSearchToken = (value?: string | null) => {
  const normalized = normalizeItemSearchTokenKey(value)
  if (!normalized) return ''

  const override = ITEM_SEARCH_TOKEN_LABEL_OVERRIDES[normalized]
  if (override) return override

  return normalized
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export const getItemSearchFieldLabelKey = (field: ItemSearchField) =>
  ITEM_SEARCH_FIELD_LABEL_KEYS[field]

export const sortItemSearchFacetValues = (values: string[]) => {
  return [...values].sort((a, b) => {
    if (a === ITEM_SEARCH_UNCATEGORIZED_VALUE) return 1
    if (b === ITEM_SEARCH_UNCATEGORIZED_VALUE) return -1
    return a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true })
  })
}

export const sortItemSearchFacetMap = (
  facets: ItemSearchAdvancedFacetMap
): ItemSearchAdvancedFacetMap => {
  const result: ItemSearchAdvancedFacetMap = {}
  Object.keys(facets).forEach((key) => {
    const field = key as keyof ItemSearchAdvancedFacetMap
    result[field] = sortItemSearchFacetValues(facets[field] || [])
  })
  return result
}

export const normalizeItemSearchItemType = (itemType?: string | null) => {
  if (!itemType) return 'unknown'
  return (
    ITEM_SEARCH_ITEM_TYPE_ALIAS_TO_SUPPORTED[
      itemType as keyof typeof ITEM_SEARCH_ITEM_TYPE_ALIAS_TO_SUPPORTED
    ] ?? itemType
  )
}

type ItemSearchAttributeOptionEntry = {
  field: string
  itemType: string | null
  value: string
}

const ITEM_SEARCH_ATTRIBUTE_GLOBAL_TYPE = '__all__'

type ItemSearchAttributeScope = {
  category?: string | null
  subcategory?: string | null
}

const SKIRT_LIKE_BOTTOM_LENGTH_VALUES = [
  'floor_length',
  'knee_length',
  'maxi',
  'midi',
  'mini',
]

const LEGWEAR_BOTTOM_LENGTH_VALUES = [
  'ankle_length',
  'mid_calf',
  'knee_length',
  'mid_thigh',
  'upper_thigh',
]

const SKORT_BOTTOM_LENGTH_VALUES = [
  'knee_length',
  'mid_thigh',
  'mini',
  'upper_thigh',
]

const ITEM_SEARCH_CATEGORY_FIELD_ALLOWLIST_BY_TYPE: Partial<
  Record<string, Partial<Record<ItemSearchAdvancedField, string[]>>>
> = {
  bottoms: {
    skirt_silhouette: ['skirt', 'skort'],
    pant_shape: ['pants', 'overalls'],
  },
  dresses: {
    dress_silhouette: ['dress'],
  },
  shoes: {
    shaft_height: ['boots'],
  },
}

const ITEM_SEARCH_CATEGORY_VALUE_ALLOWLIST_BY_TYPE: Partial<
  Record<
    string,
    Partial<Record<ItemSearchField, Partial<Record<string, string[]>>>>
  >
> = {
  bottoms: {
    bottom_length: {
      overalls: LEGWEAR_BOTTOM_LENGTH_VALUES,
      pants: LEGWEAR_BOTTOM_LENGTH_VALUES,
      shorts: ['knee_length', 'mid_thigh', 'upper_thigh'],
      skirt: SKIRT_LIKE_BOTTOM_LENGTH_VALUES,
      skort: SKORT_BOTTOM_LENGTH_VALUES,
    },
  },
  dresses: {
    bottom_length: {
      dress: SKIRT_LIKE_BOTTOM_LENGTH_VALUES,
      jumpsuit: LEGWEAR_BOTTOM_LENGTH_VALUES,
    },
  },
}

function resolveItemSearchScopeCategory(
  itemType?: string | null,
  scope: ItemSearchAttributeScope = {}
): string | null {
  return normalizeItemSearchTaxonomySelection({
    itemType,
    category: scope.category,
    subcategory: scope.subcategory,
  }).category
}

function isItemSearchFieldAllowedForScope(
  field: ItemSearchField,
  itemType?: string | null,
  scope: ItemSearchAttributeScope = {}
): boolean {
  const normalizedType = normalizeItemSearchItemType(itemType)
  const scopedCategory = resolveItemSearchScopeCategory(itemType, scope)
  const allowedCategories =
    ITEM_SEARCH_CATEGORY_FIELD_ALLOWLIST_BY_TYPE[normalizedType]?.[
      field as ItemSearchAdvancedField
    ]

  if (!allowedCategories?.length || !scopedCategory) {
    return true
  }

  return allowedCategories.includes(scopedCategory)
}

function getItemSearchScopedAllowedValues(
  field: ItemSearchField,
  itemType?: string | null,
  scope: ItemSearchAttributeScope = {}
): string[] | null {
  const normalizedType = normalizeItemSearchItemType(itemType)
  const scopedCategory = resolveItemSearchScopeCategory(itemType, scope)

  if (!scopedCategory) {
    return null
  }

  return (
    ITEM_SEARCH_CATEGORY_VALUE_ALLOWLIST_BY_TYPE[normalizedType]?.[field]?.[
      scopedCategory
    ] ?? null
  )
}

const ITEM_SEARCH_ATTRIBUTE_VALUES_BY_TYPE = (() => {
  const valuesByType: Record<
    string,
    Partial<Record<ItemSearchField, string[]>>
  > = {}

  ;(attributeOptionsData as ItemSearchAttributeOptionEntry[]).forEach(
    (entry) => {
      const field = entry.field as ItemSearchField
      if (
        !ITEM_SEARCH_SCALAR_FIELD_SET.has(field as ItemSearchScalarField) &&
        !ITEM_SEARCH_ARRAY_FIELD_SET.has(field as ItemSearchArrayField)
      ) {
        return
      }

      const normalizedValue = normalizeItemSearchTokenKey(entry.value)
      if (!normalizedValue) return

      const normalizedType = entry.itemType
        ? normalizeItemSearchItemType(entry.itemType)
        : ITEM_SEARCH_ATTRIBUTE_GLOBAL_TYPE

      const typeValues = (valuesByType[normalizedType] ??= {})
      const fieldValues = (typeValues[field] ??= [])

      if (!fieldValues.includes(normalizedValue)) {
        fieldValues.push(normalizedValue)
      }
    }
  )

  Object.values(valuesByType).forEach((typeValues) => {
    Object.keys(typeValues).forEach((key) => {
      const field = key as ItemSearchField
      typeValues[field] = sortItemSearchFacetValues(typeValues[field] ?? [])
    })
  })

  return valuesByType
})()

const ITEM_SEARCH_ATTRIBUTE_VALUES_BY_FIELD = (() => {
  const valuesByField: Partial<Record<ItemSearchField, string[]>> = {}

  Object.values(ITEM_SEARCH_ATTRIBUTE_VALUES_BY_TYPE).forEach((typeValues) => {
    Object.entries(typeValues).forEach(([key, values]) => {
      const field = key as ItemSearchField
      valuesByField[field] = Array.from(
        new Set([...(valuesByField[field] ?? []), ...(values ?? [])])
      )
    })
  })

  Object.keys(valuesByField).forEach((key) => {
    const field = key as ItemSearchField
    valuesByField[field] = sortItemSearchFacetValues(valuesByField[field] ?? [])
  })

  return valuesByField
})()

export const getItemSearchAttributeValues = (
  field: ItemSearchField,
  itemType?: string | null,
  scope: ItemSearchAttributeScope = {}
): string[] => {
  const globalValues =
    ITEM_SEARCH_ATTRIBUTE_VALUES_BY_TYPE[ITEM_SEARCH_ATTRIBUTE_GLOBAL_TYPE]?.[
      field
    ] ?? []

  let baseValues: string[]

  if (!itemType) {
    baseValues = ITEM_SEARCH_ATTRIBUTE_VALUES_BY_FIELD[field] ?? []
  } else {
    const normalizedType = normalizeItemSearchItemType(itemType)
    if (normalizedType === 'unknown') {
      baseValues = [...globalValues]
    } else {
      baseValues = sortItemSearchFacetValues(
        Array.from(
          new Set([
            ...globalValues,
            ...(ITEM_SEARCH_ATTRIBUTE_VALUES_BY_TYPE[normalizedType]?.[field] ??
              []),
          ])
        )
      )
    }
  }

  if (field === 'category' || field === 'subcategory') {
    return baseValues
  }

  if (!isItemSearchFieldAllowedForScope(field, itemType, scope)) {
    return []
  }

  const allowedValues = getItemSearchScopedAllowedValues(field, itemType, scope)
  if (!allowedValues?.length) {
    return baseValues
  }

  return baseValues.filter((value) => allowedValues.includes(value))
}

export type ItemSearchTaxonomyCategoryNode = {
  category: string
  subcategories: string[]
}

export type ItemSearchTaxonomyTree = {
  categories: ItemSearchTaxonomyCategoryNode[]
  ungroupedSubcategories: string[]
}

const getItemSearchSubcategoryParentMap = (
  itemType?: string | null
): Readonly<Record<string, string>> =>
  (ITEM_SEARCH_SUBCATEGORY_PARENT_BY_TYPE[
    normalizeItemSearchItemType(
      itemType
    ) as keyof typeof ITEM_SEARCH_SUBCATEGORY_PARENT_BY_TYPE
  ] ?? {}) as Readonly<Record<string, string>>

export const getItemSearchSubcategoryParent = (
  itemType?: string | null,
  subcategory?: string | null
): string | null => {
  const normalizedSubcategory = normalizeItemSearchTokenKey(subcategory)
  if (!normalizedSubcategory) return null

  return (
    getItemSearchSubcategoryParentMap(itemType)[normalizedSubcategory] ?? null
  )
}

export const getItemSearchSubcategoryOptions = (
  itemType?: string | null,
  category?: string | null
): string[] => {
  const allSubcategories = getItemSearchAttributeValues('subcategory', itemType)
  const normalizedCategory = normalizeItemSearchTokenKey(category)

  if (!normalizedCategory) {
    return allSubcategories
  }

  const scopedSubcategories = allSubcategories.filter(
    (subcategory) =>
      getItemSearchSubcategoryParent(itemType, subcategory) ===
      normalizedCategory
  )

  return scopedSubcategories.length > 0 ? scopedSubcategories : allSubcategories
}

export const getItemSearchTaxonomyTree = (
  itemType?: string | null
): ItemSearchTaxonomyTree => {
  const categories = getItemSearchAttributeValues('category', itemType)
  const subcategories = getItemSearchAttributeValues('subcategory', itemType)
  const mappedSubcategories = new Set<string>()

  const categoryNodes = categories.map((category) => {
    const categorySubcategories = subcategories.filter((subcategory) => {
      const matches =
        getItemSearchSubcategoryParent(itemType, subcategory) === category
      if (matches) {
        mappedSubcategories.add(subcategory)
      }
      return matches
    })

    return {
      category,
      subcategories: categorySubcategories,
    }
  })

  return {
    categories: categoryNodes,
    ungroupedSubcategories: subcategories.filter(
      (subcategory) => !mappedSubcategories.has(subcategory)
    ),
  }
}

export const normalizeItemSearchTaxonomySelection = ({
  itemType,
  category,
  subcategory,
}: {
  itemType?: string | null
  category?: string | null
  subcategory?: string | null
}): {
  category: string | null
  subcategory: string | null
} => {
  const categories = getItemSearchAttributeValues('category', itemType)
  const subcategories = getItemSearchAttributeValues('subcategory', itemType)
  const normalizedCategoryInput = normalizeItemSearchTokenKey(category)
  const normalizedSubcategoryInput = normalizeItemSearchTokenKey(subcategory)

  let normalizedCategory =
    normalizedCategoryInput && categories.includes(normalizedCategoryInput)
      ? normalizedCategoryInput
      : null
  let normalizedSubcategory =
    normalizedSubcategoryInput &&
    subcategories.includes(normalizedSubcategoryInput)
      ? normalizedSubcategoryInput
      : null

  if (!normalizedCategory && normalizedCategoryInput) {
    const promotedCategory = getItemSearchSubcategoryParent(
      itemType,
      normalizedCategoryInput
    )
    if (promotedCategory) {
      if (
        !normalizedSubcategory ||
        normalizedSubcategory === normalizedCategoryInput
      ) {
        normalizedSubcategory = normalizedCategoryInput
      }
      normalizedCategory = promotedCategory
    }
  }

  const expectedParent = getItemSearchSubcategoryParent(
    itemType,
    normalizedSubcategory
  )
  if (expectedParent && normalizedCategory !== expectedParent) {
    normalizedCategory = expectedParent
  }

  if (
    normalizedSubcategory &&
    normalizedCategory &&
    normalizedSubcategory === normalizedCategory
  ) {
    normalizedSubcategory = null
  }

  return {
    category: normalizedCategory,
    subcategory: normalizedSubcategory,
  }
}

export const getItemSearchTaxonomyItemTypes = () =>
  [...ITEM_SEARCH_SUPPORTED_ITEM_TYPES].filter(
    (itemType) => getItemSearchAttributeValues('category', itemType).length > 0
  )

export const isSupportedItemSearchItemType = (itemType?: string | null) =>
  ITEM_SEARCH_SUPPORTED_ITEM_TYPES.includes(
    normalizeItemSearchItemType(
      itemType
    ) as (typeof ITEM_SEARCH_SUPPORTED_ITEM_TYPES)[number]
  )

export const getItemSearchSchemaKey = (
  itemType?: string | null
): ItemSearchSchemaKey => {
  const normalizedType = normalizeItemSearchItemType(itemType)
  return (ITEM_SEARCH_SCHEMA_KEY_BY_ITEM_TYPE[
    normalizedType as keyof typeof ITEM_SEARCH_SCHEMA_KEY_BY_ITEM_TYPE
  ] ?? 'unknown') as ItemSearchSchemaKey
}

export const getItemSearchAdvancedScalarFields = (
  itemType?: string | null
): ItemSearchAdvancedScalarField[] => {
  const normalizedType = itemType
    ? normalizeItemSearchItemType(itemType)
    : 'unknown'

  if (!itemType) {
    return ITEM_SEARCH_ADVANCED_SCALAR_FIELDS
  }

  return (
    ITEM_SEARCH_ADVANCED_SCALAR_FIELDS_BY_TYPE[normalizedType] ??
    ITEM_SEARCH_ADVANCED_SCALAR_FIELDS_BY_TYPE.unknown ??
    []
  )
}

export const getItemSearchAdvancedFields = (
  itemType?: string | null
): ItemSearchAdvancedField[] => {
  if (!itemType) {
    return ALL_EDITABLE_ITEM_SEARCH_ADVANCED_FIELDS
  }

  const normalizedType = normalizeItemSearchItemType(itemType)
  return (
    ITEM_SEARCH_ADVANCED_FIELDS_BY_TYPE[normalizedType] ??
    ITEM_SEARCH_ADVANCED_FIELDS_BY_TYPE.unknown ??
    []
  )
}

export const getItemSearchCompendiumAdvancedFields = (
  itemType?: string | null
): ItemSearchAdvancedField[] =>
  getItemSearchAdvancedFields(itemType).filter(
    (field) =>
      !isItemSearchArrayField(field) ||
      ITEM_SEARCH_COMPENDIUM_ARRAY_ADVANCED_FIELDS.has(field)
  )

export const isItemSearchCompendiumSingleSelectArrayField = (
  field: ItemSearchAdvancedField
): field is ItemSearchArrayField =>
  isItemSearchArrayField(field) &&
  ITEM_SEARCH_COMPENDIUM_SINGLE_SELECT_ARRAY_FIELDS.has(field)

export const normalizeItemSearchCompendiumAdvancedFilters = (
  filters: ItemSearchAdvancedFilters,
  itemType?: string | null
): ItemSearchAdvancedFilters => {
  const normalizedFilters = createEmptyItemSearchAdvancedFilters()
  const activeFilters = getActiveItemSearchAdvancedFilters(filters, itemType)

  getItemSearchCompendiumAdvancedFields(itemType).forEach((field) => {
    const value = activeFilters[field]

    if (isItemSearchCompendiumSingleSelectArrayField(field)) {
      normalizedFilters[field] =
        Array.isArray(value) && value.length > 0 ? [value[0] as string] : []
      return
    }

    normalizedFilters[field] = value
  })

  return normalizedFilters
}

export const getItemSearchAttributeFacets = (
  itemType?: string | null,
  scope: ItemSearchAttributeScope = {}
): ItemSearchFacetResponse => {
  const normalizedTaxonomy = normalizeItemSearchTaxonomySelection({
    itemType,
    category: scope.category,
    subcategory: scope.subcategory,
  })
  const advanced: ItemSearchAdvancedFacetMap = {}

  getItemSearchAdvancedFields(itemType).forEach((field) => {
    const values = getItemSearchAttributeValues(field, itemType, scope)
    if (values.length > 0) {
      advanced[field] = values
    }
  })

  return {
    categories: getItemSearchAttributeValues('category', itemType),
    subcategories: getItemSearchSubcategoryOptions(
      itemType,
      normalizedTaxonomy.category
    ),
    advanced,
  }
}

export const getItemSearchSchemaFields = (
  itemType?: string | null
): ItemSearchField[] => {
  const schemaKey = getItemSearchSchemaKey(itemType)

  return ITEM_SEARCH_SCHEMA_FIELDS_BY_SCHEMA[schemaKey]
}

export const isItemSearchArrayField = (
  field: ItemSearchField
): field is ItemSearchArrayField =>
  ITEM_SEARCH_ARRAY_FIELD_SET.has(field as ItemSearchArrayField)

const normalizeAdvancedArrayFilterValue = (value: unknown): string[] => {
  const rawValues = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : []

  return Array.from(
    new Set(
      rawValues
        .filter((entry): entry is string => typeof entry === 'string')
        .flatMap((entry) => entry.split(','))
        .map((entry) => normalizeItemSearchTokenKey(entry))
        .filter(Boolean)
    )
  ).sort((left, right) => left.localeCompare(right))
}

export const hasActiveItemSearchAdvancedFilterValue = (
  value: ItemSearchAdvancedFilterValue
) =>
  typeof value === 'string'
    ? Boolean(normalizeItemSearchTokenKey(value))
    : Array.isArray(value)
      ? value.length > 0
      : false

export const getItemSearchAdvancedFacetValue = (
  field: ItemSearchAdvancedField,
  value: unknown,
  facets?: ItemSearchFacetResponse['advanced']
): ItemSearchAdvancedFilterValue => {
  const options = facets?.[field] ?? []

  if (isItemSearchArrayField(field)) {
    const resolvedValues = normalizeAdvancedArrayFilterValue(value)
      .map((entry) => resolveItemSearchFacetValue(entry, options))
      .filter((entry): entry is string => Boolean(entry))

    return resolvedValues.length > 0 ? resolvedValues : []
  }

  if (typeof value !== 'string') return null
  return resolveItemSearchFacetValue(value, options)
}

export const resolveItemSearchAdvancedFilters = (
  value: Record<string, unknown>,
  itemType?: string | null
): ItemSearchAdvancedFilters => {
  const resolvedFilters = createEmptyItemSearchAdvancedFilters()

  getItemSearchAdvancedFields(itemType).forEach((field) => {
    const rawValue = value[field]

    if (isItemSearchArrayField(field)) {
      resolvedFilters[field] = normalizeAdvancedArrayFilterValue(rawValue)
      return
    }

    if (typeof rawValue !== 'string') return
    const normalized = normalizeItemSearchTokenKey(rawValue)
    if (!normalized) return
    resolvedFilters[field] = normalized
  })

  return resolvedFilters
}

export const getActiveItemSearchAdvancedFilters = (
  filters: ItemSearchAdvancedFilters,
  itemType?: string | null
): ItemSearchAdvancedFilters => {
  const activeFilters = createEmptyItemSearchAdvancedFilters()

  getItemSearchAdvancedFields(itemType).forEach((field) => {
    const value = filters[field]
    if (isItemSearchArrayField(field)) {
      const normalizedValues = normalizeAdvancedArrayFilterValue(value)
      if (normalizedValues.length > 0) {
        activeFilters[field] = normalizedValues
      }
      return
    }

    if (typeof value !== 'string') return
    const normalized = normalizeItemSearchTokenKey(value)
    if (!normalized) return
    activeFilters[field] = normalized
  })

  return activeFilters
}

export const serializeItemSearchAdvancedFilters = (
  filters: ItemSearchAdvancedFilters,
  itemType?: string | null
) =>
  getItemSearchAdvancedFields(itemType)
    .map((field) => {
      const value = filters[field]

      if (isItemSearchArrayField(field)) {
        const normalizedValues = normalizeAdvancedArrayFilterValue(value)
        return normalizedValues.length > 0
          ? `${field}:${normalizedValues.join(',')}`
          : null
      }

      if (typeof value !== 'string') return null
      const normalized = normalizeItemSearchTokenKey(value)
      return normalized ? `${field}:${normalized}` : null
    })
    .filter((entry): entry is string => Boolean(entry))
    .join('|')

export const buildItemSearchAdvancedFilterQuery = (
  filters: ItemSearchAdvancedFilters,
  itemType?: string | null,
  fields: ItemSearchAdvancedField[] = getItemSearchAdvancedFields(itemType)
) =>
  Object.fromEntries(
    fields
      .map((field) => {
        const value = filters[field]

        if (isItemSearchArrayField(field)) {
          const normalizedValues = normalizeAdvancedArrayFilterValue(value)
          return normalizedValues.length > 0
            ? [field, normalizedValues.join(',')]
            : null
        }

        if (typeof value !== 'string') return null
        const normalized = normalizeItemSearchTokenKey(value)
        return normalized ? [field, normalized] : null
      })
      .filter((entry): entry is [string, string] => Boolean(entry))
  )

export const normalizeItemSearchMetadata = (
  value: unknown
): ItemSearchMetadata | null => {
  if (!isRecord(value)) return null

  const metadata: ItemSearchMetadata = {
    item_id:
      typeof value.item_id === 'number' || typeof value.item_id === 'string'
        ? value.item_id
        : undefined,
    item_type: normalizeItemSearchItemType(
      toNullableString(value.item_type ?? value.slot)
    ),
    slot: normalizeItemSearchItemType(toNullableString(value.slot)),
  }

  const m = metadata as unknown as Record<string, unknown>
  ITEM_SEARCH_SCALAR_FIELDS.forEach((field) => {
    m[field] = toNullableString(value[field])
  })

  ITEM_SEARCH_ARRAY_FIELDS.forEach((field) => {
    const normalized = toStringArray(value[field])
    if (normalized.length > 0) {
      m[field] = normalized
    }
  })

  return metadata
}

export const hydrateItemSearchMetadata = ({
  metadata,
  itemId,
  itemType,
  category,
  subcategory,
}: {
  metadata?: Record<string, unknown> | ItemSearchMetadata | null
  itemId?: number | string | null
  itemType?: string | null
  category?: string | null
  subcategory?: string | null
}): ItemSearchMetadata | null => {
  const rawMetadata = isRecord(metadata) ? metadata : {}
  const resolvedItemType = normalizeItemSearchItemType(
    toNullableString(itemType ?? rawMetadata.item_type ?? rawMetadata.slot)
  )

  return normalizeItemSearchMetadata({
    ...rawMetadata,
    item_id: itemId ?? rawMetadata.item_id,
    item_type: resolvedItemType,
    slot: resolvedItemType,
    category: category ?? rawMetadata.category ?? null,
    subcategory: subcategory ?? rawMetadata.subcategory ?? null,
  })
}

export const getItemSearchMetadataFromAttributes = (
  attributes:
    | {
        item_id?: number | string | null
        item_type?: string | null
        category?: string | null
        subcategory?: string | null
        metadata?: Record<string, unknown> | ItemSearchMetadata | null
      }
    | null
    | undefined
): ItemSearchMetadata | null => {
  if (!attributes) return null

  return hydrateItemSearchMetadata({
    metadata: attributes.metadata,
    itemId: attributes.item_id,
    itemType: attributes.item_type,
    category: attributes.category ?? null,
    subcategory: attributes.subcategory ?? null,
  })
}

export const resolveItemSearchFacetValue = (
  value: string | null | undefined,
  options: string[]
) => {
  const normalized = normalizeItemSearchTokenKey(value)
  if (!normalized) return null

  const match = options.find(
    (option) => normalizeItemSearchTokenKey(option) === normalized
  )
  return match ?? null
}

export const isItemSearchUncategorizedValue = (value?: string | null) =>
  normalizeItemSearchTokenKey(value) === ITEM_SEARCH_UNCATEGORIZED_VALUE

export const getItemSearchFieldValues = (
  metadata: ItemSearchMetadata | null | undefined,
  field: ItemSearchField
) => {
  if (!metadata) return []
  const value = metadata[field]

  if (typeof value === 'string') {
    return value.trim() ? [value.trim()] : []
  }

  if (Array.isArray(value)) {
    return value
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }

  return []
}

export const getItemSearchMetadataSections = (
  metadata: ItemSearchMetadata | null | undefined,
  itemType?: string | null,
  options: ItemSearchMetadataSectionOptions = {}
): ItemSearchMetadataDisplaySection[] => {
  if (!metadata) return []

  const normalizedType = normalizeItemSearchItemType(
    itemType ?? metadata.item_type
  )
  const schemaKey = getItemSearchSchemaKey(normalizedType)
  const sections = options.editableOnly
    ? (ITEM_SEARCH_EDITABLE_SECTIONS_BY_TYPE[normalizedType] ??
      ITEM_SEARCH_EDITABLE_SECTIONS_BY_TYPE.unknown ??
      [])
    : (ITEM_SEARCH_SECTIONS_BY_SCHEMA[schemaKey] ?? [])

  return sections
    .map((section) => ({
      key: section.key,
      fields: section.fields
        .map((field) => ({
          field,
          labelKey: getItemSearchFieldLabelKey(field),
          values: getItemSearchFieldValues(metadata, field),
        }))
        .filter((field) => field.values.length > 0),
    }))
    .filter((section) => section.fields.length > 0)
}
