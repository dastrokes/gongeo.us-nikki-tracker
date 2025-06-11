<template>
  <n-tooltip placement="top">
    <template #trigger>
      <n-card
        :class="[
          'relative overflow-hidden rounded-md transition-all duration-300 ease-in-out aspect-square ring-1',
          ,
          item.rarity === 5
            ? isDark
              ? 'bg-gradient-to-br from-[#713f12] to-[#451a03] hover:shadow-[0_0_15px_0_rgba(113,63,18,0.5)] ring-amber-900/30 hover:ring-amber-900/60'
              : 'bg-gradient-to-br from-[#fff8e1] to-[#ffcc80] hover:shadow-[0_0_15px_0_rgba(255,204,128,0.5)] ring-amber-200/30 hover:ring-amber-200/80'
            : isDark
              ? 'bg-gradient-to-br from-[#334155] to-[#1e293b] hover:shadow-[0_0_15px_0_rgba(51,65,85,0.5)] ring-slate-400/20 hover:ring-slate-400/40'
              : 'bg-gradient-to-br from-[#e3f2fd] to-[#bbdefb] hover:shadow-[0_0_15px_0_rgba(187,222,251,0.5)] ring-blue-200/30 hover:ring-blue-200/80',
          { 'opacity-60 grayscale': item.count === 0 },
        ]"
        :bordered="false"
        size="small"
        content-style="padding: 0;"
        class="min-h-[60px] xl:min-h-[100px] aspect-square"
      >
        <DynamicImg
          :src="`/images/items/${item.itemId}.webp`"
          :alt="item.itemId"
          class="w-full h-full object-cover aspect-square"
          format="webp"
          width="120"
          height="120"
          fit="cover"
          :quality="100"
          loading="lazy"
          placeholder="/images/loading.webp"
          sizes="(max-width: 640px) 80px, 120px"
        />
        <n-tag
          v-if="item.count > 0 && item.pullsToObtain > 0"
          size="tiny"
          :bordered="false"
          class="absolute bottom-1 right-1 scale-75 sm:scale-90 origin-bottom-right bg-black/40 text-white shadow-sm rounded-full text-xs opacity-80"
        >
          {{ item.pullsToObtain }}
        </n-tag>
        <n-tag
          v-if="item.count > 1"
          size="tiny"
          :bordered="false"
          class="absolute top-1 right-1 scale-75 sm:scale-90 origin-top-right shadow-sm rounded-full text-xs"
          :class="[
            item.rarity === 5
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
          <n-text v-if="item.pullIndex > 0">
            {{ t('items.pull', { number: item.pullIndex }) }}
          </n-text>
        </div>
      </div>
    </template>
  </n-tooltip>
</template>

<script setup lang="ts">
  import type { PullItem } from '~/types/pull'
  import { useUserStore } from '~/stores/user'
  import { getItemType } from '~/utils/itemType'

  interface Props {
    item: PullItem
  }

  const props = defineProps<Props>()
  const { t } = useI18n()
  const userStore = useUserStore()
  const isDark = computed(() => userStore.getCurrentTheme === 'dark')

  const itemType = computed(() => getItemType(props.item.itemId))
</script>
