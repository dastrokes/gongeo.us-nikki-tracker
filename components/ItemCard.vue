<template>
  <div
    class="group relative block hover:scale-[1.05] hover:shadow-lg hover:z-10 transition-all duration-300 ease-out"
  >
    <n-card
      :class="[
        getCardGradient(quality),
        { 'cursor-pointer': clickable },
        'relative overflow-hidden rounded-md transition-all duration-300 ease-out aspect-square ring-1',
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
    clickable?: boolean
    size?: 'sm' | 'lg'
  }

  const props = withDefaults(defineProps<Props>(), {
    clickable: true,
    size: 'lg',
  })

  const emit = defineEmits<{
    click: [itemId: number]
  }>()

  const { t } = useI18n()
  const router = useRouter()
  const localePath = useLocalePath()
  const { getImageSrc } = imageProvider()

  // Get item name from i18n - names are stored in i18n JSON files, not in the database
  const itemName = computed(() => {
    if (props.name) return props.name
    return t(`item.${props.itemId}.name`)
  })

  // Get item type - use prop if available, otherwise derive from ID
  const itemType = computed(() => props.type || getItemType(props.itemId))

  // Quality-based gradient styling
  const CARD_GRADIENTS = {
    fiveStar:
      'bg-gradient-to-br from-[#fff8e1] to-[#ffcc80] hover:shadow-[0_0_10px_0_rgba(255,204,128,0.5)] ring-amber-200/30 hover:ring-amber-200/80 dark:from-[#713f12] dark:to-[#451a03] dark:hover:shadow-[0_0_10px_0_rgba(113,63,18,0.5)] dark:ring-amber-900/30 dark:hover:ring-amber-900/60',
    fourStar:
      'bg-gradient-to-br from-[#e3f2fd] to-[#bbdefb] hover:shadow-[0_0_10px_0_rgba(187,222,251,0.5)] ring-blue-200/30 hover:ring-blue-200/80 dark:from-[#334155] dark:to-[#1e293b] dark:hover:shadow-[0_0_10px_0_rgba(51,65,85,0.5)] dark:ring-slate-400/20 dark:hover:ring-slate-400/40',
    threeStar:
      'bg-gradient-to-br from-[#e0f2f1] to-[#80cbc4] hover:shadow-[0_0_10px_0_rgba(128,203,196,0.5)] ring-teal-200/30 hover:ring-teal-200/80 dark:from-[#134e4a] dark:to-[#0f766e] dark:hover:shadow-[0_0_10px_0_rgba(19,78,74,0.5)] dark:ring-teal-900/30 dark:hover:ring-teal-900/60',
  } as const

  const getCardGradient = (quality: number) => {
    if (quality === 5) return CARD_GRADIENTS.fiveStar
    if (quality === 4) return CARD_GRADIENTS.fourStar
    return CARD_GRADIENTS.threeStar
  }

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
    if (props.clickable) {
      emit('click', props.itemId)

      const path = localePath(`/items/${props.itemId}`)

      router.push(path)
    }
  }
</script>
