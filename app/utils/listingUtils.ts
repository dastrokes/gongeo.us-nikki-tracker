export const LISTING_CRITICAL_IMAGE_COUNT = 6
export const BANNER_RAIL_INITIAL_IMAGE_COUNT = 8

export const getListingImageLoading = (
  index: number,
  eagerCount = LISTING_CRITICAL_IMAGE_COUNT
) => (index < eagerCount ? 'eager' : 'lazy')

export const getListingImageFetchPriority = (index: number) =>
  index === 0 ? 'high' : 'auto'

export const getListingCardAnimationClass = (_index: number) =>
  'animate-fade-in-up motion-reduce:animate-none'

export const getListingCardAnimationStyle = (index: number) => ({
  animationDelay: `${Math.min(index + 1, 9) * 0.05}s`,
})

export const getListingQualityOverlayClass = (quality: number) => {
  switch (quality) {
    case 5:
      return 'bg-yellow-500/5'
    case 4:
      return 'bg-blue-500/5'
    case 3:
      return 'bg-green-500/5'
    default:
      return 'bg-gray-500/5'
  }
}
