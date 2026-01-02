<template>
  <n-tooltip placement="top">
    <template #trigger>
      <n-card
        :class="[
          getCardGradient(quality),
          { 'cursor-pointer': clickable },
          'relative overflow-hidden rounded-md transition-all duration-300 ease-out aspect-square ring-1',
          'hover:scale-[1.05] hover:shadow-lg hover:z-10',
          getSizeClass(size),
        ]"
        :bordered="false"
        size="small"
        content-style="padding: 0;"
        @click="handleClick"
      >
        <NuxtImg
          :src="`/images/items/icons/${itemId}.png`"
          :alt="itemName"
          class="w-full h-full object-cover aspect-square"
          :width="getImageSize(size)"
          :height="getImageSize(size)"
          fit="cover"
          loading="lazy"
          placeholder="/images/loading.webp"
          :sizes="getImageSizes(size)"
          @error="handleImageError"
        />
      </n-card>
    </template>
    <template #default>
      <div class="text-center">
        <div class="font-medium">{{ itemName }}</div>
        <div class="text-sm opacity-80">
          {{ t(`items.types.${itemType}`) }}
        </div>
      </div>
    </template>
  </n-tooltip>
</template>

<script setup lang="ts">
  interface Props {
    itemId: number
    quality: number
    type: string
    name: string
    clickable?: boolean
    size?: 'small' | 'medium' | 'large'
  }

  const props = withDefaults(defineProps<Props>(), {
    clickable: true,
    size: 'medium',
  })

  const emit = defineEmits<{
    click: [itemId: number]
  }>()

  const { t } = useI18n()
  const router = useRouter()

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
  const getSizeClass = (size: 'small' | 'medium' | 'large') => {
    switch (size) {
      case 'small':
        return 'min-h-[50px] xl:min-h-[60px]'
      case 'medium':
        return 'min-h-[60px] xl:min-h-[80px]'
      case 'large':
        return 'min-h-[80px] xl:min-h-[120px]'
      default:
        return 'min-h-[60px] xl:min-h-[80px]'
    }
  }

  const getImageSize = (size: 'small' | 'medium' | 'large') => {
    switch (size) {
      case 'small':
        return 60
      case 'medium':
        return 120
      case 'large':
        return 180
      default:
        return 120
    }
  }

  const getImageSizes = (size: 'small' | 'medium' | 'large') => {
    switch (size) {
      case 'small':
        return '60px sm:80px'
      case 'medium':
        return '80px sm:120px'
      case 'large':
        return '120px sm:180px'
      default:
        return '80px sm:120px'
    }
  }

  // Click handler
  const handleClick = () => {
    if (props.clickable) {
      emit('click', props.itemId)
      router.push(`/item/${props.itemId}`)
    }
  }

  // Image error handler
  const handleImageError = (event: string | Event) => {
    if (typeof event === 'string') return
    const img = event.target as HTMLImageElement
    img.src = '/images/loading.webp'
  }
</script>
