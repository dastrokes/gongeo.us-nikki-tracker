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
  | 'handhelds'
  | 'baseMakeup'
  | 'eyebrows'
  | 'eyelashes'
  | 'contactLenses'
  | 'lips'
  | 'skinTones'
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
  '79': 'rings',
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
  '86': 'skinTones',
}

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
  const typeValues = Object.values(itemTypeMap)
  if (
    typeof itemIdOrType === 'string' &&
    typeValues.includes(itemIdOrType as ItemType)
  ) {
    return itemIdOrType as ItemType
  }

  // Otherwise, extract from item ID (5th and 6th digits)
  const idStr = itemIdOrType.toString()
  if (idStr.length >= 6) {
    const typeCode = idStr.substring(4, 6)
    return itemTypeMap[typeCode] || 'unknown'
  }

  return 'unknown'
}

// Get all available item types for filtering
export function getAllItemTypes(): ItemType[] {
  return Array.from(new Set(Object.values(itemTypeMap))).sort()
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
  'hair': 1,
  'dresses': 2,
  'outerwear': 3,
  'tops': 4,
  'bottoms': 5,
  'socks': 6,
  'shoes': 7,
  // Accessories
  'hairAccessories': 8,
  'headwear': 9,
  'earrings': 10,
  'neckwear': 11,
  'bracelets': 12,
  'chokers': 13,
  'gloves': 14,
  'handhelds': 15,
  'rings': 16,
  'faceDecorations': 17,
  'chestAccessories': 18,
  'pendants': 19,
  'backpieces': 20,
  'armDecorations': 21,
  // Makeups
  'baseMakeup': 22,
  'eyebrows': 23,
  'eyelashes': 24,
  'contactLenses': 25,
  'lips': 26,
  // Others
  'skinTones': 27,
  'unknown': 28,
}

/**
 * Item type categories
 */
export const itemTypeCategories = {
  clothes: ['hair', 'dresses', 'outerwear', 'tops', 'bottoms', 'socks', 'shoes'],
  accessories: ['hairAccessories', 'headwear', 'earrings', 'neckwear', 'bracelets', 'chokers', 'gloves', 'handhelds', 'rings', 'faceDecorations', 'chestAccessories', 'pendants', 'backpieces', 'armDecorations'],
  makeups: ['baseMakeup', 'eyebrows', 'eyelashes', 'contactLenses', 'lips'],
} as const

/**
 * Get category for an item type
 */
export function getItemTypeCategory(itemType: ItemType): 'clothes' | 'accessories' | 'makeups' | 'other' {
  if ((itemTypeCategories.clothes as readonly string[]).includes(itemType)) return 'clothes'
  if ((itemTypeCategories.accessories as readonly string[]).includes(itemType)) return 'accessories'
  if ((itemTypeCategories.makeups as readonly string[]).includes(itemType)) return 'makeups'
  return 'other'
}

/**
 * Sort items by category order
 */
export function sortItemsByCategory<T extends { id: number | string }>(items: T[]): T[] {
  return items.sort((a, b) => {
    const typeA = getItemType(a.id)
    const typeB = getItemType(b.id)
    const orderA = itemCategoryOrder[typeA] ?? 999
    const orderB = itemCategoryOrder[typeB] ?? 999
    return orderA - orderB
  })
}
