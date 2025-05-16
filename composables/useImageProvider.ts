import { computed } from 'vue'

export const useImageProvider = () => {
  const isChina = computed(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    return timezone.startsWith('Asia/Shanghai')
  })

  const imageProvider = computed(() =>
    process.env.NODE_ENV === 'development'
      ? 'ipx'
      : isChina.value
        ? 'ipx'
        : 'netlify'
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
