/**
 * Supabase database type definitions for outfits and items
 * These types represent the structure of data stored in Supabase tables
 */

/**
 * Represents an outfit record from the Supabase outfits table
 */
export interface SupabaseOutfit {
  id: number
  name: string
  description: string | null
  quality: number
  created_at: string
  updated_at: string
}

/**
 * Represents an item record from the Supabase items table
 */
export interface SupabaseItem {
  id: number
  name: string
  description: string | null
  quality: number
  type: string
  created_at: string
  updated_at: string
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
}

/**
 * Extended item interface that includes related outfits
 * Used when fetching item details with related outfits
 */
export interface ItemWithOutfits extends SupabaseItem {
  outfit_items: {
    outfits: SupabaseOutfit
  }[]
}
