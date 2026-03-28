/**
 * Composable for translating item-search filter token values using filter.json
 * locale messages. The locale file is namespaced under `filter`, so keys
 * resolve as `filter.<field>.<value>`.
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
   *  1. `filter.<field>.<value>` i18n key (from filter.json), if its
   *     translation resolves to a non-empty label.
   *  2. Fallback to `humanizeItemSearchToken(value)` (title-cased English).
   */
  const translateFilterToken = (
    field: string,
    value?: string | null
  ): string => {
    const normalizedValue = normalizeItemSearchTokenKey(value)
    if (!normalizedValue) return humanizeItemSearchToken(value)

    const key = `filter.${field}.${normalizedValue}`
    const translated = t(key)
    if (translated && translated !== key) {
      return translated
    }

    return humanizeItemSearchToken(normalizedValue)
  }

  return { translateFilterToken }
}
