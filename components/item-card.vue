<template>
  <n-card
    :class="[
      'item-card relative overflow-hidden rounded-md',
      rarity === 5 ? 'rarity-5' : 'rarity-4',
      { 'opacity-60 grayscale': !obtained },
    ]"
    :bordered="false"
    size="small"
  >
    <n-image
      :src="imageUrl"
      class="aspect-square object-cover w-full h-full"
      lazy
      preview-disabled
    >
      <template #placeholder>
        <div class="flex items-center justify-center h-full">
          <n-spin size="small" />
        </div>
      </template>
    </n-image>
    <n-tag
      v-if="obtained"
      size="tiny"
      :bordered="false"
      class="absolute bottom-1 right-1 bg-black/40 text-white shadow-sm rounded-full text-xs opacity-80"
    >
      {{ pullsToObtain }}
    </n-tag>
    <n-tag
      v-if="obtained && duplicate"
      size="tiny"
      :bordered="false"
      class="absolute top-1 right-1 shadow-sm rounded-full text-xs"
      :class="[
        rarity === 5
          ? 'bg-amber-500/80 text-amber-50 opacity-80'
          : 'bg-blue-500/80 text-blue-50 opacity-80',
      ]"
    >
      ×2
    </n-tag>
  </n-card>
</template>

<script setup lang="ts">
  interface Props {
    itemId: string
    rarity: number
    obtained: boolean
    pullsToObtain?: number
    pullIndex?: number
    duplicate?: boolean
  }

  const props = defineProps<Props>()

  const imageUrl = computed(() => {
    try {
      return new URL(`/assets/images/${props.itemId}.webp`, import.meta.url)
        .href
    } catch (error) {
      console.warn(`Failed to load image for item ${props.itemId}:`, error)
      return '' // Return empty string if image not found
    }
  })
</script>

<style lang="scss" scoped>
  .item-card {
    transition: all 0.2s ease-in-out;
  }

  .item-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    z-index: 1;
  }

  .rarity-4 {
    background: linear-gradient(to bottom right, #e3f2fd, #bbdefb);
  }

  .rarity-5 {
    background: linear-gradient(to bottom right, #fff8e1, #ffcc80);
  }
</style>
