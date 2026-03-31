/**
 * Composable for translating item-search filter token values using filter.json
 * locale messages. Category and subcategory labels are item-type scoped
 * under `filter.<field>.<itemType>.<value>`, while the rest resolve as
 * `filter.<field>.<value>`.
 *
 * Usage:
 *   const { translateFilterToken } = useFilterToken()
 *   translateFilterToken('hair_length', 'long') // → "Long" / "长发" / …
 */
export const useFilterToken = () => {
  const { t } = useI18n()

  /**
   * Returns a localized label for `value` within `field`.
   *
   * Resolution order:
   *  1. `filter.category.<itemType>.<value>` or
   *     `filter.subcategory.<itemType>.<value>` for
   *     category/subcategory labels.
   *  2. `filter.<field>.<value>` for all other fields.
   *  3. Fallback to `humanizeItemSearchToken(value)` (title-cased English).
   */
  const translateFilterToken = (
    field: string,
    value?: string | null,
    itemType?: string | null
  ): string => {
    const normalizedValue = normalizeItemSearchTokenKey(value)
    if (!normalizedValue) return humanizeItemSearchToken(value)

    if (field === 'category' || field === 'subcategory') {
      const normalizedItemType = normalizeItemSearchItemType(itemType)
      if (normalizedItemType) {
        const key = `filter.${field}.${normalizedItemType}.${normalizedValue}`
        const translated = t(key)
        if (translated && translated !== key) {
          return translated
        }
      }

      return humanizeItemSearchToken(normalizedValue)
    }

    const key = `filter.${field}.${normalizedValue}`
    const translated = t(key)
    if (translated && translated !== key) {
      return translated
    }

    return humanizeItemSearchToken(normalizedValue)
  }

  return { translateFilterToken }
}
