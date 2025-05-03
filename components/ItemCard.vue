<template>
  <n-tooltip
    placement="top"
    :theme-overrides="{
      common: {
        borderRadius: '8px',
      },
      peers: {
        Popover: {
          color: '#ffffff',
          textColor: '#000000',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
        },
      },
    }"
  >
    <template #trigger>
      <n-card
        :class="[
          'item-card relative overflow-hidden rounded-md transition-all duration-300 ease-in-out aspect-square',
          'ring-1 hover:scale-[1.01]',
          item.rarity === 5
            ? 'rarity-5 ring-amber-200/30 hover:ring-amber-200/80'
            : 'rarity-4 ring-blue-200/30 hover:ring-blue-200/80',
          { 'opacity-60 grayscale': !item.obtained },
        ]"
        :bordered="false"
        size="small"
        content-style="padding: 0;"
        class="min-h-[60px] lg:min-h-[100px] aspect-square"
      >
        <nuxt-img
          :src="imageUrl"
          :alt="item.itemId"
          class="w-full h-full object-cover aspect-square"
          :provider="imageProvider"
          format="webp"
          width="200"
          height="200"
          fit="cover"
          quality="80"
          loading="lazy"
          sizes="(max-width: 200px) 100px, 200px"
        />
        <n-tag
          v-if="item.obtained"
          size="tiny"
          :bordered="false"
          class="absolute bottom-1 right-1 bg-black/40 text-white shadow-sm rounded-full text-xs opacity-80"
        >
          {{ item.pullsToObtain }}
        </n-tag>
        <n-tag
          v-if="item.obtained && item.duplicate"
          size="tiny"
          :bordered="false"
          class="absolute top-1 right-1 shadow-sm rounded-full text-xs"
          :class="[
            item.rarity === 5
              ? 'bg-amber-500/80 text-amber-50 opacity-80'
              : 'bg-blue-500/80 text-blue-50 opacity-80',
          ]"
        >
          ×2
        </n-tag>
      </n-card>
    </template>
    <template #default>
      <div class="text-center">
        <div class="font-medium">{{ t(item.itemName) }}</div>
        <div class="text-sm text-gray-400">
          {{ t(`items.types.${item.itemType}`) }}
        </div>
        <div
          v-if="item.obtained"
          class="text-sm mt-1 text-gray-600"
        >
          {{ t('common.pull', { number: item.pullIndex }) }}
        </div>
      </div>
    </template>
  </n-tooltip>
</template>

<script setup lang="ts">
  import type { PullItem } from '~/types/pull'

  interface Props {
    item: PullItem
  }

  const props = defineProps<Props>()
  const { t } = useI18n()

  const imageUrl = computed(() => {
    return `/images/items/${props.item.itemId}.webp`
  })

  const imageProvider = computed(() => {
    return process.env.NODE_ENV === 'development' ? 'ipx' : 'netlify'
  })
</script>

<style lang="scss" scoped>
  .rarity-4 {
    background: linear-gradient(to bottom right, #e3f2fd, #bbdefb);
    &:hover {
      @apply shadow-[0_0_15px_0_rgba(187,222,251,0.5)];
    }
  }

  .rarity-5 {
    background: linear-gradient(to bottom right, #fff8e1, #ffcc80);
    &:hover {
      @apply shadow-[0_0_15px_0_rgba(255,204,128,0.5)];
    }
  }

  .item-card {
    will-change: transform;
    backface-visibility: hidden;
    -webkit-font-smoothing: subpixel-antialiased;
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 6px;
      padding: 1px;
      background: linear-gradient(
        to bottom right,
        rgba(255, 255, 255, 0.4),
        rgba(255, 255, 255, 0.2)
      );
      -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s ease-in-out;
    }

    &:hover::before {
      opacity: 1;
    }
  }
</style>
