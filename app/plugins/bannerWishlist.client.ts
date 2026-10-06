export default defineNuxtPlugin(() => {
  const wishlist = useBannerWishlist()
  const { activeSlot } = useProfileSlots()
  onNuxtReady(() => {
    watch(
      activeSlot,
      () => {
        void wishlist.init({ force: true })
      },
      { flush: 'sync' }
    )
    void wishlist.init()
  })
})
