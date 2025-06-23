<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useImageProvider } from '~/composables/useImageProvider'

  const showCdnImage = ref(true)

  const { imageProvider, getImageUrl } = useImageProvider()

  defineProps<Props>()
  interface Props {
    src: string
    alt: string
    className?: string
    width?: number | string
    height?: number | string
    loading?: 'lazy' | 'eager'
    preload?: boolean
    format?: 'webp' | 'jpeg' | 'png'
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
    quality?: number
    sizes?: string
  }

  onMounted(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (timezone.startsWith('Asia/Shanghai')) {
      showCdnImage.value = true
    } else {
      showCdnImage.value = false
    }
  })

  function fallback(e: Event) {
    const img = e.target as HTMLImageElement
    // Avoid infinite fallback
    if (img.dataset.fallback === 'true') {
      return
    }

    try {
      const url = new URL(img.src)

      // Only handle fallback for static.gongeo.us URLs
      if (!url.hostname.includes('static.gongeo.us')) {
        return
      }

      // Get parameters from the current URL
      const params = new URLSearchParams(url.search)
      const originalPath = params.get('src') || ''
      const width = params.get('w') || ''
      const height = params.get('h') || ''
      const quality = params.get('q') || '100'
      const format = params.get('f') || 'webp'
      const fit = params.get('fit') || 'cover'

      const newSrc = `/_ipx/f_${format}&q_${quality}&fit_${fit}&s_${width}x${height}${originalPath}`

      img.src = newSrc
      img.dataset.fallback = 'true'
    } catch {
      // Ignore if parsing fails
    }
  }
</script>

<template>
  <img
    v-if="showCdnImage"
    :src="getImageUrl(src, { width, height, quality, format, fit })"
    :alt="alt"
    :class="className"
    :width="width"
    :height="height"
    :loading="loading"
    @error="fallback"
  />
  <NuxtImg
    v-else
    :src="getImageUrl(src)"
    :alt="alt"
    :class="className"
    :provider="imageProvider"
    :format="format"
    :width="width"
    :height="height"
    :fit="fit"
    :quality="quality"
    :loading="loading"
    :preload="preload"
    :sizes="sizes"
  />
</template>
