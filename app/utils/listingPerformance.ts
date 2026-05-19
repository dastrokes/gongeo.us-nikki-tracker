export const LISTING_CRITICAL_IMAGE_COUNT = 6
export const BANNER_RAIL_INITIAL_IMAGE_COUNT = 8

export const getListingImageLoading = (
  index: number,
  eagerCount = LISTING_CRITICAL_IMAGE_COUNT
) => (index < eagerCount ? 'eager' : 'lazy')

export const getListingImageFetchPriority = (index: number) =>
  index === 0 ? 'high' : 'auto'

export const getListingCardAnimationClass = (
  index: number,
  eagerCount = LISTING_CRITICAL_IMAGE_COUNT
) =>
  index < eagerCount
    ? 'motion-reduce:animate-none'
    : 'animate-fade-in-up motion-reduce:animate-none'

export const getListingCardAnimationStyle = (
  index: number,
  eagerCount = LISTING_CRITICAL_IMAGE_COUNT
) =>
  index < eagerCount
    ? undefined
    : {
        animationDelay: `${Math.min(index - eagerCount + 1, 6) * 0.05}s`,
      }
