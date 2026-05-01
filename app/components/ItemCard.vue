<template>
  <NuxtLinkLocale
    :to="`/items/${itemId}`"
    class="group relative block transition-all duration-300 ease-out hover:z-10 hover:scale-[1.05]"
    @click="$emit('click', itemId)"
  >
    <n-card
      :class="[
        getCardGradient(quality),
        'relative aspect-square cursor-pointer overflow-hidden rounded-md ring-1 transition-all duration-300 ease-out',
        getSizeClass(size),
      ]"
      :bordered="false"
      size="small"
      content-class="p-2"
    >
      <NuxtImg
        :src="getImageSrc('itemIcon', itemId)"
        :alt="itemName"
        class="aspect-square h-full w-full object-cover"
        :style="imageStyle"
        :preset="getImagePreset(size)"
        fit="cover"
        loading="lazy"
        placeholder="/images/loading.webp"
        :sizes="getImageSizes(size)"
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
  }

  const props = withDefaults(defineProps<Props>(), {
    size: 'lg',
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
  const imageStyle = computed(() => getCardImageSeparationStyle(isDark.value))

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

  const getImagePreset = (size: 'sm' | 'lg') => {
    return size === 'sm' ? 'iconSm' : 'iconLg'
  }

  const getImageSizes = (size: 'sm' | 'lg') => {
    switch (size) {
      case 'sm':
        return '60px sm:80px'
      default:
        return '80px sm:120px'
    }
  }
</script>
