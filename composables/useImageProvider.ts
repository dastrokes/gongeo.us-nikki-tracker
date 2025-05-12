import { computed } from 'vue'

export const useImageProvider = () => {
  const config = useRuntimeConfig()

  const imageProvider = computed(() => {
    return config.public.siteUrl?.includes('gongeo.us') ||
      config.public.siteUrl?.includes('netlify')
      ? 'netlify'
      : 'ipx'
  })

  return {
    imageProvider,
  }
}
