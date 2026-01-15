<template>
  <div :class="cardClasses">
    <div
      class="absolute inset-0 bg-[url('/bg.webp')] bg-cover bg-center bg-slate-100 dark:bg-slate-300"
    ></div>
    <!-- Tint overlay -->
    <div
      class="absolute inset-0"
      :class="overlayClass"
    ></div>
    <NuxtImg
      :src="imageSrc"
      :alt="name"
      class="absolute inset-0 w-full h-full object-cover z-10"
      :preset="imagePreset"
      :width="imageWidth"
      :height="imageHeight"
      fit="cover"
      loading="lazy"
      :sizes="imageSizes"
      format="webp"
    />

    <div
      v-if="showMeta"
      class="absolute z-20"
      :class="qualityTagPositionClass"
    >
      <n-tag
        round
        :size="qualityTagSize"
        :bordered="false"
        :type="qualityTagType"
        class="backdrop-blur-sm"
      >
        <span class="align-top">{{ quality }}</span>
        <span class="ml-0.5"
          ><n-icon><Star /></n-icon
        ></span>
      </n-tag>
    </div>

    <div
      v-if="showMeta"
      class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-20"
      :class="metaPaddingClass"
    >
      <p class="text-white font-semibold text-xs sm:text-sm line-clamp-2">
        {{ name }}
      </p>
      <div
        v-if="style"
        class="flex flex-wrap gap-1 mt-1"
      >
        <n-tag
          size="tiny"
          :bordered="false"
          type="default"
          class="!text-xs"
        >
          {{ style }}
        </n-tag>
      </div>
      <div
        v-if="labels.length"
        class="flex flex-wrap gap-0.5 mt-1"
      >
        <n-tag
          v-for="label in labels"
          :key="label"
          size="tiny"
          :bordered="false"
          type="default"
          class="!text-xs"
        >
          {{ label }}
        </n-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Star } from '@vicons/fa'

  const { getImageSrc } = imageProvider()

  const props = withDefaults(
    defineProps<{
      outfitId: number | string
      name: string
      quality: number
      style?: string | null
      labels?: string[]
      showMeta?: boolean
      size?: 'sm' | 'md' | 'lg'
    }>(),
    {
      style: null,
      labels: () => [],
      showMeta: true,
      size: 'md',
    }
  )

  const imageSrc = computed(() => getImageSrc('outfit', props.outfitId))

  const overlayClass = computed(() => {
    switch (props.quality) {
      case 5:
        return 'bg-yellow-500/5'
      case 4:
        return 'bg-blue-500/5'
      case 3:
        return 'bg-green-500/5'
      case 2:
        return 'bg-gray-500/5'
      default:
        return 'bg-gray-500/5'
    }
  })

  const qualityTagType = computed(() => {
    switch (props.quality) {
      case 5:
        return 'warning'
      case 4:
        return 'info'
      case 3:
        return 'success'
      case 2:
        return 'default'
      default:
        return 'default'
    }
  })

  const imagePreset = computed(() => {
    switch (props.size) {
      case 'sm':
        return 'tallSm'
      case 'lg':
        return 'tallLg'
      default:
        return 'tallMd'
    }
  })

  const imageWidth = computed(() => {
    switch (props.size) {
      case 'sm':
        return 100
      case 'lg':
        return 300
      default:
        return 200
    }
  })

  const imageHeight = computed(() => {
    switch (props.size) {
      case 'sm':
        return 150
      case 'lg':
        return 450
      default:
        return 300
    }
  })

  const imageSizes = computed(() => {
    switch (props.size) {
      case 'sm':
        return '100px'
      case 'lg':
        return '300px'
      default:
        return '200px sm:240px'
    }
  })

  const qualityTagSize = computed(() =>
    props.size === 'sm' ? 'tiny' : 'small'
  )

  const qualityTagPositionClass = computed(() =>
    props.size === 'sm' ? 'top-1 right-1' : 'top-2 right-2'
  )

  const metaPaddingClass = computed(() => (props.size === 'sm' ? 'p-2' : 'p-3'))

  const cardClasses = computed(() => [
    'relative aspect-[2/3] rounded-lg overflow-hidden shadow-md',
  ])
</script>
