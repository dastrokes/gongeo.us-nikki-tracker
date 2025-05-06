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
  | 'unknown'

const itemTypeMap: Record<string, ItemType> = {
  '102010': 'hair',
  '102090': 'dresses',
  '102020': 'outerwear',
  '102030': 'tops',
  '102041': 'bottoms',
  '102050': 'socks',
  '102060': 'shoes',
  '102071': 'hairAccessories',
  '102072': 'headwear',
  '102073': 'earrings',
  '102074': 'neckwear',
  '102075': 'bracelets',
  '102076': 'chokers',
  '102077': 'gloves',
  '102092': 'faceDecorations',
  '102093': 'chestAccessories',
  '102198': 'pendants',
  '102095': 'backpieces',
  '102079': 'rings',
  '102097': 'armDecorations',
  '102078': 'handhelds',
}

export function getItemType(itemId: string): ItemType {
  const prefix = itemId.substring(0, 6)
  return itemTypeMap[prefix] || 'unknown'
}
