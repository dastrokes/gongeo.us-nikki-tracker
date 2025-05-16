<script setup lang="ts">
  import { useImageProvider } from '~/composables/useImageProvider'
  const { isChina, imageProvider, getImageUrl } = useImageProvider()

  interface Props {
    src: string
    alt: string
    className?: string
    width?: number | string
    height?: number | string
    loading?: 'lazy' | 'eager'
    format?: string
    fit?: string
    quality?: number
    sizes?: string
  }

  defineProps<Props>()
</script>

<template>
  <template v-if="isChina">
    <img
      :src="src"
      :alt="alt"
      :class="className"
      :width="width"
      :height="height"
      :loading="loading"
    />
  </template>
  <NuxtImg
    v-else
    :src="src"
    :alt="alt"
    :class="className"
    :provider="imageProvider"
    :format="format"
    :width="width"
    :height="height"
    :fit="fit"
    :quality="quality"
    :loading="loading"
    :sizes="sizes"
  />
</template>
