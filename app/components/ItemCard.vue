<template>
  <NuxtLinkLocale
    :to="cardLocation"
    class="group relative block transition-all duration-300 ease-out hover:z-10 hover:scale-[1.05]"
    @click="$emit('click', itemId)"
  >
    <n-card
      :class="[getCardGradient(quality), cardFrameClass, getSizeClass(size)]"
      :bordered="false"
      size="small"
      :content-class="cardContentClass"
    >
      <NuxtImg
        :src="cardImageSrc"
        :alt="itemName"
        :class="cardImageClass"
        :style="imageStyle"
        :preset="imagePreset"
        fit="cover"
        loading="lazy"
        placeholder="/images/loading.webp"
        :sizes="imageSizes"
      />
    </n-card>
    <div
      class="pointer-events-none absolute inset-x-0 bottom-full z-20 mb-2 flex translate-y-2 scale-90 justify-center opacity-0 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-focus-within:translate-y-0 group-focus-within:scale-100 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100"
    >
      <div
        :style="popoverStyle"
        class="relative min-h-12 w-32 rounded-xl p-2 text-center ring-1 ring-black/5 backdrop-blur-md sm:w-36 dark:ring-white/10"
      >
        <div class="line-clamp-2 text-xs leading-tight font-bold">
          {{ itemName }}
        </div>
        <div class="mt-0.5 text-[10px] font-medium opacity-80 sm:text-xs">
          {{ $t(`type.${itemType}`) }}
        </div>
      </div>
    </div>
  </NuxtLinkLocale>
</template>

<script setup lang="ts">
  interface Props {
    itemId: number
    quality: number
    type: string
    name: string
    size?: 'sm' | 'lg'
    to?: string
    imageMode?: 'icon' | 'preview'
  }

  const props = withDefaults(defineProps<Props>(), {
    size: 'lg',
    to: undefined,
    imageMode: 'icon',
  })

  defineEmits<{
    click: [itemId: number]
  }>()

  const { t } = useI18n()
  const { getImageSrc } = imageProvider()
  const { isDark } = useTheme()
  const palette = usePalette()
  const themeVars = useThemeVars()

  const popoverStyle = computed(() => ({
    backgroundColor: isDark.value ? palette.dark : palette.light,
    color: isDark.value ? palette.textDark : palette.textLight,
    boxShadow: themeVars.value.boxShadow2,
  }))
  const isPreviewImage = computed(() => props.imageMode === 'preview')
  const imageStyle = computed(() =>
    isPreviewImage.value ? undefined : getCardImageSeparationStyle(isDark.value)
  )
  const cardLocation = computed(
    () => props.to ?? getItemEntityDetailPath(props.itemId)
  )
  const cardImageSrc = computed(() =>
    getImageSrc(isPreviewImage.value ? 'item' : 'itemIcon', props.itemId)
  )
  const cardFrameClass = computed(() => [
    'relative cursor-pointer overflow-hidden rounded-md ring-1 transition-all duration-300 ease-out',
    isPreviewImage.value
      ? "aspect-2/3 bg-[url('/images/bg.webp')] bg-cover bg-center shadow-sm"
      : 'aspect-square',
  ])
  const cardContentClass = computed(() =>
    isPreviewImage.value ? 'p-0' : 'p-2'
  )
  const cardImageClass = computed(() =>
    isPreviewImage.value
      ? 'aspect-2/3 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105'
      : 'aspect-square h-full w-full object-cover'
  )
  const imagePreset = computed(() => {
    if (isPreviewImage.value) return 'tallLg'
    return props.size === 'sm' ? 'iconSm' : 'iconLg'
  })
  const imageSizes = computed(() => {
    if (isPreviewImage.value) {
      return props.size === 'sm' ? '64px sm:80px' : '80px sm:120px'
    }

    return props.size === 'sm' ? '60px sm:80px' : '80px sm:120px'
  })

  // Get item name from i18n
  const itemName = computed(() => {
    if (props.name) return props.name
    return t(`item.${props.itemId}.name`)
  })

  // Get item type - use prop if available, otherwise derive from ID
  const itemType = computed(() => props.type || getItemType(props.itemId))

  const getCardGradient = (quality: number) => getQualityGradient(quality)

  // Size-based styling
  const getSizeClass = (size: 'sm' | 'lg') => {
    switch (size) {
      case 'sm':
        return 'min-h-15 xl:min-h-20'
      case 'lg':
        return 'min-h-20 xl:min-h-30'
      default:
        return 'min-h-20 xl:min-h-30'
    }
  }
</script>
