/**
 * Shared utilities for outfit, item, and full makeup variant ID classification.
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
 *   Glow-up: 1022xxxxxx  (alt glow-up: 1026xxxxxx / 1027xxxxxx / 1028xxxxxx)
 *   Evo 1:   1023xxxxxx
 *   Evo 2:   1024xxxxxx
 *   Evo 3:   1025xxxxxx
 *
 * Version 3.0 added a parallel 20xx item ID space with the same variant codes
 * (2020 base, 2022 glow-up, 2023-2025 evolutions, ...).
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

const OUTFIT_VARIANT_TO_ITEM_CODE: Record<VariantType, string> = {
  base: '20',
  glowup: '22',
  evo1: '23',
  evo2: '24',
  evo3: '25',
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

/** Maps an outfit item to the matching item of an outfit variant, keeping
 * the item's own 10xx/20xx family. */
export function getOutfitVariantItemId(
  itemId: string,
  outfitId: string
): string {
  if (itemId.length !== 10) return itemId
  const code = OUTFIT_VARIANT_TO_ITEM_CODE[getOutfitVariantType(outfitId)]
  return `${itemId.slice(0, 2)}${code}${itemId.slice(4)}`
}

export function getFullMakeupVariantType(
  componentIds: readonly number[]
): VariantType {
  // TbClothesSet.clothes carries the variant through its component item IDs.
  for (const componentId of componentIds) {
    const variantType = getItemVariantType(componentId)
    if (variantType !== 'base') return variantType
  }
  return 'base'
}

const ITEM_CODE_MAP: Record<string, VariantType> = {
  '22': 'glowup',
  '23': 'evo1',
  '24': 'evo2',
  '25': 'evo3',
  '26': 'glowup',
  '27': 'glowup',
  '28': 'glowup',
}

const ITEM_PREFIX_MAP: Record<string, VariantType> = Object.fromEntries(
  ['10', '20'].flatMap((family) =>
    Object.entries(ITEM_CODE_MAP).map(([code, type]) => [family + code, type])
  )
)

function getItemPrefix(itemId: string): string | null {
  return itemId.length === 10 ? itemId.substring(0, 4) : null
}

export function isItemVariantId(
  itemId: string | number,
  familyRootId?: string | number
): boolean {
  if (String(itemId) === String(familyRootId)) return false
  const prefix = getItemPrefix(String(itemId))
  return prefix !== null && prefix in ITEM_PREFIX_MAP
}

export function getItemVariantType(
  itemId: string | number,
  familyRootId?: string | number
): VariantType {
  if (String(itemId) === String(familyRootId)) return 'base'
  const prefix = getItemPrefix(String(itemId))
  if (!prefix) return 'base'
  return ITEM_PREFIX_MAP[prefix] ?? 'base'
}

export function getItemBody(itemId: string | number): string {
  const s = String(itemId)
  return s.length === 10 ? s.substring(4) : s
}
