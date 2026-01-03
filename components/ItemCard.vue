<template>
  <NuxtLink
    no-prefetch
    :to="localePath(`/item/${item.itemId}`)"
    class="block hover:opacity-80 transition-opacity"
  >
    <n-tooltip placement="top">
      <template #trigger>
        <n-card
          :class="[
            getCardGradient(item.quality),
            { 'opacity-60 grayscale': item.count === 0 && info },
          ]"
          :bordered="false"
          size="small"
          content-class="p-0"
          class="relative overflow-hidden rounded-md transition-all duration-300 ease-in-out aspect-square ring-1 min-h-[50px] xl:min-h-[80px]"
        >
          <NuxtImg
            v-if="info"
            :src="`/images/items/icons/${item.itemId}.png`"
            :alt="t(`item.${item.itemId}.name`)"
            class="w-full h-full object-cover aspect-square"
            width="120"
            height="120"
            fit="cover"
            loading="lazy"
            sizes="80px sm:120px"
          />
          <NuxtImg
            v-else
            :src="`/images/items/icons/${item.itemId}.png`"
            :alt="t(`item.${item.itemId}.name`)"
            class="w-full h-full object-cover aspect-square"
            width="120"
            height="120"
            fit="cover"
            loading="lazy"
            placeholder="/images/loading.webp"
            sizes="80px sm:120px"
          />
          <n-tag
            v-if="item.count > 0 && info"
            size="tiny"
            :bordered="false"
            class="absolute bottom-1 right-1 scale-75 sm:scale-90 origin-bottom-right text-white shadow-sm rounded-full text-xs opacity-80"
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
            class="absolute top-1 right-1 scale-75 sm:scale-90 origin-top-right shadow-sm rounded-full text-xs"
            :class="[
              item.quality === 5
                ? 'bg-amber-500/80 text-amber-50 opacity-80'
                : 'bg-blue-500/80 text-blue-50 opacity-80',
            ]"
          >
            ×{{ item.count }}
          </n-tag>
        </n-card>
      </template>
      <template #default>
        <div class="text-center">
          <div class="font-medium">{{ t(`item.${item.itemId}.name`) }}</div>
          <div class="text-sm">
            {{ t(`items.types.${itemType}`) }}
          </div>
          <div
            v-if="item.count > 0"
            class="text-sm mt-1"
          >
            <span v-if="item.pullIndex > 0">
              {{ t('items.pull', { number: item.pullIndex }) }}
            </span>
          </div>
        </div>
      </template>
    </n-tooltip>
  </NuxtLink>
</template>

<script setup lang="ts">
  import type { PullItem } from '~/types/pull'
  import { Asterisk } from '@vicons/fa'

  interface Props {
    item: PullItem
    info?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    info: true,
  })

  const { t } = useI18n()
  const localePath = useLocalePath()
  const itemType = computed(() => getItemType(props.item.itemId))

  const CARD_GRADIENTS = {
    fiveStar:
      'bg-gradient-to-br from-[#fff8e1] to-[#ffcc80] hover:shadow-[0_0_10px_0_rgba(255,204,128,0.5)] ring-amber-200/30 hover:ring-amber-200/80 dark:from-[#713f12] dark:to-[#451a03] dark:hover:shadow-[0_0_10px_0_rgba(113,63,18,0.5)] dark:ring-amber-900/30 dark:hover:ring-amber-900/60',
    fourStar:
      'bg-gradient-to-br from-[#e3f2fd] to-[#bbdefb] hover:shadow-[0_0_10px_0_rgba(187,222,251,0.5)] ring-blue-200/30 hover:ring-blue-200/80 dark:from-[#334155] dark:to-[#1e293b] dark:hover:shadow-[0_0_10px_0_rgba(51,65,85,0.5)] dark:ring-slate-400/20 dark:hover:ring-slate-400/40',
  } as const

  const getCardGradient = (quality: number) =>
    quality === 5 ? CARD_GRADIENTS.fiveStar : CARD_GRADIENTS.fourStar

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
