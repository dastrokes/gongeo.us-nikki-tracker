type UseCompendiumListingViewOptions = {
  currentPage?: Ref<number>
}

export const compendiumListingViewKey = Symbol('compendiumListingView')

export const useCompendiumListingView = (
  options: UseCompendiumListingViewOptions = {}
) => {
  const viewMode = useState<ListingDisplayMode>(
    'compendium-listing-view-mode',
    () => 'standard'
  )

  const isThumbnailView = computed(() => viewMode.value === 'thumbnail')

  const showEntryMeta = computed(() => !isThumbnailView.value)

  const pageSize = computed(() => getListingPageSize(viewMode.value))

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
        wardrobe: 'top-1 right-1 z-30',
      } satisfies Record<ListingCardCorner, string>
    }

    return {
      'top-right': 'top-2 right-2 z-20',
      'top-left': 'top-2 left-2 z-20',
      wardrobe: 'right-2 bottom-2 z-30',
    } satisfies Record<ListingCardCorner, string>
  })

  const nameFadeThumbnailClass =
    "absolute inset-x-0 bottom-0 z-20 flex h-1/2 w-full flex-col justify-end bg-[url('/images/fade.png')] [background-size:100%_100%] bg-bottom bg-no-repeat px-1.5 pb-1"

  const nameFadeStandardClass =
    "absolute right-0 bottom-0 left-0 z-20 bg-[url('/images/fade.png')] [background-size:100%_100%] bg-no-repeat"

  const setViewMode = (mode: ListingDisplayMode) => {
    viewMode.value = mode
  }

  const toggleViewMode = () => {
    viewMode.value = viewMode.value === 'thumbnail' ? 'standard' : 'thumbnail'
  }

  watch(viewMode, () => {
    if (options.currentPage) {
      options.currentPage.value = 1
    }
  })

  const context = {
    viewMode,
    isThumbnailView,
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
    toggleViewMode,
  }

  return context
}

export const provideCompendiumListingView = (
  options: UseCompendiumListingViewOptions = {}
) => {
  const context = useCompendiumListingView(options)
  provide(compendiumListingViewKey, context)
  return context
}

export const useCompendiumListingViewContext = () => {
  const context = inject(compendiumListingViewKey)
  if (!context) {
    throw new Error(
      'useCompendiumListingViewContext requires provideCompendiumListingView'
    )
  }

  return context
}
