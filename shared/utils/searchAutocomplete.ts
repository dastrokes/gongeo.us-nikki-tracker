export type SearchAutocompleteGroup = 'names' | 'terms'

const normalizeAutocompleteText = (value: string) =>
  value.trim().toLocaleLowerCase()

export const formatSearchAutocompleteAlias = (value: string): string =>
  value.replace(
    /(^|[\s-])(\p{L})/gu,
    (_, prefix: string, letter: string) =>
      `${prefix}${letter.toLocaleUpperCase()}`
  )

export const getSearchMatchPriority = (value: string, query: string) => {
  const normalizedValue = normalizeAutocompleteText(value)
  const normalizedQuery = normalizeAutocompleteText(query)

  if (normalizedValue === normalizedQuery) return 0
  if (normalizedValue.startsWith(normalizedQuery)) return 1
  return 2
}

export const getSearchTermSuggestions = <
  T extends { id: string; value: string },
>(
  query: string,
  search: (fragment: string) => { item: T; score?: number }[],
  limit = 7
): T[] => {
  const words = query.trim().split(/\s+/)
  if (!words[0]) return []

  const matches = new Map<
    string,
    { item: T; fragmentIndex: number; priority: number; score: number }
  >()

  // Prefer the longest matching phrase, then fall back to the last word.
  for (
    let fragmentIndex = 0;
    fragmentIndex < words.length;
    fragmentIndex += 1
  ) {
    const fragment = words.slice(fragmentIndex).join(' ')
    for (const result of search(fragment)) {
      if (matches.has(result.item.id)) continue
      matches.set(result.item.id, {
        item: result.item,
        fragmentIndex,
        priority: getSearchMatchPriority(result.item.value, fragment),
        score: result.score ?? 1,
      })
    }
    if (matches.size >= limit) break
  }

  return [...matches.values()]
    .sort((left, right) => {
      return (
        left.fragmentIndex - right.fragmentIndex ||
        left.priority - right.priority ||
        left.score - right.score
      )
    })
    .slice(0, limit)
    .map((result) => result.item)
}

export const getAutocompleteGroupOrder = (
  hasExactName: boolean,
  hasExactTerm: boolean
): SearchAutocompleteGroup[] =>
  hasExactName || !hasExactTerm ? ['names', 'terms'] : ['terms', 'names']

export const getAutocompleteDisplayAlias = (result: {
  type: string
  name: string
  matchedAlias?: string
  searchAliases?: string[]
}) => {
  if (result.type !== 'outfit') return result.matchedAlias

  const normalizedName = result.name.trim().toLocaleLowerCase()
  return (
    result.matchedAlias ??
    result.searchAliases?.find(
      (alias) =>
        alias.trim() && alias.trim().toLocaleLowerCase() !== normalizedName
    )
  )
}

const hasSearchAbilityAlias = (
  result: { searchAbilityAliases?: string[] },
  alias: string
) => {
  const normalizedAlias = normalizeAutocompleteText(alias)
  return result.searchAbilityAliases?.some(
    (abilityAlias) =>
      normalizeAutocompleteText(abilityAlias) === normalizedAlias
  )
}

export const getAutocompleteDisplayAliasKey = (result: {
  type: string
  name: string
  matchedAlias?: string
  searchAliases?: string[]
  searchAbilityAliases?: string[]
}) => {
  const alias = getAutocompleteDisplayAlias(result)
  return alias && hasSearchAbilityAlias(result, alias)
    ? 'search_page.autocomplete_ability_alias'
    : 'search_page.autocomplete_alias'
}

export const insertSearchTermAtCaret = (
  query: string,
  term: string,
  selectionStart = query.length,
  selectionEnd = selectionStart
) => {
  const before = query.slice(0, selectionStart)
  const after = query.slice(selectionEnd)
  const normalizedTerm = term.trim()
  const termWords = normalizedTerm.split(/\s+/)
  const beforeWords = before.trimEnd().split(/\s+/)
  let replaceCount = 0

  for (
    let count = 1;
    count <= Math.min(termWords.length, beforeWords.length);
    count += 1
  ) {
    const suffix = beforeWords.slice(-count).join(' ').toLocaleLowerCase()
    if (normalizedTerm.toLocaleLowerCase().startsWith(suffix)) {
      replaceCount = count
    }
  }

  const retainedWords = beforeWords.slice(0, -(replaceCount || 1))
  const prefix = retainedWords.length > 0 ? `${retainedWords.join(' ')} ` : ''
  const suffix = after.trimStart()
  const value = `${prefix}${normalizedTerm}${suffix ? ` ${suffix}` : ' '}`

  return {
    value,
    caret: prefix.length + normalizedTerm.length + 1,
  }
}
