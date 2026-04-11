export interface SearchResult {
  id: string
  type: 'banner' | 'outfit' | 'item'
  name: string
  searchAliases?: string[]
  quality?: number
  route: string
  pinyin?: string[]
  pinyinInitials?: string[]
}

export interface SearchIndex {
  banners: Map<string, SearchResult>
  outfits: Map<string, SearchResult>
  items: Map<string, SearchResult>
}

export interface SearchOptions {
  threshold: number
  keys: string[]
  includeScore: boolean
  minMatchCharLength: number
  ignoreDiacritics: boolean
}

export interface SearchCategory {
  type: 'banner' | 'outfit' | 'item'
  label: string
  results: SearchResult[]
}
