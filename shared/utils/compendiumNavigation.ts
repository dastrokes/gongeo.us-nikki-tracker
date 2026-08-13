export type CompendiumListingSection =
  'items' | 'outfits' | 'makeups' | 'momo' | 'props'

type CompendiumSwitchFilters = {
  quality?: number | null
  version?: string | null
  source?: string | null
  wardrobe?: string | null
}

const QUALITY_VALUES_BY_SECTION: Record<
  CompendiumListingSection,
  readonly number[]
> = {
  items: [5, 4, 3, 2],
  outfits: [5, 4, 3],
  makeups: [5, 4, 3],
  momo: [5, 4, 3],
  props: [6, 5, 4, 3],
}

const MOMO_SOURCE_KEYS = new Set(MOMO_SOURCE_GROUPS.map((group) => group.key))
const OBTAIN_SOURCE_KEYS = new Set(OBTAIN_GROUPS.map((group) => group.key))

const supportsObtainSource = (
  section: Exclude<CompendiumListingSection, 'props'>,
  source: string
) => {
  if (section === 'momo') return MOMO_SOURCE_KEYS.has(source)
  if (!OBTAIN_SOURCE_KEYS.has(source)) return false
  if (section === 'outfits') return isObtainGroupVisibleInOutfits(source)
  if (section === 'makeups') return isObtainGroupVisibleInMakeups(source)
  return true
}

const resolveSwitchSource = (
  currentSection: CompendiumListingSection,
  nextSection: CompendiumListingSection,
  source: string | null | undefined
) => {
  if (!source) return null
  if (isListingMissingFilterValue(source)) return source

  const obtainSource =
    currentSection === 'props' && !resolvePropSourceFromObtainGroupKey(source)
      ? (resolveObtainGroupKeyFromPropSource(source as PropSource) ?? source)
      : source

  if (nextSection === 'props') {
    return resolvePropSourceFromObtainGroupKey(obtainSource)
      ? obtainSource
      : null
  }

  return supportsObtainSource(nextSection, obtainSource) ? obtainSource : null
}

const supportsWardrobeFilter = (
  section: CompendiumListingSection,
  wardrobe: string
) =>
  wardrobe === 'owned' ||
  wardrobe === 'missing' ||
  (wardrobe === 'partial' && (section === 'outfits' || section === 'makeups'))

export const buildCompendiumSwitchQuery = (
  currentSection: CompendiumListingSection,
  nextSection: CompendiumListingSection,
  filters: CompendiumSwitchFilters
) => {
  const source = resolveSwitchSource(
    currentSection,
    nextSection,
    filters.source
  )
  const wardrobe =
    filters.wardrobe && supportsWardrobeFilter(nextSection, filters.wardrobe)
      ? filters.wardrobe
      : null

  return {
    ...(filters.quality !== null &&
      filters.quality !== undefined &&
      QUALITY_VALUES_BY_SECTION[nextSection].includes(filters.quality) && {
        quality: filters.quality,
      }),
    ...(filters.version && { version: filters.version }),
    ...(source && { source }),
    ...(wardrobe && { wardrobe }),
  }
}
