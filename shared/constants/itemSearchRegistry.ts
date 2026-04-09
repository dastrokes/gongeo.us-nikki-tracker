export const ITEM_SEARCH_SUPPORTED_ITEM_TYPES = [
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
] as const

export const ITEM_SEARCH_SEARCH_NAMESPACES = ['en', 'zh'] as const

export const ITEM_SEARCH_REVIEW_REQUIRED_LOCALES = ['en', 'zh'] as const

export const ITEM_SEARCH_SCOPED_FIELD_NAMES = [
  'category',
  'subcategory',
] as const

export const ITEM_SEARCH_FIELD_KIND_BY_NAME = {
  bangs: 'scalar',
  bottom_length: 'scalar',
  category: 'scalar',
  collar_style: 'scalar',
  dress_silhouette: 'scalar',
  fit: 'scalar',
  garment_feature: 'array',
  hair_length: 'scalar',
  haircut: 'scalar',
  heel_height: 'scalar',
  heel_type: 'scalar',
  material: 'array',
  neckline: 'scalar',
  ornament: 'array',
  pant_shape: 'scalar',
  pattern: 'array',
  shaft_height: 'scalar',
  shoulder_style: 'scalar',
  skirt_silhouette: 'scalar',
  sleeve_length: 'scalar',
  sleeve_style: 'scalar',
  sock_height: 'scalar',
  sole_height: 'scalar',
  structure: 'array',
  subcategory: 'scalar',
  texture: 'scalar',
  top_length: 'scalar',
  waist_height: 'scalar',
  waistline: 'scalar',
} as const

export const ITEM_SEARCH_ITEM_TYPE_ALIAS_TO_SUPPORTED = {
  abilityHandhelds: 'handhelds',
} as const

export const ITEM_SEARCH_SCHEMA_KEY_BY_ITEM_TYPE = {
  armDecorations: 'accessory',
  backpieces: 'accessory',
  bodyPaint: 'accessory',
  bottoms: 'garment',
  bracelets: 'accessory',
  chestAccessories: 'accessory',
  chokers: 'accessory',
  dresses: 'garment',
  earrings: 'accessory',
  faceDecorations: 'accessory',
  gloves: 'accessory',
  hair: 'hair',
  hairAccessories: 'accessory',
  handhelds: 'accessory',
  headwear: 'accessory',
  neckwear: 'accessory',
  outerwear: 'garment',
  pendants: 'accessory',
  rings: 'accessory',
  shoes: 'shoes',
  socks: 'socks',
  tops: 'garment',
} as const

export const ITEM_SEARCH_SCHEMA_SECTIONS_BY_KEY = {
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
        'collar_style',
        'shoulder_style',
        'sleeve_length',
        'sleeve_style',
        'waist_height',
        'waistline',
        'garment_feature',
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
} as const

export const ITEM_SEARCH_EDITABLE_SECTIONS_BY_TYPE = {
  armDecorations: [
    {
      key: 'identity',
      fields: ['category', 'subcategory'],
    },
    {
      key: 'detail',
      fields: ['pattern', 'material', 'structure', 'ornament'],
    },
  ],
  backpieces: [
    {
      key: 'identity',
      fields: ['category', 'subcategory'],
    },
    {
      key: 'detail',
      fields: ['pattern', 'material', 'structure', 'ornament'],
    },
  ],
  bodyPaint: [
    {
      key: 'identity',
      fields: ['category', 'subcategory'],
    },
    {
      key: 'detail',
      fields: ['pattern', 'material', 'structure', 'ornament'],
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
        'garment_feature',
      ],
    },
    {
      key: 'detail',
      fields: ['pattern', 'material', 'structure', 'ornament'],
    },
  ],
  bracelets: [
    {
      key: 'identity',
      fields: ['category', 'subcategory'],
    },
    {
      key: 'detail',
      fields: ['pattern', 'material', 'structure', 'ornament'],
    },
  ],
  chestAccessories: [
    {
      key: 'identity',
      fields: ['category', 'subcategory'],
    },
    {
      key: 'detail',
      fields: ['pattern', 'material', 'structure', 'ornament'],
    },
  ],
  chokers: [
    {
      key: 'identity',
      fields: ['category', 'subcategory'],
    },
    {
      key: 'detail',
      fields: ['pattern', 'material', 'structure', 'ornament'],
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
        'collar_style',
        'shoulder_style',
        'sleeve_length',
        'sleeve_style',
        'garment_feature',
      ],
    },
    {
      key: 'detail',
      fields: ['pattern', 'material', 'structure', 'ornament'],
    },
  ],
  earrings: [
    {
      key: 'identity',
      fields: ['category', 'subcategory'],
    },
    {
      key: 'detail',
      fields: ['pattern', 'material', 'structure', 'ornament'],
    },
  ],
  faceDecorations: [
    {
      key: 'identity',
      fields: ['category', 'subcategory'],
    },
    {
      key: 'detail',
      fields: ['pattern', 'material', 'structure', 'ornament'],
    },
  ],
  gloves: [
    {
      key: 'identity',
      fields: ['category', 'subcategory'],
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
  hairAccessories: [
    {
      key: 'identity',
      fields: ['category', 'subcategory'],
    },
    {
      key: 'detail',
      fields: ['pattern', 'material', 'structure', 'ornament'],
    },
  ],
  handhelds: [
    {
      key: 'identity',
      fields: ['category', 'subcategory'],
    },
    {
      key: 'detail',
      fields: ['pattern', 'material', 'structure', 'ornament'],
    },
  ],
  headwear: [
    {
      key: 'identity',
      fields: ['category', 'subcategory'],
    },
    {
      key: 'detail',
      fields: ['pattern', 'material', 'structure', 'ornament'],
    },
  ],
  neckwear: [
    {
      key: 'identity',
      fields: ['category', 'subcategory'],
    },
    {
      key: 'detail',
      fields: ['pattern', 'material', 'structure', 'ornament'],
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
        'collar_style',
        'shoulder_style',
        'sleeve_length',
        'sleeve_style',
        'garment_feature',
      ],
    },
    {
      key: 'detail',
      fields: ['pattern', 'material', 'structure', 'ornament'],
    },
  ],
  pendants: [
    {
      key: 'identity',
      fields: ['category', 'subcategory'],
    },
    {
      key: 'detail',
      fields: ['pattern', 'material', 'structure', 'ornament'],
    },
  ],
  rings: [
    {
      key: 'identity',
      fields: ['category', 'subcategory'],
    },
    {
      key: 'detail',
      fields: ['pattern', 'material', 'structure', 'ornament'],
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
        'collar_style',
        'shoulder_style',
        'sleeve_length',
        'sleeve_style',
        'garment_feature',
      ],
    },
    {
      key: 'detail',
      fields: ['pattern', 'material', 'structure', 'ornament'],
    },
  ],
} as const

export const ITEM_SEARCH_FIELD_NAMES_BY_ITEM_TYPE = {
  armDecorations: [
    'category',
    'material',
    'ornament',
    'pattern',
    'structure',
    'subcategory',
  ],
  backpieces: [
    'category',
    'material',
    'ornament',
    'pattern',
    'structure',
    'subcategory',
  ],
  bodyPaint: [
    'category',
    'material',
    'ornament',
    'pattern',
    'structure',
    'subcategory',
  ],
  bottoms: [
    'bottom_length',
    'category',
    'garment_feature',
    'material',
    'ornament',
    'pant_shape',
    'pattern',
    'skirt_silhouette',
    'structure',
    'subcategory',
    'waist_height',
  ],
  bracelets: [
    'category',
    'material',
    'ornament',
    'pattern',
    'structure',
    'subcategory',
  ],
  chestAccessories: [
    'category',
    'material',
    'ornament',
    'pattern',
    'structure',
    'subcategory',
  ],
  chokers: [
    'category',
    'material',
    'ornament',
    'pattern',
    'structure',
    'subcategory',
  ],
  dresses: [
    'bottom_length',
    'category',
    'collar_style',
    'dress_silhouette',
    'fit',
    'garment_feature',
    'material',
    'neckline',
    'ornament',
    'pattern',
    'shoulder_style',
    'sleeve_length',
    'sleeve_style',
    'structure',
    'subcategory',
    'waistline',
  ],
  earrings: [
    'category',
    'material',
    'ornament',
    'pattern',
    'structure',
    'subcategory',
  ],
  faceDecorations: [
    'category',
    'material',
    'ornament',
    'pattern',
    'structure',
    'subcategory',
  ],
  gloves: [
    'category',
    'material',
    'ornament',
    'pattern',
    'structure',
    'subcategory',
  ],
  hair: [
    'bangs',
    'category',
    'hair_length',
    'haircut',
    'subcategory',
    'texture',
  ],
  hairAccessories: [
    'category',
    'material',
    'ornament',
    'pattern',
    'structure',
    'subcategory',
  ],
  handhelds: [
    'category',
    'material',
    'ornament',
    'pattern',
    'structure',
    'subcategory',
  ],
  headwear: [
    'category',
    'material',
    'ornament',
    'pattern',
    'structure',
    'subcategory',
  ],
  neckwear: [
    'category',
    'material',
    'ornament',
    'pattern',
    'structure',
    'subcategory',
  ],
  outerwear: [
    'category',
    'collar_style',
    'fit',
    'garment_feature',
    'material',
    'neckline',
    'ornament',
    'pattern',
    'shoulder_style',
    'sleeve_length',
    'sleeve_style',
    'structure',
    'subcategory',
    'top_length',
  ],
  pendants: [
    'category',
    'material',
    'ornament',
    'pattern',
    'structure',
    'subcategory',
  ],
  rings: [
    'category',
    'material',
    'ornament',
    'pattern',
    'structure',
    'subcategory',
  ],
  shoes: [
    'category',
    'heel_height',
    'heel_type',
    'material',
    'ornament',
    'pattern',
    'shaft_height',
    'sole_height',
    'structure',
    'subcategory',
  ],
  socks: [
    'category',
    'material',
    'ornament',
    'pattern',
    'sock_height',
    'structure',
    'subcategory',
  ],
  tops: [
    'category',
    'collar_style',
    'fit',
    'garment_feature',
    'material',
    'neckline',
    'ornament',
    'pattern',
    'shoulder_style',
    'sleeve_length',
    'sleeve_style',
    'structure',
    'subcategory',
    'top_length',
  ],
} as const
