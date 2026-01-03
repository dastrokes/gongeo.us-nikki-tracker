export const useImageKit = () => {
  const isDev = import.meta.dev

  const getImageKitUrl = (
    path: string,
    options?: { width?: number; height?: number; quality?: number }
  ) => {
    // In development, use local images
    if (isDev) {
      return path
    }

    // In production, use ImageKit
    const baseUrl = 'https://ik.imagekit.io/gongeous'
    const cleanPath = path.startsWith('/') ? path : `/${path}`

    // Build transformation parameters
    const params: string[] = []
    if (options?.width) params.push(`w-${options.width}`)
    if (options?.height) params.push(`h-${options.height}`)
    if (options?.quality) params.push(`q-${options.quality}`)

    const transformation = params.length > 0 ? `tr:${params.join(',')}` : ''

    return transformation
      ? `${baseUrl}/${transformation}${cleanPath}`
      : `${baseUrl}${cleanPath}`
  }

  return {
    getImageKitUrl,
  }
}
