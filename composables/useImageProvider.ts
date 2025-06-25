import { computed } from 'vue'

export const useImageProvider = () => {
  const imageProvider = computed(() => {
    return import.meta.dev ? 'ipx' : 'netlify'
  })

  return {
    imageProvider,
  }
}
