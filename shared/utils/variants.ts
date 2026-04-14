/**
 * Shared utilities for outfit and item variant ID classification.
 *
 * ## Outfit IDs
 * Outfits use 5-digit base IDs. Variant IDs are exactly 7 digits, where the
 * last 2 digits are the variant suffix:
 *
 *   Base:    10001   (5 digits)
 *   Glow-up: 1000101 (7 digits, suffix "01")
 *   Evo 1:   1000102 (7 digits, suffix "02")
 *   Evo 2:   1000103 (7 digits, suffix "03")
 *   Evo 3:   1000104 (7 digits, suffix "04")
 *
 * ## Item IDs
 * Items use 10-digit IDs where the first 4 digits are the prefix that
 * encodes the variant type. The remaining 6 digits identify the specific item.
 *
 *   Base:    1020xxxxxx  (alt base: 1021xxxxxx)
 *   Glow-up: 1022xxxxxx  (alt glow-up: 1026xxxxxx)
 *   Evo 1:   1023xxxxxx
 *   Evo 2:   1024xxxxxx
 *   Evo 3:   1025xxxxxx
 *
 * IMPORTANT: A 5-digit base outfit ID like "10001" must never be classified as
 * a glow-up even though it ends in "01". Only 7-digit IDs carry a variant suffix.
 */

// ---------------------------------------------------------------------------
// Shared variant type
// ---------------------------------------------------------------------------

export type VariantType = 'base' | 'glowup' | 'evo1' | 'evo2' | 'evo3'

// ---------------------------------------------------------------------------
// Outfit variant utilities
// ---------------------------------------------------------------------------

/** 2-digit suffix → variant type. Only valid for 7-digit outfit IDs. */
const OUTFIT_SUFFIX_MAP: Record<string, VariantType> = {
  '01': 'glowup',
  '02': 'evo1',
  '03': 'evo2',
  '04': 'evo3',
}

/**
 * Maps an outfit variant type to the item ID prefix used by the items that
 * belong to that variant.
 */
const OUTFIT_VARIANT_TO_ITEM_PREFIX: Record<VariantType, string> = {
  base: '1020',
  glowup: '1022',
  evo1: '1023',
  evo2: '1024',
  evo3: '1025',
}

/**
 * Returns true if the given outfit ID string represents a variant (glow-up /
 * evolution): exactly 7 digits long and ends with a known 2-digit suffix.
 */
export function isOutfitVariantId(outfitId: string): boolean {
  return outfitId.length === 7 && outfitId.slice(-2) in OUTFIT_SUFFIX_MAP
}

/**
 * Derives the base (5-digit) outfit ID from any outfit ID string.
 * Returns the ID unchanged if it is already a base ID.
 */
export function getBaseOutfitId(outfitId: string): string {
  return isOutfitVariantId(outfitId) ? outfitId.slice(0, 5) : outfitId
}

/**
 * Classifies an outfit ID string into its variant type.
 * Returns `'base'` for any non-variant ID (including 5-digit base IDs).
 */
export function getOutfitVariantType(outfitId: string): VariantType {
  if (!isOutfitVariantId(outfitId)) return 'base'
  return OUTFIT_SUFFIX_MAP[outfitId.slice(-2)] ?? 'base'
}

/**
 * Returns the item ID prefix that corresponds to the variant type of the
 * given outfit ID. Used to map base item IDs to their correct variant equivalents.
 *
 * @example
 *   getItemPrefixForOutfitId('10001')   // → '1020'  (base items)
 *   getItemPrefixForOutfitId('1000101') // → '1022'  (glow-up items)
 *   getItemPrefixForOutfitId('1000102') // → '1023'  (evo-1 items)
 */
export function getItemPrefixForOutfitId(outfitId: string): string {
  return OUTFIT_VARIANT_TO_ITEM_PREFIX[getOutfitVariantType(outfitId)]
}

// ---------------------------------------------------------------------------
// Item variant utilities
// ---------------------------------------------------------------------------

/** Item ID prefixes that identify a base (non-variant) item. */
const ITEM_BASE_PREFIXES = new Set(['1020', '1021'])

/** Item ID prefix → variant type. Prefixes absent from this map are 'base'. */
const ITEM_PREFIX_MAP: Record<string, VariantType> = {
  '1022': 'glowup',
  '1023': 'evo1',
  '1024': 'evo2',
  '1025': 'evo3',
  '1026': 'glowup', // alt glow-up scheme (paired with base prefix 1021)
}

/**
 * Returns the 4-character prefix of a 10-digit item ID, or null if the ID
 * is not the expected length.
 */
function getItemPrefix(itemId: string): string | null {
  return itemId.length === 10 ? itemId.substring(0, 4) : null
}

/**
 * Returns true if the given item ID string is a variant (glow-up / evolution),
 * i.e. its 4-digit prefix is a known non-base prefix.
 */
export function isItemVariantId(itemId: string | number): boolean {
  const prefix = getItemPrefix(String(itemId))
  return prefix !== null && prefix in ITEM_PREFIX_MAP
}

/**
 * Classifies an item ID into its variant type.
 * Returns `'base'` for base items (prefix 1020/1021) or unrecognised IDs.
 */
export function getItemVariantType(itemId: string | number): VariantType {
  const prefix = getItemPrefix(String(itemId))
  if (!prefix) return 'base'
  return ITEM_PREFIX_MAP[prefix] ?? 'base'
}

/**
 * Returns the 6-digit body of a 10-digit item ID (everything after the prefix).
 * Returns the full string unchanged for IDs that are not 10 digits.
 */
export function getItemBody(itemId: string | number): string {
  const s = String(itemId)
  return s.length === 10 ? s.substring(4) : s
}

/**
 * Returns the canonical base item ID for any item ID, by replacing a variant
 * prefix with the appropriate base prefix.
 *
 * Items using the alt glow-up scheme (prefix 1021/1026) keep prefix 1021;
 * all others get prefix 1020.
 *
 * @example
 *   getBaseItemId('1022900001') // → '1020900001'
 *   getBaseItemId('1026900001') // → '1021900001'
 *   getBaseItemId('1020900001') // → '1020900001'  (already base)
 */
export function getBaseItemId(itemId: string | number): string {
  const s = String(itemId)
  const prefix = getItemPrefix(s)
  if (!prefix) return s

  // Alt glow-up (1026) pairs with alt base (1021); everything else with 1020
  const usesAltScheme = prefix === '1021' || prefix === '1026'
  if (ITEM_BASE_PREFIXES.has(prefix)) return s // already base

  const basePrefix = usesAltScheme ? '1021' : '1020'
  return `${basePrefix}${s.substring(4)}`
}

/**
 * Returns all related item IDs for a given item (base + all variants), limited
 * by the item's quality. Only 4★ and 5★ items have variants.
 *
 * @param baseId  - The item ID to start from (base or variant; base is derived automatically).
 * @param quality - The item quality (only 4 and 5 produce variant IDs).
 */
export function getRelatedItemIds(baseId: number, quality: number): number[] {
  if (quality < 4) return [baseId]

  const idStr = baseId.toString()
  if (idStr.length !== 10) return [baseId]

  const prefix = idStr.substring(0, 4)
  const body = idStr.substring(4)
  const usesAltScheme = prefix === '1021' || prefix === '1026'
  const basePrefix = usesAltScheme ? '1021' : '1020'
  const glowupPrefix = usesAltScheme ? '1026' : '1022'

  const variations = [
    parseInt(`${basePrefix}${body}`), // base
    parseInt(`${glowupPrefix}${body}`), // glowup
  ]

  if (!usesAltScheme) {
    variations.push(parseInt(`1023${body}`)) // evo1
  }

  if (quality === 5) {
    variations.push(parseInt(`1024${body}`)) // evo2
    variations.push(parseInt(`1025${body}`)) // evo3
  }

  return variations
}
