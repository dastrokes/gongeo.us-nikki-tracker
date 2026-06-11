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
 *   Base:    1020xxxxxx  (alt base: 1021xxxxxx / 1029xxxxxx)
 *   Glow-up: 1022xxxxxx  (alt glow-up: 1026xxxxxx / 1027xxxxxx)
 *   Evo 1:   1023xxxxxx
 *   Evo 2:   1024xxxxxx
 *   Evo 3:   1025xxxxxx
 *
 * IMPORTANT: A 5-digit base outfit ID like "10001" must never be classified as
 * a glow-up even though it ends in "01". Only 7-digit IDs carry a variant suffix.
 */

export type VariantType = 'base' | 'glowup' | 'evo1' | 'evo2' | 'evo3'

const OUTFIT_SUFFIX_MAP: Record<string, VariantType> = {
  '01': 'glowup',
  '02': 'evo1',
  '03': 'evo2',
  '04': 'evo3',
}

const OUTFIT_VARIANT_TO_ITEM_PREFIX: Record<VariantType, string> = {
  base: '1020',
  glowup: '1022',
  evo1: '1023',
  evo2: '1024',
  evo3: '1025',
}

export function isOutfitVariantId(outfitId: string): boolean {
  return outfitId.length === 7 && outfitId.slice(-2) in OUTFIT_SUFFIX_MAP
}

export function getBaseOutfitId(outfitId: string): string {
  return isOutfitVariantId(outfitId) ? outfitId.slice(0, 5) : outfitId
}

export function getOutfitVariantType(outfitId: string): VariantType {
  if (!isOutfitVariantId(outfitId)) return 'base'
  return OUTFIT_SUFFIX_MAP[outfitId.slice(-2)] ?? 'base'
}

export function getItemPrefixForOutfitId(outfitId: string): string {
  return OUTFIT_VARIANT_TO_ITEM_PREFIX[getOutfitVariantType(outfitId)]
}

const ITEM_PREFIX_MAP: Record<string, VariantType> = {
  '1022': 'glowup',
  '1023': 'evo1',
  '1024': 'evo2',
  '1025': 'evo3',
  '1026': 'glowup',
  '1027': 'glowup',
}

function getItemPrefix(itemId: string): string | null {
  return itemId.length === 10 ? itemId.substring(0, 4) : null
}

export function isItemVariantId(itemId: string | number): boolean {
  const prefix = getItemPrefix(String(itemId))
  return prefix !== null && prefix in ITEM_PREFIX_MAP
}

export function getItemVariantType(itemId: string | number): VariantType {
  const prefix = getItemPrefix(String(itemId))
  if (!prefix) return 'base'
  return ITEM_PREFIX_MAP[prefix] ?? 'base'
}

export function getItemBody(itemId: string | number): string {
  const s = String(itemId)
  return s.length === 10 ? s.substring(4) : s
}
