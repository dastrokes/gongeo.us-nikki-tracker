export type ItemType =
  | 'hair'
  | 'dresses'
  | 'outerwear'
  | 'tops'
  | 'bottoms'
  | 'socks'
  | 'shoes'
  | 'hairAccessories'
  | 'headwear'
  | 'earrings'
  | 'neckwear'
  | 'bracelets'
  | 'chokers'
  | 'gloves'
  | 'faceDecorations'
  | 'chestAccessories'
  | 'pendants'
  | 'backpieces'
  | 'rings'
  | 'armDecorations'
  | 'bodyPaint'
  | 'handhelds'
  | 'baseMakeup'
  | 'eyebrows'
  | 'eyelashes'
  | 'contactLenses'
  | 'lips'
  | 'fullMakeup'
  | 'unknown'

// Map based on 5th and 6th digits of item ID
export const itemTypeMap: Record<string, ItemType> = {
  '10': 'hair',
  '90': 'dresses',
  '20': 'outerwear',
  '30': 'tops',
  '41': 'bottoms',
  '50': 'socks',
  '60': 'shoes',
  '71': 'hairAccessories',
  '72': 'headwear',
  '73': 'earrings',
  '74': 'neckwear',
  '75': 'bracelets',
  '76': 'chokers',
  '77': 'gloves',
  '78': 'handhelds',
  '79': 'bodyPaint',
  '92': 'faceDecorations',
  '93': 'chestAccessories',
  '94': 'pendants',
  '95': 'backpieces',
  '96': 'rings',
  '97': 'armDecorations',
  '98': 'chokers',
  '81': 'baseMakeup',
  '82': 'eyebrows',
  '83': 'eyelashes',
  '84': 'contactLenses',
  '85': 'lips',
}

const itemTypeValues = new Set<ItemType>([
  ...Object.values(itemTypeMap),
  'fullMakeup',
])

/**
 * Get item type from item ID or type string
 * @param itemIdOrType - Item ID (number/string) or type string from database
 * @returns ItemType
 */
export function getItemType(itemIdOrType: string | number): ItemType {
  // If it's already a valid type string, return it
  if (typeof itemIdOrType === 'string' && itemIdOrType in itemTypeMap) {
    return itemIdOrType as ItemType
  }

  // Check if it's a known type value
  if (
    typeof itemIdOrType === 'string' &&
    itemTypeValues.has(itemIdOrType as ItemType)
  ) {
    return itemIdOrType as ItemType
  }

  // Otherwise, extract from item ID (5th and 6th digits)
  const idStr = itemIdOrType.toString()
  if (idStr === '1020790033') return 'rings'

  if (idStr.length >= 6) {
    const typeCode = idStr.substring(4, 6)
    return itemTypeMap[typeCode] || 'unknown'
  }

  return 'unknown'
}

// Get all available item types for filtering
export function getAllItemTypes(): ItemType[] {
  return Array.from(itemTypeValues).sort()
}

/**
 * Get reverse mapping from item type to digit codes
 * Used for database queries
 */
export function getTypeCodesForItemType(itemType: ItemType): string[] {
  return Object.entries(itemTypeMap)
    .filter(([_, type]) => type === itemType)
    .map(([code]) => code)
}

/**
 * Category order for item listing and outfit detail pages
 * Groups items into clothes, accessories, and makeups with specific ordering
 */
export const itemCategoryOrder: Record<string, number> = {
  // Clothes
  hair: 1,
  dresses: 2,
  outerwear: 3,
  tops: 4,
  bottoms: 5,
  socks: 6,
  shoes: 7,
  // Accessories
  hairAccessories: 11,
  headwear: 12,
  earrings: 13,
  neckwear: 14,
  bracelets: 15,
  chokers: 16,
  gloves: 17,
  faceDecorations: 18,
  chestAccessories: 19,
  pendants: 20,
  backpieces: 21,
  rings: 22,
  armDecorations: 23,
  handhelds: 24,
  bodyPaint: 25,
  // Makeups
  fullMakeup: 31,
  baseMakeup: 32,
  eyebrows: 33,
  eyelashes: 34,
  contactLenses: 35,
  lips: 36,
  // Others
  unknown: 99,
}

/**
 * Item type categories
 */
export const itemTypeCategories = {
  clothes: [
    'hair',
    'dresses',
    'outerwear',
    'tops',
    'bottoms',
    'socks',
    'shoes',
  ],
  accessories: [
    'hairAccessories',
    'headwear',
    'earrings',
    'neckwear',
    'bracelets',
    'chokers',
    'gloves',
    'faceDecorations',
    'chestAccessories',
    'pendants',
    'backpieces',
    'rings',
    'armDecorations',
    'handhelds',
    'bodyPaint',
  ],
  makeups: [
    'fullMakeup',
    'baseMakeup',
    'eyebrows',
    'eyelashes',
    'contactLenses',
    'lips',
  ],
} as const

export const makeupItemTypes = itemTypeCategories.makeups

export const standardItemTypes = getAllItemTypes().filter(
  (type) => !(makeupItemTypes as readonly string[]).includes(type)
)

/**
 * Get category for an item type
 */
export function getItemTypeCategory(
  itemType: ItemType
): 'clothes' | 'accessories' | 'makeups' | 'other' {
  if ((itemTypeCategories.clothes as readonly string[]).includes(itemType))
    return 'clothes'
  if ((itemTypeCategories.accessories as readonly string[]).includes(itemType))
    return 'accessories'
  if ((itemTypeCategories.makeups as readonly string[]).includes(itemType))
    return 'makeups'
  return 'other'
}

/**
 * Sort items by category order
 */
export function sortItemsByCategory<
  T extends { id: number | string; type?: string },
>(items: T[]): T[] {
  return items.sort((a, b) => {
    const typeA = a.type ? getItemType(a.type) : getItemType(a.id)
    const typeB = b.type ? getItemType(b.type) : getItemType(b.id)
    const orderA = itemCategoryOrder[typeA] ?? 999
    const orderB = itemCategoryOrder[typeB] ?? 999
    return orderA - orderB
  })
}
