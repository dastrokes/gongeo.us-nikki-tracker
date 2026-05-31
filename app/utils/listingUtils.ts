export const LISTING_CRITICAL_IMAGE_COUNT = 6
export const BANNER_RAIL_INITIAL_IMAGE_COUNT = 8

export const LISTING_PAGE_SIZE_STANDARD = 18
export const LISTING_PAGE_SIZE_THUMBNAIL = 72
export const COMPENDIUM_TIER_ENTRY_LIMIT = 200

export type ListingDisplayMode = 'standard' | 'thumbnail'

export type ListingCardCorner = 'top-right' | 'top-left' | 'wardrobe'

type ListingAsyncStatus = 'idle' | 'pending' | 'success' | 'error'

export const getListingPageSize = (mode: ListingDisplayMode) =>
  mode === 'thumbnail'
    ? LISTING_PAGE_SIZE_THUMBNAIL
    : LISTING_PAGE_SIZE_STANDARD

export const getListingImageSizes = (mode: ListingDisplayMode) =>
  mode === 'thumbnail' ? '100px' : '200px'

export const getListingImagePreset = (mode: ListingDisplayMode) =>
  mode === 'thumbnail' ? 'tallSm' : 'tallLg'

export const getListingOutfitCardSize = (
  mode: ListingDisplayMode
): 'sm' | 'md' => (mode === 'thumbnail' ? 'sm' : 'md')

export const isListingInitialLoading = ({
  error,
  entryCount,
  pending,
  status,
}: {
  error: unknown
  entryCount: number
  pending: boolean
  status: ListingAsyncStatus | string
}) => !error && entryCount === 0 && (status === 'idle' || pending)

export const getListingWardrobeCacheKey = (
  ownershipMode: string,
  mutationVersion: number
) => (ownershipMode === 'all' ? 'all' : mutationVersion)

export const getListingImageLoading = (
  index: number,
  eagerCount = LISTING_CRITICAL_IMAGE_COUNT
) => (index < eagerCount ? 'eager' : 'lazy')

export const getListingImageFetchPriority = (index: number) =>
  index === 0 ? 'high' : 'auto'

export const getListingCardAnimationClass = (_index: number) =>
  'animate-fade-in-up motion-reduce:animate-none'

export const getListingCardAnimationStyle = (index: number) => {
  const delay = `${Math.min(index + 1, 9) * 50}ms`

  return {
    '--animate-fade-in-up': `fade-in-up 0.5s ease-out ${delay} backwards`,
    '--listing-animation-delay': delay,
  }
}

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
