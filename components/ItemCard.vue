<template>
  <div
    class="relative block transition-all duration-300 ease-out group hover:scale-[1.05] hover:z-10"
  >
    <n-card
      :class="[
        getCardGradient(quality),
        'relative overflow-hidden rounded-md transition-all duration-300 ease-out aspect-square ring-1 cursor-pointer',
        getSizeClass(size),
      ]"
      :bordered="false"
      size="small"
      content-class="p-0"
      @click="handleClick"
    >
      <NuxtImg
        :src="getImageSrc('itemIcon', itemId)"
        :alt="itemName"
        class="w-full h-full object-cover aspect-square"
        :preset="getImagePreset(size)"
        :width="getImageWidth(size)"
        :height="getImageWidth(size)"
        fit="cover"
        loading="lazy"
        placeholder="/loading.webp"
        :sizes="getImageSizes(size)"
      />
    </n-card>
    <div
      class="pointer-events-none absolute inset-x-0 bottom-full z-20 mb-2 flex justify-center opacity-0 translate-y-2 scale-90 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:scale-100"
    >
      <div
        class="relative min-h-[48px] w-32 sm:w-36 rounded-xl bg-white/95 p-2 text-center shadow-lg ring-1 ring-black/5 backdrop-blur-md dark:bg-gray-800/95 dark:ring-white/10"
      >
        <div
          class="font-bold leading-tight line-clamp-2 text-xs text-gray-700 dark:text-gray-100"
        >
          {{ itemName }}
        </div>
        <div
          class="mt-0.5 text-[10px] sm:text-xs font-medium opacity-80 text-gray-500 dark:text-gray-300"
        >
          {{ t(`type.${itemType}`) }}
        </div>
      </div>
    </div>
  </div>
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

  const emit = defineEmits<{
    click: [itemId: number]
  }>()

  const { t } = useI18n()
  const localePath = useLocalePath()
  const { getImageSrc } = imageProvider()

  // Get item name from i18n - names are stored in i18n JSON files, not in the database
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
        return 'min-h-[50px] xl:min-h-[60px]'
      case 'lg':
        return 'min-h-[80px] xl:min-h-[120px]'
      default:
        return 'min-h-[80px] xl:min-h-[120px]'
    }
  }

  const getImageWidth = (size: 'sm' | 'lg') => {
    switch (size) {
      case 'sm':
        return 60
      case 'lg':
        return 120
      default:
        return 120
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

  // Click handler
  const handleClick = () => {
    emit('click', props.itemId)
    const path = localePath(`/items/${props.itemId}`)
    navigateTo(path)
  }
</script>
