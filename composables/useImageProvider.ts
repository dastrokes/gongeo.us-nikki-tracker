import { computed } from 'vue'

export const useImageProvider = () => {
  const isChina = computed(() => {
    if (import.meta.client) {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      return timezone.startsWith('Asia/Shanghai')
    }
    return true
  })

  const getImageUrl = (
    path: string,
    opts?: {
      width?: number | string
      height?: number | string
      quality?: number
      format?: string
      fit?: string
    }
  ) => {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path

    if (isChina.value) {
      const base = 'https://static.gongeo.us/image'
      const params = new URLSearchParams({ src: `/${cleanPath}` })

      if (opts?.width) params.append('w', String(opts.width))
      if (opts?.height) params.append('h', String(opts.height))
      if (opts?.quality) params.append('q', String(opts.quality))
      if (opts?.format) params.append('f', opts.format)
      if (opts?.fit) params.append('fit', opts.fit)

      return `${base}?${params.toString()}`
    } else {
      // Create Netlify URL with the correct parameter order
      const netlifyBase = 'https://gongeo.us/.netlify/images'
      // Start with width, height, format, quality, fit parameters first
      const netlifyParams = new URLSearchParams()

      if (opts?.width) netlifyParams.append('w', String(opts.width))
      if (opts?.height) netlifyParams.append('h', String(opts.height))
      if (opts?.format) netlifyParams.append('fm', opts.format)
      if (opts?.quality) netlifyParams.append('q', String(opts.quality))
      if (opts?.fit) netlifyParams.append('fit', opts.fit)

      // Add the url parameter last
      netlifyParams.append('url', `/${cleanPath}`)

      const netlifyUrl = `${netlifyBase}?${netlifyParams.toString()}`
      return `https://gongeous.cn/image-proxy/${encodeURIComponent(netlifyUrl)}`
    }
  }

  // Function to get a proxied URL for any image with the correct parameter order
  const getProxiedImageUrl = (originalUrl: string) => {
    return `https://gongeous.cn/image-proxy/${encodeURIComponent(originalUrl)}`
  }

  return {
    isChina,
    getImageUrl,
    getProxiedImageUrl,
  }
}
