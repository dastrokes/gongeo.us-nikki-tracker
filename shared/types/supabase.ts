import type { ItemSearchMetadata } from './itemSearch'

/**
 * Supabase database type definitions for outfits and items
 * These types represent the structure of data stored in Supabase tables
 * Note: Names are stored in i18n JSON files for client-side search, not in the database
 */

/**
 * Represents an outfit record from the Supabase outfits table
 * Names are stored in i18n JSON files, not in the database
 */
export interface SupabaseOutfit {
  id: number
  quality: number
  props?: Array<number | string> | null
  style_key?: string | null
  tags?: Array<number | string> | null
  obtain_type?: number | null
}

/**
 * Represents an item record from the Supabase items table
 * Names are stored in i18n JSON files, not in the database
 */
export interface SupabaseItem {
  id: number
  quality: number
  type: string
  props?: Array<number | string> | null
  style_key?: string | null
  tags?: Array<number | string> | null
  obtain_type?: number | null
}

export interface SupabaseItemAttributes {
  item_id: number
  item_type: string
  category?: string | null
  subcategory?: string | null
  metadata?: ItemSearchMetadata | null
}

/**
 * Represents a junction table entry linking outfits to items
 */
export interface OutfitItem {
  outfit_id: number
  item_id: number
}

/**
 * Extended outfit interface that includes related items
 * Used when fetching outfit details with component items
 */
export interface OutfitWithItems extends SupabaseOutfit {
  outfit_items: {
    items: SupabaseItem
  }[]
  variations?: Array<{
    id: number
    quality: number
    type: string
    props?: Array<number | string> | null
    tags?: Array<number | string> | null
  }>
}

/**
 * Extended item interface that includes related outfits
 * Used when fetching item details with related outfits
 */
export interface ItemWithOutfits extends SupabaseItem {
  outfit_items: {
    outfits: SupabaseOutfit & {
      outfit_items?: {
        items: SupabaseItem
      }[]
    }
  }[]
  item_attributes?: {
    category?: string | null
    subcategory?: string | null
    metadata?: ItemSearchMetadata | null
  } | null
  description?: string
  variations?: Array<{
    id: number
    quality: number
    type: string
  }>
}
