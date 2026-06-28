export const getImageProvider = () => {
  const configuredProvider = process.env.NUXT_PUBLIC_IMAGE_PROVIDER

  if (
    configuredProvider === 'ipx' ||
    configuredProvider === 'netlify' ||
    configuredProvider === 'imagekit' ||
    configuredProvider === 'cloudinary'
  ) {
    return configuredProvider
  }

  return process.env.NODE_ENV === 'production' ? 'netlify' : 'ipx'
}

const cdnBaseUrl =
  process.env.NUXT_PUBLIC_IMAGE_CDN_BASE_URL || 'https://cdn.gongeo.us'

type ImageProvider = 'ipx' | 'netlify' | 'imagekit' | 'cloudinary'

interface ImageRuntimeConfig {
  imageProvider?: unknown
  imagekitBaseUrl?: unknown
  cloudinaryBaseUrl?: unknown
  cdnBaseUrl?: unknown
}

type ImageSrcType =
  | 'banner'
  | 'bannerThumb'
  | 'outfit'
  | 'item'
  | 'itemIcon'
  | 'momo'
  | 'momoIcon'
  | 'fullMakeup'
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
    case 'momo':
      return `/images/momo/${id}.png`
    case 'momoIcon':
      return `/images/momo/icons/${id}.png`
    case 'fullMakeup':
      return `/images/items/makeups/${id}.png`
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
) => `${cdnBaseUrl}${getImagePath(type, id, variant)}`

export const getImagePreconnectHref = (publicConfig: ImageRuntimeConfig) => {
  const provider = publicConfig.imageProvider as ImageProvider | undefined
  const baseUrl =
    provider === 'cloudinary'
      ? publicConfig.cloudinaryBaseUrl
      : provider === 'imagekit'
        ? publicConfig.imagekitBaseUrl
        : null

  if (!baseUrl) return null

  try {
    return new URL(String(baseUrl)).origin
  } catch {
    return null
  }
}

export const imageProvider = () => {
  const runtimeConfig = useRuntimeConfig()

  const cdnBase = runtimeConfig.public.cdnBaseUrl as string
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

    if (provider === 'netlify') {
      return `${cdnBase}${path}`
    }

    if (
      provider === 'ipx' ||
      provider === 'imagekit' ||
      provider === 'cloudinary'
    ) {
      return path
    }

    return getImagePath(type, id, options?.variant)
  }

  return {
    getImageSrc,
  }
}
