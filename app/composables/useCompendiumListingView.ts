type UseCompendiumListingViewOptions = {
  currentPage?: Ref<number>
}

type ListingPreferences = {
  viewMode?: ListingDisplayMode
  compactPageSize?: boolean
}

const LISTING_PREFERENCES_KEY = 'gongeous-compendium-settings'

export const compendiumListingViewKey = Symbol('compendiumListingView')

export const useCompendiumListingView = (
  options: UseCompendiumListingViewOptions = {}
) => {
  const viewMode = ref<ListingDisplayMode>('standard')
  const compactPageSize = ref(true)
  const preferencesReady = ref(false)

  const isThumbnailView = computed(() => viewMode.value === 'thumbnail')

  const showEntryMeta = computed(() => !isThumbnailView.value)

  const pageSize = computed(() =>
    getListingPageSize(viewMode.value, compactPageSize.value)
  )

  const imageSizes = computed(() => getListingImageSizes(viewMode.value))

  const imagePreset = computed(() => getListingImagePreset(viewMode.value))

  const outfitCardSize = computed(() =>
    getListingOutfitCardSize(viewMode.value)
  )

  const gridClass = computed(() =>
    isThumbnailView.value
      ? 'grid grid-cols-6 gap-1.5 sm:grid-cols-12 sm:gap-2 sm:content-start'
      : 'grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3 sm:content-start'
  )

  const overlayCornerClasses = computed(() => {
    if (isThumbnailView.value) {
      return {
        'top-right': 'top-1 right-1 z-20',
        'top-left': 'top-1 left-1 z-20',
        wardrobe: 'right-1 bottom-1 z-30',
      } satisfies Record<ListingCardCorner, string>
    }

    return {
      'top-right': 'top-2 right-2 z-20',
      'top-left': 'top-2 left-2 z-20',
      wardrobe: 'right-2 bottom-2 z-30',
    } satisfies Record<ListingCardCorner, string>
  })

  const nameFadeThumbnailClass =
    "absolute inset-x-0 bottom-0 z-20 flex h-16 w-full flex-col justify-end bg-[url('/images/fade.png')] [background-size:100%_100%] bg-bottom bg-no-repeat px-1.5 pb-1"

  const nameFadeStandardClass =
    "absolute right-0 bottom-0 left-0 z-20 flex h-28 flex-col justify-end bg-[url('/images/fade.png')] [background-size:100%_100%] bg-no-repeat"

  const setViewMode = (mode: ListingDisplayMode) => {
    viewMode.value = mode
  }

  const setCompactPageSize = (compact: boolean) => {
    compactPageSize.value = compact
  }

  const toggleViewMode = () => {
    viewMode.value = viewMode.value === 'thumbnail' ? 'standard' : 'thumbnail'
  }

  const toggleCompactPageSize = () => {
    compactPageSize.value = !compactPageSize.value
  }

  const loadPreferences = () => {
    if (preferencesReady.value) return

    try {
      const stored = localStorage.getItem(LISTING_PREFERENCES_KEY)
      const preferences = stored
        ? (JSON.parse(stored) as ListingPreferences)
        : null

      if (
        preferences?.viewMode === 'standard' ||
        preferences?.viewMode === 'thumbnail'
      ) {
        viewMode.value = preferences.viewMode
      }

      compactPageSize.value =
        typeof preferences?.compactPageSize === 'boolean'
          ? preferences.compactPageSize
          : true
    } catch (error) {
      console.warn('Failed to load listing preferences:', error)
      compactPageSize.value = true
    } finally {
      preferencesReady.value = true
    }
  }

  const savePreferences = () => {
    if (!preferencesReady.value) return

    try {
      localStorage.setItem(
        LISTING_PREFERENCES_KEY,
        JSON.stringify({
          viewMode: viewMode.value,
          compactPageSize: compactPageSize.value,
        } satisfies ListingPreferences)
      )
    } catch (error) {
      console.warn('Failed to save listing preferences:', error)
    }
  }

  watch(viewMode, () => {
    if (options.currentPage) {
      options.currentPage.value = 1
    }
  })

  watch([viewMode, compactPageSize], savePreferences)

  onMounted(loadPreferences)

  const context = {
    viewMode,
    isThumbnailView,
    compactPageSize,
    preferencesReady,
    showEntryMeta,
    pageSize,
    imageSizes,
    imagePreset,
    outfitCardSize,
    gridClass,
    overlayCornerClasses,
    nameFadeThumbnailClass,
    nameFadeStandardClass,
    setViewMode,
    setCompactPageSize,
    toggleViewMode,
    toggleCompactPageSize,
  }

  return context
}

type CompendiumListingViewContext = ReturnType<typeof useCompendiumListingView>

const compendiumListingViewContextByInstance = new WeakMap<
  object,
  CompendiumListingViewContext
>()

const getCompendiumListingViewContext = () => {
  const injectedContext = inject(
    compendiumListingViewKey,
    null
  ) as CompendiumListingViewContext | null
  if (injectedContext) return injectedContext

  const instance = getCurrentInstance()
  return instance
    ? (compendiumListingViewContextByInstance.get(instance) ?? null)
    : null
}

export const provideCompendiumListingView = (
  options: UseCompendiumListingViewOptions = {}
) => {
  const context = useCompendiumListingView(options)
  const instance = getCurrentInstance()
  if (instance) {
    compendiumListingViewContextByInstance.set(instance, context)
  }
  provide(compendiumListingViewKey, context)
  return context
}

export const useCompendiumListingViewContext = () => {
  const context = getCompendiumListingViewContext()
  if (!context) {
    throw new Error(
      'useCompendiumListingViewContext requires provideCompendiumListingView'
    )
  }

  return context
}

export const useCompendiumListingPreferencesReady = () => {
  const context = getCompendiumListingViewContext()

  return computed(() => context?.preferencesReady.value ?? true)
}
