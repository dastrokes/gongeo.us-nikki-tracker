import { computed } from 'vue'

export const useImageProvider = () => {
  const isChina = computed(() => {
    if (import.meta.client) {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      return timezone.startsWith('Asia/Shanghai')
    }
    return false
  })

  const imageProvider = computed(() => {
    return import.meta.dev ? 'ipx' : 'netlify'
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
      const base = 'https://static.gongeous.cn/image'
      const params = new URLSearchParams({ src: `/${cleanPath}` })

      if (opts?.width) params.append('w', String(opts.width))
      if (opts?.height) params.append('h', String(opts.height))
      if (opts?.quality) params.append('q', String(opts.quality))
      if (opts?.format) params.append('f', opts.format)
      if (opts?.fit) params.append('fit', opts.fit)

      return `${base}?${params.toString()}`
    }

    // For Netlify (non-China), let NuxtImg handle transforms
    return path
  }

  return {
    isChina,
    imageProvider,
    getImageUrl,
  }
}
