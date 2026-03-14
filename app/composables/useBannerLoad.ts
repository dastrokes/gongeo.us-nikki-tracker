export interface UseBannerLoadOptions {
  allBanners: Ref<Banner[]>
  batchSize?: number
  scrollThreshold?: number
}

export interface UseBannerLoadReturn {
  displayedBanners: Ref<Banner[]>
  isLoading: Ref<boolean>
  reset: () => void
  loadUntilBanner: (bannerId: number) => Promise<void>
  observerTarget: Ref<HTMLElement | null>
}

export function useBannerLoad(
  options: UseBannerLoadOptions
): UseBannerLoadReturn {
  const { allBanners, batchSize = 4, scrollThreshold = 500 } = options

  // Reactive state
  const displayedBanners = ref<Banner[]>([])
  const isLoading = ref(false)
  const hasMore = ref(true)
  const currentIndex = ref(0)
  const observerTarget = ref<HTMLElement | null>(null)

  const waitForRenderFrame = async () => {
    if (!import.meta.client) {
      await nextTick()
      return
    }

    await new Promise((resolve) => requestAnimationFrame(resolve))
  }

  // Load more banners
  const loadMore = () => {
    if (isLoading.value || !hasMore.value) return

    isLoading.value = true

    const startIndex = currentIndex.value
    const endIndex = Math.min(startIndex + batchSize, allBanners.value.length)

    // Load next batch
    const nextBatch = allBanners.value.slice(startIndex, endIndex)
    displayedBanners.value.push(...nextBatch)

    // Update state
    currentIndex.value = endIndex
    hasMore.value = endIndex < allBanners.value.length
    isLoading.value = false
  }

  const loadInitialBatch = () => {
    if (displayedBanners.value.length > 0 || currentIndex.value > 0) return
    if (allBanners.value.length === 0) {
      hasMore.value = false
      return
    }

    hasMore.value = true
    loadMore()
  }

  // Reset state
  const reset = () => {
    displayedBanners.value = []
    currentIndex.value = 0
    hasMore.value = true
    loadMore()
  }

  // Load until specific banner
  const loadUntilBanner = async (bannerId: number) => {
    const targetIndex = allBanners.value.findIndex(
      (banner) => banner.bannerId === bannerId
    )

    if (targetIndex === -1) {
      return
    }

    // If already loaded, no need to load more
    if (targetIndex < displayedBanners.value.length) {
      return
    }

    isLoading.value = true

    // Append banners in chunks
    const startIndex = displayedBanners.value.length
    currentIndex.value = startIndex
    const bannersToAppend = allBanners.value.slice(startIndex, targetIndex + 1)

    for (let i = 0; i < bannersToAppend.length; i += batchSize) {
      const chunk = bannersToAppend.slice(i, i + batchSize)
      displayedBanners.value.push(...chunk)
      currentIndex.value += chunk.length
      hasMore.value = currentIndex.value < allBanners.value.length

      if (i + batchSize < bannersToAppend.length) {
        await waitForRenderFrame()
      }
    }

    isLoading.value = false
  }

  // Set up intersection observer
  const { stop } = useIntersectionObserver(
    observerTarget,
    (entries) => {
      const entry = entries[0]
      if (entry?.isIntersecting && !isLoading.value && hasMore.value) {
        loadMore()
      }
    },
    {
      rootMargin: `${scrollThreshold}px`,
      threshold: 0.1,
    }
  )

  watch(
    () => allBanners.value.length,
    () => {
      loadInitialBatch()
    },
    { immediate: true }
  )

  // Cleanup on unmount
  onUnmounted(() => {
    stop()
  })

  return {
    displayedBanners,
    isLoading,
    reset,
    loadUntilBanner,
    observerTarget,
  }
}
