<template>
  <div :class="cardClasses">
    <div
      class="absolute inset-0 bg-slate-100 bg-[url('/images/bg.webp')] bg-cover bg-center dark:bg-slate-300"
    ></div>
    <!-- Tint overlay -->
    <div
      class="absolute inset-0"
      :style="overlayClass"
    ></div>
    <NuxtImg
      :src="imageSrc"
      :alt="name"
      :class="imageClasses"
      :preset="imagePreset"
      fit="cover"
      :loading="loading"
      :fetchpriority="fetchpriority"
      :sizes="imageSizes"
    />

    <div
      v-if="showInfo && !isThumbnailListing && meta !== 'edit'"
      class="absolute z-20"
      :class="qualityTagPositionClass"
    >
      <n-tag
        round
        :size="qualityTagSize"
        :bordered="false"
        :color="getQualityTagTheme(quality)"
        class="backdrop-blur-xs"
      >
        <span class="flex items-center gap-1">
          {{ quality }}
          <n-icon>
            <Star />
          </n-icon>
        </span>
      </n-tag>
    </div>

    <div
      v-if="showInfo && isThumbnailListing"
      class="absolute inset-x-0 bottom-0 z-20 flex h-16 w-full flex-col justify-end bg-[url('/images/fade.png')] [background-size:100%_100%] bg-bottom bg-no-repeat px-1.5 pb-1"
      :class="thumbnailMetaPaddingClass"
    >
      <p
        class="line-clamp-2 w-full min-w-0 text-left text-[10px] leading-snug font-semibold text-white"
      >
        {{ name }}
      </p>
    </div>
    <div
      v-else-if="showInfo"
      class="absolute right-0 bottom-0 left-0 z-20 flex h-28 flex-col justify-end bg-[url('/images/fade.png')] [background-size:100%_100%] bg-no-repeat"
      :class="metaPaddingClass"
    >
      <p
        class="line-clamp-2 text-xs leading-snug font-semibold text-white sm:text-sm"
      >
        {{ name }}
      </p>
      <div
        v-if="showMetaTags && styleLabel"
        class="mt-1 hidden flex-wrap gap-1 sm:flex"
      >
        <n-tag
          size="tiny"
          :bordered="false"
          type="default"
          :color="styleTagTheme"
          class="text-xs font-semibold shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)]"
        >
          {{ styleLabel }}
        </n-tag>
      </div>
      <div
        v-if="showMetaTags && normalizedLabels.length"
        class="mt-1 hidden flex-wrap gap-0.5 sm:flex"
      >
        <n-tag
          v-for="label in normalizedLabels"
          :key="label.text"
          size="tiny"
          type="default"
          :color="label.theme"
          round
          class="text-xs font-semibold"
        >
          {{ label.text }}
        </n-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Star } from '@vicons/fa'

  type OutfitCardMeta = 'default' | 'status' | 'edit'

  const { t } = useI18n()
  const { getImageSrc } = imageProvider()

  const compendiumListingView = inject(compendiumListingViewKey, null)
  const isThumbnailListing = computed(
    () => compendiumListingView?.isThumbnailView.value ?? false
  )

  const props = withDefaults(
    defineProps<{
      outfitId: number | string
      name: string
      quality: number
      styleKey?: string | null
      labels?: Array<string | { text: string; theme?: Record<string, string> }>
      showInfo?: boolean
      size?: 'sm' | 'md' | 'lg'
      loading?: 'eager' | 'lazy'
      fetchpriority?: 'high' | 'low' | 'auto'
      meta?: OutfitCardMeta
    }>(),
    {
      styleKey: null,
      labels: () => [],
      showInfo: false,
      size: 'md',
      loading: 'lazy',
      fetchpriority: 'auto',
      meta: 'default',
    }
  )

  const imageSrc = computed(() => getImageSrc('outfit', props.outfitId))

  const overlayClass = computed(() => getQualityOverlayStyle(props.quality))

  const styleLabel = computed(() => {
    if (!props.styleKey) return null
    const definition = STYLE_BY_KEY.get(props.styleKey)
    return definition ? t(definition.i18nKey) : null
  })

  const styleTagTheme = computed(() => getStyleTagTheme(props.styleKey))

  const normalizedLabels = computed(() =>
    (props.labels || []).map((label) => {
      if (typeof label === 'string') {
        return {
          text: t(label),
          theme: getLabelTagTheme(label),
        }
      }
      return label
    })
  )

  const imagePreset = computed(() => {
    switch (props.size) {
      case 'sm':
        return 'tallSm'
      case 'lg':
        return 'tallLg'
      default:
        return 'tallLg'
    }
  })

  const imageSizes = computed(() => {
    switch (props.size) {
      case 'sm':
        return '100px'
      case 'lg':
        return '200px'
      default:
        return '200px'
    }
  })

  const qualityTagSize = computed(() => {
    if (isThumbnailListing.value) return 'tiny'
    return props.size === 'sm' ? 'tiny' : 'small'
  })

  const qualityTagPositionClass = computed(() => {
    if (isThumbnailListing.value) return 'top-0.5 right-0.5'
    return props.size === 'sm' ? 'top-1 right-1' : 'top-2 right-2'
  })

  const showMetaTags = computed(() => !isThumbnailListing.value)

  const metaPaddingClass = computed(() => [
    props.meta === 'edit' || props.size === 'sm' ? 'p-2' : 'p-3',
    'pr-8',
  ])
  const thumbnailMetaPaddingClass = 'pr-6'

  const cardClasses = computed(() => [
    'relative aspect-2/3 rounded-lg overflow-hidden shadow-md',
  ])

  const imageClasses = computed(() => [
    'absolute inset-0 w-full h-full object-cover z-10',
    props.showInfo
      ? 'transition-transform duration-500 ease-out hover:scale-110'
      : '',
  ])
</script>
