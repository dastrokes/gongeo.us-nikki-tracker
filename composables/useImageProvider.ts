export const useImageProvider = () => {
  const isDev = import.meta.dev

  const getImageUrl = (
    path: string,
    options?: {
      width?: number
      height?: number
      quality?: number
      format?: 'webp' | 'avif' | 'png' | 'jpg' | 'jpeg'
      provider?: 'imagekit' | 'bunny'
    }
  ) => {
    // In development, use local images
    if (isDev) {
      return path
    }

    const provider = options?.provider || 'bunny'
    const cleanPath = path.startsWith('/') ? path : `/${path}`

    if (provider === 'bunny') {
      // Use Bunny CDN
      const baseUrl = 'https://cdn.gongeo.us'

      // Build query parameters for Bunny
      const params: string[] = []
      if (options?.width) params.push(`width=${options.width}`)
      if (options?.height) params.push(`height=${options.height}`)
      if (options?.quality) params.push(`quality=${options.quality}`)
      if (options?.format) params.push(`format=${options.format}`)

      const queryString = params.length > 0 ? `?${params.join('&')}` : ''
      return `${baseUrl}${cleanPath}${queryString}`
    } else {
      // Use ImageKit
      const baseUrl = 'https://ik.imagekit.io/gongeous'

      // Build transformation parameters for ImageKit
      const params: string[] = []
      if (options?.width) params.push(`w-${options.width}`)
      if (options?.height) params.push(`h-${options.height}`)
      if (options?.quality) params.push(`q-${options.quality}`)
      if (options?.format) params.push(`f-${options.format}`)

      const transformation = params.length > 0 ? `tr:${params.join(',')}` : ''

      return transformation
        ? `${baseUrl}/${transformation}${cleanPath}`
        : `${baseUrl}${cleanPath}`
    }
  }

  return {
    getImageUrl,
  }
}
