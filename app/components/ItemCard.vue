<template>
  <div>
    <n-popover
      trigger="manual"
      placement="top"
      :show="popoverOpen"
      :show-arrow="false"
      :flip="true"
      :z-index="100"
      :theme-overrides="popoverThemeOverrides"
      to="body"
    >
      <template #trigger>
        <NuxtLinkLocale
          :to="cardLocation"
          class="group relative block rounded-md transition-all duration-300 ease-out hover:z-10 hover:scale-[1.05] focus-visible:ring-2 focus-visible:ring-rose-500/70 focus-visible:ring-offset-2 focus-visible:outline-hidden dark:focus-visible:ring-offset-slate-950"
          @click="$emit('click', itemId)"
          @mouseenter="popoverOpen = true"
          @mouseleave="popoverOpen = false"
          @focus="popoverOpen = true"
          @blur="popoverOpen = false"
        >
          <n-card
            :class="[
              getCardGradient(quality),
              cardFrameClass,
              getSizeClass(size),
            ]"
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
        </NuxtLinkLocale>
      </template>

      <div
        class="pointer-events-none"
        :class="$slots.tooltip ? '' : 'w-36 text-center'"
      >
        <slot name="tooltip">
          <div class="line-clamp-2 text-xs leading-tight font-bold">
            {{ itemName }}
          </div>
          <div class="mt-0.5 text-[10px] font-medium opacity-80 sm:text-xs">
            {{ $t(`type.${itemType}`) }}
          </div>
          <div
            v-if="tooltipMeta"
            class="mt-0.5 text-[10px] font-medium opacity-80 sm:text-xs"
          >
            {{ tooltipMeta }}
          </div>
        </slot>
      </div>
    </n-popover>
  </div>
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
    tooltipMeta?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    size: 'lg',
    to: undefined,
    imageMode: 'icon',
    tooltipMeta: undefined,
  })

  defineEmits<{
    click: [itemId: number]
  }>()

  const { t } = useI18n()
  const { getImageSrc } = imageProvider()
  const { isDark } = useTheme()
  const palette = usePalette()
  const themeVars = useThemeVars()
  const popoverOpen = ref(false)

  const popoverThemeOverrides = computed(() => ({
    borderRadius: '12px',
    color: isDark.value ? palette.dark : palette.light,
    textColor: isDark.value ? palette.textDark : palette.textLight,
    boxShadow: themeVars.value.boxShadow2,
    padding: '8px',
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
