import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const readJson = (fileName) =>
  JSON.parse(fs.readFileSync(path.join(__dirname, fileName), 'utf8'))

const readOptionalJson = (fileName, createFallback) => {
  const filePath = path.join(__dirname, fileName)
  if (!fs.existsSync(filePath)) {
    return createFallback()
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

const createEmptyOverrides = () => ({
  revision: 1,
  updatedAt: null,
  items: {},
})

const FIELD_KIND_BY_NAME = {
  category: 'scalar',
  subcategory: 'scalar',
  pattern: 'array',
  material: 'array',
  structure: 'array',
  ornament: 'array',
  top_length: 'scalar',
  bottom_length: 'scalar',
  hair_length: 'scalar',
  fit: 'scalar',
  neckline: 'scalar',
  shoulder_style: 'scalar',
  sleeve_length: 'scalar',
  sleeve_style: 'scalar',
  skirt_silhouette: 'scalar',
  pant_shape: 'scalar',
  waist_height: 'scalar',
  dress_silhouette: 'scalar',
  waistline: 'scalar',
  haircut: 'scalar',
  texture: 'scalar',
  bangs: 'scalar',
  heel_type: 'scalar',
  heel_height: 'scalar',
  sole_height: 'scalar',
  shaft_height: 'scalar',
  sock_height: 'scalar',
}

const SCHEMA_SECTIONS_BY_KEY = {
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

const DETAIL_FIELDS = ['pattern', 'material', 'structure', 'ornament']

const ITEM_TYPE_EDITABLE_SECTIONS_BY_TYPE = {
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
  dresses: [
    {
      key: 'identity',
      fields: ['category', 'subcategory'],
    },
    {
      key: 'shape',
      fields: [
        'bottom_length',
        'dress_silhouette',
        'fit',
        'waistline',
        'neckline',
        'shoulder_style',
        'sleeve_length',
        'sleeve_style',
      ],
    },
    {
      key: 'detail',
      fields: DETAIL_FIELDS,
    },
  ],
  outerwear: [
    {
      key: 'identity',
      fields: ['category', 'subcategory'],
    },
    {
      key: 'shape',
      fields: [
        'top_length',
        'fit',
        'neckline',
        'shoulder_style',
        'sleeve_length',
        'sleeve_style',
      ],
    },
    {
      key: 'detail',
      fields: DETAIL_FIELDS,
    },
  ],
  tops: [
    {
      key: 'identity',
      fields: ['category', 'subcategory'],
    },
    {
      key: 'shape',
      fields: [
        'top_length',
        'fit',
        'neckline',
        'shoulder_style',
        'sleeve_length',
        'sleeve_style',
      ],
    },
    {
      key: 'detail',
      fields: DETAIL_FIELDS,
    },
  ],
  bottoms: [
    {
      key: 'identity',
      fields: ['category', 'subcategory'],
    },
    {
      key: 'shape',
      fields: [
        'bottom_length',
        'skirt_silhouette',
        'pant_shape',
        'waist_height',
      ],
    },
    {
      key: 'detail',
      fields: DETAIL_FIELDS,
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
      fields: DETAIL_FIELDS,
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
      fields: DETAIL_FIELDS,
    },
  ],
  hairAccessories: [
    {
      key: 'identity',
      fields: ['category', 'subcategory'],
    },
    {
      key: 'detail',
      fields: DETAIL_FIELDS,
    },
  ],
  headwear: [
    {
      key: 'identity',
      fields: ['category', 'subcategory'],
    },
    {
      key: 'detail',
      fields: DETAIL_FIELDS,
    },
  ],
  earrings: [
    {
      key: 'identity',
      fields: ['category', 'subcategory'],
    },
    {
      key: 'detail',
      fields: DETAIL_FIELDS,
    },
  ],
  neckwear: [
    {
      key: 'identity',
      fields: ['category', 'subcategory'],
    },
    {
      key: 'detail',
      fields: DETAIL_FIELDS,
    },
  ],
  bracelets: [
    {
      key: 'identity',
      fields: ['category', 'subcategory'],
    },
    {
      key: 'detail',
      fields: DETAIL_FIELDS,
    },
  ],
  rings: [
    {
      key: 'identity',
      fields: ['category', 'subcategory'],
    },
    {
      key: 'detail',
      fields: DETAIL_FIELDS,
    },
  ],
  gloves: [
    {
      key: 'identity',
      fields: ['category', 'subcategory'],
    },
    {
      key: 'detail',
      fields: DETAIL_FIELDS,
    },
  ],
  chokers: [
    {
      key: 'identity',
      fields: ['category', 'subcategory'],
    },
    {
      key: 'detail',
      fields: DETAIL_FIELDS,
    },
  ],
  chestAccessories: [
    {
      key: 'identity',
      fields: ['category', 'subcategory'],
    },
    {
      key: 'detail',
      fields: DETAIL_FIELDS,
    },
  ],
  pendants: [
    {
      key: 'identity',
      fields: ['category', 'subcategory'],
    },
    {
      key: 'detail',
      fields: DETAIL_FIELDS,
    },
  ],
  backpieces: [
    {
      key: 'identity',
      fields: ['category', 'subcategory'],
    },
    {
      key: 'detail',
      fields: DETAIL_FIELDS,
    },
  ],
  armDecorations: [
    {
      key: 'identity',
      fields: ['category', 'subcategory'],
    },
    {
      key: 'detail',
      fields: DETAIL_FIELDS,
    },
  ],
  handhelds: [
    {
      key: 'identity',
      fields: ['category', 'subcategory'],
    },
    {
      key: 'detail',
      fields: DETAIL_FIELDS,
    },
  ],
  faceDecorations: [
    {
      key: 'identity',
      fields: ['category', 'subcategory'],
    },
    {
      key: 'detail',
      fields: DETAIL_FIELDS,
    },
  ],
  bodyPaint: [
    {
      key: 'identity',
      fields: ['category', 'subcategory'],
    },
    {
      key: 'detail',
      fields: DETAIL_FIELDS,
    },
  ],
  unknown: [
    {
      key: 'identity',
      fields: ['category', 'subcategory'],
    },
    {
      key: 'detail',
      fields: DETAIL_FIELDS,
    },
  ],
}

const ITEM_TYPE_ORDER = [
  'hair',
  'dresses',
  'outerwear',
  'tops',
  'bottoms',
  'socks',
  'shoes',
  'hairAccessories',
  'headwear',
  'earrings',
  'neckwear',
  'bracelets',
  'rings',
  'gloves',
  'chokers',
  'chestAccessories',
  'pendants',
  'backpieces',
  'armDecorations',
  'handhelds',
  'faceDecorations',
  'bodyPaint',
]

const ITEM_TYPE_ALIAS_TO_SUPPORTED = {
  abilityHandhelds: 'handhelds',
}

const SCHEMA_KEY_BY_ITEM_TYPE = {
  hair: 'hair',
  dresses: 'garment',
  outerwear: 'garment',
  tops: 'garment',
  bottoms: 'garment',
  socks: 'socks',
  shoes: 'shoes',
  hairAccessories: 'accessory',
  headwear: 'accessory',
  earrings: 'accessory',
  neckwear: 'accessory',
  bracelets: 'accessory',
  rings: 'accessory',
  gloves: 'accessory',
  chokers: 'accessory',
  chestAccessories: 'accessory',
  pendants: 'accessory',
  backpieces: 'accessory',
  armDecorations: 'accessory',
  handhelds: 'accessory',
  faceDecorations: 'accessory',
  bodyPaint: 'accessory',
}

const SEARCH_NAMESPACES = ['en', 'zh']
const REVIEW_REQUIRED_LOCALES = ['en', 'zh']
const SCOPED_FIELD_NAMES = ['category', 'subcategory']

const normalizeItemType = (value) => {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  return ITEM_TYPE_ALIAS_TO_SUPPORTED[trimmed] ?? trimmed
}

const normalizeUniqueStrings = (values) =>
  Array.from(
    new Set(
      (values ?? [])
        .filter((value) => typeof value === 'string')
        .map((value) => value.trim())
        .filter(Boolean)
    )
  ).sort((left, right) => left.localeCompare(right))

const buildEditableSectionsByType = () =>
  Object.fromEntries(
    Object.keys(SCHEMA_KEY_BY_ITEM_TYPE).map((itemType) => [
      itemType,
      ITEM_TYPE_EDITABLE_SECTIONS_BY_TYPE[itemType] ??
        ITEM_TYPE_EDITABLE_SECTIONS_BY_TYPE.unknown,
    ])
  )

const buildFieldNamesByItemType = (editableSectionsByType) =>
  Object.fromEntries(
    Object.entries(editableSectionsByType).map(([itemType, sections]) => [
      itemType,
      normalizeUniqueStrings(sections.flatMap((section) => section.fields)),
    ])
  )

const normalizeScopedValuesByItemType = (valuesByItemType) =>
  Object.fromEntries(
    Object.entries(valuesByItemType ?? {}).map(([itemType, values]) => [
      normalizeItemType(itemType),
      normalizeUniqueStrings(values),
    ])
  )

const normalizeTaxonomyByItemType = (valuesByItemType) =>
  Object.fromEntries(
    Object.entries(valuesByItemType ?? {}).map(([itemType, parentMap]) => [
      normalizeItemType(itemType),
      sortObjectEntries(parentMap ?? {}),
    ])
  )

const sortObjectEntries = (value) =>
  Object.fromEntries(
    Object.entries(value).sort(([left], [right]) => left.localeCompare(right))
  )

export const loadItemSearchRegistry = () => {
  const terms = readJson('terms.json')
  const taxonomy = readJson('taxonomy.json')
  const overrides = readOptionalJson(
    path.join('generated', 'overrides.json'),
    createEmptyOverrides
  )
  const editableSectionsByType = buildEditableSectionsByType()
  const normalizedScopedFieldValues = Object.fromEntries(
    Object.entries(terms.scopedFieldValues ?? {}).map(
      ([field, valuesByItemType]) => [
        field,
        normalizeScopedValuesByItemType(valuesByItemType),
      ]
    )
  )
  const normalizedTaxonomy = {
    subcategoryParentByType: normalizeTaxonomyByItemType(
      taxonomy.subcategoryParentByType
    ),
  }

  const supportedItemTypes = ITEM_TYPE_ORDER.filter((itemType) =>
    Array.isArray(normalizedScopedFieldValues?.category?.[itemType])
  )

  return {
    version: 1,
    generatedFrom: 'tracker-registry',
    searchNamespaces: SEARCH_NAMESPACES,
    reviewRequiredLocales: REVIEW_REQUIRED_LOCALES,
    scopedFieldNames: SCOPED_FIELD_NAMES,
    fieldKindByName: FIELD_KIND_BY_NAME,
    schemaSectionsByKey: SCHEMA_SECTIONS_BY_KEY,
    schemaKeyByItemType: Object.fromEntries(
      supportedItemTypes.map((itemType) => [
        itemType,
        SCHEMA_KEY_BY_ITEM_TYPE[itemType],
      ])
    ),
    editableSectionsByType: Object.fromEntries(
      supportedItemTypes.map((itemType) => [
        itemType,
        editableSectionsByType[itemType],
      ])
    ),
    fieldNamesByItemType: buildFieldNamesByItemType(
      Object.fromEntries(
        supportedItemTypes.map((itemType) => [
          itemType,
          editableSectionsByType[itemType],
        ])
      )
    ),
    itemTypeAliasToSupported: ITEM_TYPE_ALIAS_TO_SUPPORTED,
    supportedItemTypes,
    terms: {
      ...terms,
      scopedFieldValues: normalizedScopedFieldValues,
    },
    taxonomy: normalizedTaxonomy,
    overrides,
    normalizeItemType,
  }
}
