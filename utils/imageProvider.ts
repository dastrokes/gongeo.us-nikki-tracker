export const imageProvider = () => {
  const isDev = import.meta.dev
  const runtimeConfig = useRuntimeConfig()

  type ImageProvider = 'ipx' | 'netlify' | 'bunny' | 'imagekit'
  type ImageSrcType =
    | 'banner'
    | 'bannerThumb'
    | 'outfit'
    | 'item'
    | 'itemIcon'
    | 'static'

  const imagekitBaseUrl = runtimeConfig.public.imagekitBaseUrl as string
  const bunnyBaseUrl = runtimeConfig.public.bunnyBaseUrl as string
  const defaultProvider = runtimeConfig.public.imageProvider as ImageProvider

  const getImageUrl = (
    path: string,
    options?: {
      width?: number
      height?: number
      quality?: number
      format?: 'webp' | 'avif' | 'png' | 'jpg' | 'jpeg'
      provider?: ImageProvider
    }
  ) => {
    // In development, use local images
    if (isDev) {
      return path
    }

    const provider = options?.provider || defaultProvider
    const cleanPath = path.startsWith('/') ? path : `/${path}`

    if (provider === 'ipx') {
      return cleanPath
    }

    if (provider === 'bunny') {
      // Use Bunny CDN
      // Build query parameters for Bunny
      const params: string[] = []
      if (options?.width) params.push(`width=${options.width}`)
      if (options?.height) params.push(`height=${options.height}`)
      if (options?.quality) params.push(`quality=${options.quality}`)
      if (options?.format) params.push(`format=${options.format}`)

      const queryString = params.length > 0 ? `?${params.join('&')}` : ''
      return `${bunnyBaseUrl}${cleanPath}${queryString}`
    }

    // Use ImageKit
    if (provider === 'imagekit') {
      // Build transformation parameters for ImageKit
      const params: string[] = []
      if (options?.width) params.push(`w-${options.width}`)
      if (options?.height) params.push(`h-${options.height}`)
      if (options?.quality) params.push(`q-${options.quality}`)
      if (options?.format) params.push(`f-${options.format}`)

      const transformation = params.length > 0 ? `tr:${params.join(',')}` : ''

      return transformation
        ? `${imagekitBaseUrl}/${transformation}${cleanPath}`
        : `${imagekitBaseUrl}${cleanPath}`
    }

    // Use Netlify Image CDN
    if (provider === 'netlify') {
      // Build query parameters for Netlify
      const params: string[] = []
      if (options?.width) params.push(`w=${options.width}`)
      if (options?.height) params.push(`h=${options.height}`)
      if (options?.format) params.push(`fm=${options.format}`)
      if (options?.quality) params.push(`q=${options.quality}`)
      params.push('fit=cover')

      // Encode the full ImageKit URL as the source
      const sourceUrl = encodeURIComponent(`${imagekitBaseUrl}${cleanPath}`)
      const queryString = params.join('&')

      return `${runtimeConfig.public.baseUrl}/.netlify/images?${queryString}&url=${sourceUrl}`
    }

    return cleanPath
  }

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

    if (provider === 'ipx' || provider === 'imagekit' || provider === 'bunny') {
      return path
    }

    if (provider === 'netlify') {
      return `${imagekitBaseUrl}${path}`
    }

    return path
  }

  return {
    getImageUrl,
    getImageSrc,
  }
}
