export const getImageProvider = () => {
  const configuredProvider = process.env.NUXT_PUBLIC_IMAGE_PROVIDER

  if (
    configuredProvider === 'ipx' ||
    configuredProvider === 'netlify' ||
    configuredProvider === 'imagekit' ||
    configuredProvider === 'cloudinary' ||
    configuredProvider === 'bunny'
  ) {
    return configuredProvider
  }

  return process.env.NODE_ENV === 'production' ? 'netlify' : 'ipx'
}

const imagekitBaseUrl =
  process.env.NUXT_PUBLIC_IMAGEKIT_BASE_URL || 'https://ik.imagekit.io/gongeous'
const cloudinaryBaseUrl =
  process.env.NUXT_PUBLIC_CLOUDINARY_BASE_URL ||
  'https://res.cloudinary.com/gongeous/image/upload'
const bunnyBaseUrl =
  process.env.NUXT_PUBLIC_BUNNY_BASE_URL || 'https://cdn.gongeo.us'
const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://gongeo.us'

const cdnImageBaseUrl = cloudinaryBaseUrl || imagekitBaseUrl || bunnyBaseUrl

type ImageSrcType =
  | 'banner'
  | 'bannerThumb'
  | 'outfit'
  | 'item'
  | 'itemIcon'
  | 'emote'
  | 'static'

const getImagePath = (
  type: ImageSrcType,
  id: string | number,
  variant?: string | number
) => {
  switch (type) {
    case 'banner':
      return `/images/banners/${id}.png`
    case 'bannerThumb':
      return `/images/banners/thumbnails/${id}.png`
    case 'outfit':
      return `/images/outfits/${id}${variant ?? ''}.png`
    case 'item':
      return `/images/items/${id}.png`
    case 'itemIcon':
      return `/images/items/icons/${id}.png`
    case 'emote':
      return `/images/emotes/${id}.webp`
    case 'static': {
      const path = typeof id === 'string' ? id : String(id)
      return path.startsWith('/') ? path : `/${path}`
    }
    default: {
      const _exhaustive: never = type
      return _exhaustive
    }
  }
}

export const getOgImageSrc = (
  type: ImageSrcType,
  id: string | number,
  variant?: string | number
) => {
  const path = getImagePath(type, id, variant)
  return cdnImageBaseUrl ? `${cdnImageBaseUrl}${path}` : `${siteUrl}${path}`
}

export const imageProvider = () => {
  const runtimeConfig = useRuntimeConfig()

  type ImageProvider = 'ipx' | 'netlify' | 'imagekit' | 'cloudinary' | 'bunny'

  const imagekitBase = runtimeConfig.public.imagekitBaseUrl as string
  const cloudinaryBase = runtimeConfig.public.cloudinaryBaseUrl as string
  const bunnyBase = runtimeConfig.public.bunnyBaseUrl as string
  const defaultProvider = runtimeConfig.public.imageProvider as ImageProvider

  const getImageSrc = (
    type: ImageSrcType,
    id: string | number,
    options?: {
      variant?: string | number
      provider?: ImageProvider
    }
  ) => {
    const path = getImagePath(type, id, options?.variant)
    const provider = options?.provider || defaultProvider

    // Serve images from netlify directly
    if (type === 'banner' || type === 'bannerThumb' || type === 'emote') {
      return path
    }

    if (provider === 'netlify') {
      return `${imagekitBase || cloudinaryBase || bunnyBase}${path}`
    }

    if (
      provider === 'ipx' ||
      provider === 'imagekit' ||
      provider === 'cloudinary' ||
      provider === 'bunny'
    ) {
      return path
    }

    return getImagePath(type, id, options?.variant)
  }

  return {
    getImageSrc,
  }
}
