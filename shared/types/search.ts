export interface SearchResult {
  id: string
  type: 'banner' | 'outfit' | 'item'
  name: string
  searchAliases?: string[]
  searchAbilityAliases?: string[]
  matchedAlias?: string
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
  includeMatches?: boolean
  minMatchCharLength: number
  ignoreDiacritics: boolean
}

export interface SearchAutocompleteTerm {
  id: string
  value: string
  searchValues: string[]
}

export interface SearchCategory {
  type: 'banner' | 'outfit' | 'item'
  label: string
  results: SearchResult[]
}
