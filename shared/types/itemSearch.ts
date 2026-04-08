export type ItemSearchScalarField =
  | 'category'
  | 'subcategory'
  | 'top_length'
  | 'bottom_length'
  | 'hair_length'
  | 'fit'
  | 'neckline'
  | 'shoulder_style'
  | 'sleeve_length'
  | 'sleeve_style'
  | 'skirt_silhouette'
  | 'pant_shape'
  | 'waist_height'
  | 'dress_silhouette'
  | 'waistline'
  | 'haircut'
  | 'texture'
  | 'bangs'
  | 'heel_type'
  | 'heel_height'
  | 'sole_height'
  | 'shaft_height'
  | 'sock_height'

export type ItemSearchAdvancedScalarField = Exclude<
  ItemSearchScalarField,
  'category' | 'subcategory'
>

export type ItemSearchArrayField =
  | 'pattern'
  | 'material'
  | 'structure'
  | 'ornament'

export type ItemSearchField = ItemSearchScalarField | ItemSearchArrayField
export type ItemSearchAdvancedField =
  | ItemSearchAdvancedScalarField
  | ItemSearchArrayField

export type ItemSearchSchemaKey =
  | 'garment'
  | 'hair'
  | 'shoes'
  | 'socks'
  | 'accessory'
  | 'unknown'

export interface ItemSearchMetadata {
  item_id?: number | string
  item_type?: string
  slot?: string
  category?: string | null
  subcategory?: string | null
  pattern?: string[]
  material?: string[]
  structure?: string[]
  ornament?: string[]
  top_length?: string | null
  bottom_length?: string | null
  hair_length?: string | null
  fit?: string | null
  neckline?: string | null
  shoulder_style?: string | null
  sleeve_length?: string | null
  sleeve_style?: string | null
  skirt_silhouette?: string | null
  pant_shape?: string | null
  waist_height?: string | null
  dress_silhouette?: string | null
  waistline?: string | null
  haircut?: string | null
  texture?: string | null
  bangs?: string | null
  heel_type?: string | null
  heel_height?: string | null
  sole_height?: string | null
  shaft_height?: string | null
  sock_height?: string | null
  [key: string]: unknown
}

export interface ItemSearchMetadataDisplayField {
  field: ItemSearchField
  labelKey: string
  values: string[]
}

export interface ItemSearchMetadataDisplaySection {
  key: string
  fields: ItemSearchMetadataDisplayField[]
}

export type ItemSearchAdvancedScalarFilters = Partial<
  Record<ItemSearchAdvancedScalarField, string | null>
>

export type ItemSearchAdvancedFacetMap = Partial<
  Record<ItemSearchAdvancedField, string[]>
>

export interface ItemSearchFacetResponse {
  categories: string[]
  subcategories: string[]
  advanced: ItemSearchAdvancedFacetMap
}
