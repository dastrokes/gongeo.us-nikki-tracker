import type { Banner } from '~/types/banner'

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
  const { allBanners, batchSize = 5, scrollThreshold = 500 } = options

  // Reactive state
  const displayedBanners = ref<Banner[]>([])
  const isLoading = ref(false)
  const hasMore = ref(true)
  const currentIndex = ref(0)
  const observerTarget = ref<HTMLElement | null>(null)

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

    // Load all banners from 0 to target index (inclusive)
    const bannersToLoad = allBanners.value.slice(0, targetIndex + 1)
    displayedBanners.value = bannersToLoad
    currentIndex.value = targetIndex + 1
    hasMore.value = currentIndex.value < allBanners.value.length
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

  // Load initial batch
  onMounted(() => {
    loadMore()
  })

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
