import { computed } from 'vue'

export const useImageProvider = () => {
  const imageProvider = computed(() => {
    return process.env.NODE_ENV === 'development' ? 'ipx' : 'netlify'
  })

  return {
    imageProvider,
  }
}
