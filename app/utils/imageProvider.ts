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

export const imageProvider = () => {
  const runtimeConfig = useRuntimeConfig()

  type ImageProvider = 'ipx' | 'netlify' | 'imagekit' | 'cloudinary' | 'bunny'
  type ImageSrcType =
    | 'banner'
    | 'bannerThumb'
    | 'outfit'
    | 'item'
    | 'itemIcon'
    | 'emote'
    | 'static'

  const imagekitBaseUrl = runtimeConfig.public.imagekitBaseUrl as string
  const cloudinaryBaseUrl = runtimeConfig.public.cloudinaryBaseUrl as string
  const bunnyBaseUrl = runtimeConfig.public.bunnyBaseUrl as string
  const defaultProvider = runtimeConfig.public.imageProvider as ImageProvider

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
      return `${imagekitBaseUrl || cloudinaryBaseUrl || bunnyBaseUrl}${path}`
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
