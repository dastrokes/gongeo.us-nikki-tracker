import type {
  ItemSearchAdvancedScalarField,
  ItemSearchAdvancedScalarFilters,
  ItemSearchArrayField,
  ItemSearchField,
  ItemSearchFacetResponse,
  ItemSearchMetadata,
  ItemSearchMetadataDisplaySection,
  ItemSearchScalarField,
  ItemSearchSchemaKey,
  ItemSearchAdvancedFacetMap,
} from '../types/itemSearch'

export const ITEM_SEARCH_UNCATEGORIZED_VALUE = '__uncategorized__'

const ITEM_SEARCH_ARRAY_FIELDS: ItemSearchArrayField[] = [
  'pattern',
  'material',
  'structure',
  'ornament',
]

const ITEM_SEARCH_SCALAR_FIELDS: ItemSearchScalarField[] = [
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

export const ITEM_SEARCH_ADVANCED_SCALAR_FIELDS: ItemSearchAdvancedScalarField[] =
  ITEM_SEARCH_SCALAR_FIELDS.filter(
    (field): field is ItemSearchAdvancedScalarField =>
      field !== 'category' && field !== 'subcategory'
  )

const ITEM_SEARCH_ADVANCED_SCALAR_FIELD_SET =
  new Set<ItemSearchAdvancedScalarField>(ITEM_SEARCH_ADVANCED_SCALAR_FIELDS)

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

const ITEM_SEARCH_SECTIONS_BY_SCHEMA: Record<
  ItemSearchSchemaKey,
  ItemSearchSectionConfig[]
> = {
  garment: [
    {
      key: 'identity',

      fields: ['category', 'subcategory'],
    },
    {
      key: 'shape',

      fields: [
        'dress_silhouette',
        'skirt_silhouette',
        'pant_shape',
        'top_length',
        'bottom_length',
        'fit',
        'neckline',
        'shoulder_style',
        'sleeve_length',
        'sleeve_style',
        'waist_height',
        'waistline',
      ],
    },
    {
      key: 'detail',

      fields: ['pattern', 'material', 'structure', 'ornament'],
    },
  ],
  hair: [
    {
      key: 'identity',

      fields: ['category', 'subcategory'],
    },
    {
      key: 'shape',

      fields: ['hair_length', 'haircut', 'bangs', 'texture'],
    },
  ],
  shoes: [
    {
      key: 'identity',

      fields: ['category', 'subcategory'],
    },
    {
      key: 'shape',

      fields: ['heel_type', 'heel_height', 'sole_height', 'shaft_height'],
    },
    {
      key: 'detail',

      fields: ['pattern', 'material', 'structure', 'ornament'],
    },
  ],
  socks: [
    {
      key: 'identity',

      fields: ['category', 'subcategory'],
    },
    {
      key: 'shape',

      fields: ['sock_height'],
    },
    {
      key: 'detail',

      fields: ['pattern', 'material', 'structure', 'ornament'],
    },
  ],
  accessory: [
    {
      key: 'identity',

      fields: ['category', 'subcategory'],
    },
    {
      key: 'detail',

      fields: ['pattern', 'material', 'structure', 'ornament'],
    },
  ],
  unknown: [
    {
      key: 'identity',

      fields: ['category', 'subcategory'],
    },
    {
      key: 'detail',

      fields: ['pattern', 'material', 'structure', 'ornament'],
    },
  ],
}

const ITEM_SEARCH_FIELD_LABEL_KEYS: Record<ItemSearchField, string> = {
  category: 'compendium.search_field.category',
  subcategory: 'compendium.search_field.subcategory',
  pattern: 'compendium.search_field.pattern',
  material: 'compendium.search_field.material',
  structure: 'compendium.search_field.structure',
  ornament: 'compendium.search_field.ornament',
  top_length: 'compendium.search_field.top_length',
  bottom_length: 'compendium.search_field.bottom_length',
  hair_length: 'compendium.search_field.hair_length',
  fit: 'compendium.search_field.fit',
  neckline: 'compendium.search_field.neckline',
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

const ACCESSORY_ITEM_TYPES = new Set([
  'hairAccessories',
  'headwear',
  'earrings',
  'neckwear',
  'bracelets',
  'chokers',
  'gloves',
  'handhelds',
  'abilityHandhelds',
  'faceDecorations',
  'chestAccessories',
  'pendants',
  'backpieces',
  'rings',
  'armDecorations',
  'bodyPaint',
])

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
  (): ItemSearchAdvancedScalarFilters =>
    Object.fromEntries(
      ITEM_SEARCH_ADVANCED_SCALAR_FIELDS.map((field) => [field, null])
    ) as ItemSearchAdvancedScalarFilters

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
  if (itemType === 'abilityHandhelds') return 'handhelds'
  return itemType
}

export const getItemSearchSchemaKey = (
  itemType?: string | null
): ItemSearchSchemaKey => {
  const normalizedType = normalizeItemSearchItemType(itemType)

  if (
    normalizedType === 'outerwear' ||
    normalizedType === 'tops' ||
    normalizedType === 'bottoms' ||
    normalizedType === 'dresses'
  ) {
    return 'garment'
  }

  if (normalizedType === 'hair') return 'hair'
  if (normalizedType === 'shoes') return 'shoes'
  if (normalizedType === 'socks') return 'socks'
  if (ACCESSORY_ITEM_TYPES.has(normalizedType)) return 'accessory'
  return 'unknown'
}

export const supportsItemSearchCategoryFilters = (itemType?: string | null) => {
  if (!itemType) return false
  return getItemSearchSchemaKey(itemType) !== 'accessory'
}

export const getItemSearchAdvancedScalarFields = (
  itemType?: string | null
): ItemSearchAdvancedScalarField[] => {
  const schemaKey = getItemSearchSchemaKey(itemType)

  return ITEM_SEARCH_SECTIONS_BY_SCHEMA[schemaKey]
    .flatMap((section) => section.fields)
    .filter((field): field is ItemSearchAdvancedScalarField =>
      ITEM_SEARCH_ADVANCED_SCALAR_FIELD_SET.has(
        field as ItemSearchAdvancedScalarField
      )
    )
}

export const getItemSearchSchemaFields = (
  itemType?: string | null
): ItemSearchField[] => {
  const schemaKey = getItemSearchSchemaKey(itemType)

  return ITEM_SEARCH_SECTIONS_BY_SCHEMA[schemaKey].flatMap(
    (section) => section.fields
  )
}

export const isItemSearchArrayField = (
  field: ItemSearchField
): field is ItemSearchArrayField =>
  ITEM_SEARCH_ARRAY_FIELDS.includes(field as ItemSearchArrayField)

export const isItemSearchFieldKey = (field: string): field is ItemSearchField =>
  ITEM_SEARCH_SCALAR_FIELDS.includes(field as ItemSearchScalarField) ||
  ITEM_SEARCH_ARRAY_FIELDS.includes(field as ItemSearchArrayField)

export const getItemSearchAdvancedFacetValue = (
  field: ItemSearchAdvancedScalarField,
  value: unknown,
  facets?: ItemSearchFacetResponse['advanced']
) => {
  if (typeof value !== 'string') return null

  const options = facets?.[field] ?? []
  return resolveItemSearchFacetValue(value, options)
}

export const resolveItemSearchAdvancedFilters = (
  value: Record<string, unknown>,
  itemType?: string | null
): ItemSearchAdvancedScalarFilters => {
  const resolvedFilters = createEmptyItemSearchAdvancedFilters()

  getItemSearchAdvancedScalarFields(itemType).forEach((field) => {
    const rawValue = value[field]
    if (typeof rawValue !== 'string') return

    const normalized = normalizeItemSearchTokenKey(rawValue)
    if (!normalized) return

    resolvedFilters[field] = normalized
  })

  return resolvedFilters
}

export const getActiveItemSearchAdvancedFilters = (
  filters: ItemSearchAdvancedScalarFilters,
  itemType?: string | null
): ItemSearchAdvancedScalarFilters => {
  const activeFilters = createEmptyItemSearchAdvancedFilters()

  getItemSearchAdvancedScalarFields(itemType).forEach((field) => {
    const value = filters[field]
    if (!value) return

    const normalized = normalizeItemSearchTokenKey(value)
    if (!normalized) return

    activeFilters[field] = normalized
  })

  return activeFilters
}

export const serializeItemSearchAdvancedFilters = (
  filters: ItemSearchAdvancedScalarFilters,
  itemType?: string | null
) =>
  getItemSearchAdvancedScalarFields(itemType)
    .map((field) => {
      const value = filters[field]
      return value ? `${field}:${normalizeItemSearchTokenKey(value)}` : null
    })
    .filter((entry): entry is string => Boolean(entry))
    .join('|')

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

  ITEM_SEARCH_SCALAR_FIELDS.forEach((field) => {
    metadata[field] = toNullableString(value[field])
  })

  ITEM_SEARCH_ARRAY_FIELDS.forEach((field) => {
    const normalized = toStringArray(value[field])
    if (normalized.length > 0) {
      metadata[field] = normalized
    }
  })

  return metadata
}

export const hasItemSearchMetadata = (
  metadata?: ItemSearchMetadata | null
): boolean => {
  if (!metadata) return false

  return (
    ITEM_SEARCH_SCALAR_FIELDS.some((field) => Boolean(metadata[field])) ||
    ITEM_SEARCH_ARRAY_FIELDS.some(
      (field) => Array.isArray(metadata[field]) && metadata[field].length > 0
    )
  )
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
  itemType?: string | null
): ItemSearchMetadataDisplaySection[] => {
  if (!metadata) return []

  const schemaKey = getItemSearchSchemaKey(itemType ?? metadata.item_type)

  return ITEM_SEARCH_SECTIONS_BY_SCHEMA[schemaKey]
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
