<template>
  <NuxtLinkLocale
    no-prefetch
    :to="`/items/${item.itemId}`"
    class="group relative block hover:scale-[1.05] hover:z-10 transition-all duration-300 ease-out"
  >
    <n-card
      :class="[
        getCardGradient(item.quality),
        { 'opacity-60 grayscale': item.count === 0 && info },
      ]"
      :bordered="false"
      size="small"
      content-class="p-2"
      class="relative overflow-hidden rounded-md transition-all duration-300 ease-in-out aspect-square ring-1 min-h-[50px] xl:min-h-[80px]"
    >
      <NuxtImg
        v-if="info"
        :src="getImageSrc('itemIcon', item.itemId)"
        :alt="$t(`item.${item.itemId}.name`)"
        class="w-full h-full object-cover aspect-square"
        :style="imageStyle"
        preset="iconLg"
        fit="cover"
        loading="lazy"
        sizes="80px sm:120px"
      />
      <NuxtImg
        v-else
        :src="getImageSrc('itemIcon', item.itemId)"
        :alt="$t(`item.${item.itemId}.name`)"
        class="w-full h-full object-cover aspect-square"
        :style="imageStyle"
        preset="iconLg"
        fit="cover"
        loading="lazy"
        placeholder="/images/loading.webp"
        sizes="80px sm:120px"
      />
      <n-tag
        v-if="item.count > 0 && info"
        size="tiny"
        :bordered="false"
        class="absolute bottom-1 right-1 scale-75 sm:scale-90 origin-bottom-right text-white shadow-xs rounded-full text-xs opacity-80"
        :style="{
          backgroundColor: getPullColor(
            item.pullsToObtain,
            item.quality,
            item.bannerId
          ),
        }"
      >
        <span v-if="item.count > 0 && item.pullsToObtain > 0">
          {{ item.pullsToObtain }}
        </span>
        <n-icon
          v-else
          class="flex items-center justify-center"
          size="8"
        >
          <Asterisk />
        </n-icon>
      </n-tag>
      <n-tag
        v-if="item.count > 1 && info"
        size="tiny"
        :bordered="false"
        class="absolute top-1 right-1 scale-75 sm:scale-90 origin-top-right shadow-xs rounded-full text-xs"
        :style="{
          backgroundColor: `${getQualityColor(item.quality)}CC`, // 80% opacity
        }"
      >
        ×{{ item.count }}
      </n-tag>
    </n-card>
    <div
      class="pointer-events-none absolute inset-x-0 bottom-full z-20 mb-2 flex justify-center opacity-0 translate-y-2 scale-90 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:scale-100"
    >
      <div
        :style="popoverStyle"
        class="relative min-h-[48px] w-32 sm:w-36 rounded-xl p-2 text-center ring-1 ring-black/5 backdrop-blur-md dark:ring-white/10"
      >
        <div class="font-bold leading-tight line-clamp-2 text-xs">
          {{ $t(`item.${item.itemId}.name`) }}
        </div>
        <div class="mt-0.5 text-[10px] sm:text-xs font-medium opacity-80">
          {{ $t(`type.${itemType}`) }}
        </div>
        <div
          v-if="item.count > 0"
          class="mt-0.5 text-[10px] sm:text-xs font-medium opacity-80"
        >
          <span v-if="item.pullIndex > 0">
            {{ $t('tracker.items.pull', { number: item.pullIndex }) }}
          </span>
        </div>
      </div>
    </div>
  </NuxtLinkLocale>
</template>

<script setup lang="ts">
  import { Asterisk } from '@vicons/fa'

  interface Props {
    item: PullItem
    info?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    info: true,
  })

  const { isDark } = useTheme()
  const palette = usePalette()
  const themeVars = useThemeVars()

  const popoverStyle = computed(() => ({
    backgroundColor: isDark.value ? palette.dark : palette.light,
    color: isDark.value ? palette.textDark : palette.textLight,
    boxShadow: themeVars.value.boxShadow2,
  }))
  const imageStyle = computed(() => getCardImageSeparationStyle(isDark.value))

  const itemType = computed(() => getItemType(props.item.itemId))
  const { getImageSrc } = imageProvider()

  const getCardGradient = (quality: number) => getQualityGradient(quality)

  // Color coding function for pulls with 3 categories
  const getPullColor = (pulls: number, quality: number, bannerId: number) => {
    const bannerType = getBannerType(bannerId)
    const baseOpacity = 0.5

    if (quality === 5) {
      // 5-star items
      if (pulls <= 0) return `rgba(156, 163, 175, ${baseOpacity})` // gray-400 - Default
      if (pulls <= 10) return `rgba(34, 197, 94, ${baseOpacity})` // green-500 - Good
      if (pulls <= 17) return `rgba(234, 179, 8, ${baseOpacity})` // yellow-500 - Average
      return `rgba(239, 68, 68, ${baseOpacity})` // red-500 - Bad
    } else if (quality === 4) {
      if (bannerType === 2) {
        // 4-star type 2 items
        if (pulls <= 0) return `rgba(156, 163, 175, ${baseOpacity})` // gray-400 - Default
        if (pulls <= 6) return `rgba(34, 197, 94, ${baseOpacity})` // green-500 - Good
        if (pulls <= 9) return `rgba(234, 179, 8, ${baseOpacity})` // yellow-500 - Average
        return `rgba(239, 68, 68, ${baseOpacity})` // red-500 - Bad
      } else {
        // 4-star type 3 items
        if (pulls <= 0) return `rgba(156, 163, 175, ${baseOpacity})` // gray-400 - Default
        if (pulls <= 3) return `rgba(34, 197, 94, ${baseOpacity})` // green-500 - Good
        if (pulls <= 4) return `rgba(234, 179, 8, ${baseOpacity})` // yellow-500 - Average
        return `rgba(239, 68, 68, ${baseOpacity})` // red-500 - Bad
      }
    }

    // Default case
    return `rgba(156, 163, 175, ${baseOpacity})` // gray-400
  }
</script>
