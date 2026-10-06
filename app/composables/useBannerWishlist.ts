const bannerWishlistState = () => ({
  data: useState<BannerWishlistData>(
    'banner-wishlist:data',
    createEmptyBannerWishlist
  ),
  initialized: useState<boolean>('banner-wishlist:initialized', () => false),
  loading: useState<boolean>('banner-wishlist:loading', () => false),
  savingBannerId: useState<number | null>(
    'banner-wishlist:saving-banner-id',
    () => null
  ),
  error: useState<Error | null>('banner-wishlist:error', () => null),
  activeSlotLoaded: useState<number | null>(
    'banner-wishlist:active-slot-loaded',
    () => null
  ),
})

let bannerWishlistInitRunId = 0

export const useBannerWishlist = () => {
  const {
    data,
    initialized,
    loading,
    savingBannerId,
    error,
    activeSlotLoaded,
  } = bannerWishlistState()
  const { activeSlot } = useProfileSlots()
  const { loadBannerWishlist, saveBannerWishlist } = useIndexedDB()

  const entries = computed(() =>
    activeSlotLoaded.value === activeSlot.value ? data.value.entries : []
  )
  const count = computed(() => entries.value.length)
  const savedBannerIds = computed(
    () => new Set(entries.value.map((entry) => entry.bannerId))
  )
  const ready = computed(
    () =>
      initialized.value &&
      activeSlotLoaded.value === activeSlot.value &&
      !loading.value &&
      !error.value
  )
  const saving = computed(() => savingBannerId.value !== null)
  const canMutate = computed(() => ready.value && !saving.value)
  const isSaved = (bannerId: number) => savedBannerIds.value.has(bannerId)

  const init = async ({ force = false } = {}) => {
    const slot = activeSlot.value
    if (!force && initialized.value && activeSlotLoaded.value === slot) return
    const runId = ++bannerWishlistInitRunId
    loading.value = true
    error.value = null
    try {
      const next = await loadBannerWishlist(slot)
      if (runId !== bannerWishlistInitRunId || slot !== activeSlot.value) return
      data.value = next ?? createEmptyBannerWishlist()
      activeSlotLoaded.value = slot
      initialized.value = true
    } catch (caught) {
      if (runId !== bannerWishlistInitRunId) return
      initialized.value = false
      error.value = toError(caught, 'Failed to load banner wish list')
    } finally {
      if (runId === bannerWishlistInitRunId) loading.value = false
    }
  }

  const persistOptimistic = async (
    bannerId: number,
    next: BannerWishlistData
  ) => {
    if (!canMutate.value)
      throw new Error('Banner wish list storage is not ready')
    const slot = activeSlot.value
    const previous = data.value
    data.value = normalizeBannerWishlist(next)
    const optimistic = data.value
    savingBannerId.value = bannerId
    try {
      await saveBannerWishlist(optimistic, slot)
    } catch (caught) {
      if (slot === activeSlotLoaded.value && data.value === optimistic)
        data.value = previous
      throw toError(caught, 'Failed to save banner wish list')
    } finally {
      savingBannerId.value = null
    }
  }

  const toggle = async (bannerId: number) =>
    persistOptimistic(bannerId, {
      version: 1,
      entries: isSaved(bannerId)
        ? entries.value.filter((entry) => entry.bannerId !== bannerId)
        : [...entries.value, { bannerId }],
    })

  return {
    data: readonly(data),
    entries,
    count,
    savedBannerIds,
    ready,
    initialized: readonly(initialized),
    loading: readonly(loading),
    saving,
    savingBannerId: readonly(savingBannerId),
    error: readonly(error),
    canMutate,
    isSaved,
    init,
    toggle,
  }
}
