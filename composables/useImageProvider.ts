import { computed } from 'vue'

export const useImageProvider = () => {
  const isChina = computed(() => {
    if (import.meta.client) {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      return timezone.startsWith('Asia/Shanghai')
    }
    return false
  })

  const imageProvider = computed(() =>
    process.env.NODE_ENV === 'development' ? 'ipx' : 'netlify'
  )

  const getImageUrl = (path: string) => {
    if (isChina.value) {
      // Use custom CDN for Chinese users
      const cleanPath = path.startsWith('/') ? path.slice(1) : path
      return `https://static.gongeo.us/${cleanPath}`
    }
    // For non-Chinese users, return the path as is for Netlify to handle
    return path
  }

  return {
    isChina,
    imageProvider,
    getImageUrl,
  }
}
