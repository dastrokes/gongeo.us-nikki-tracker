<template>
  <n-carousel
    v-model:current-index="currentIndex"
    class="rounded-xl"
    dot-type="line"
    :show-arrow="false"
    :show-dots="true"
    trigger="hover"
    :loop="true"
    :transition-style="{
      transitionDuration: '1000ms',
      transitionTimingFunction: 'ease-in-out',
    }"
  >
    <n-carousel-item
      v-for="banner in banners"
      :key="banner.bannerId"
      class="rounded-xl aspect-[2/1]"
      ><ClientOnly>
        <n-tag
          round
          :bordered="false"
          size="small"
          class="absolute opacity-80 top-2 right-2 scale-90 sm:scale-100 origin-top-right"
        >
          {{ $t('index.time_left') }} {{ formattedTime }}

          <template #icon>
            <n-icon
              size="12"
              :component="HourglassHalf"
            />
          </template>
        </n-tag>
        <n-tag
          v-if="banner.runs.length > 1"
          round
          :bordered="false"
          size="small"
          class="absolute opacity-80 top-2 left-2 scale-90 sm:scale-100 origin-top-left"
        >
          {{ $t('index.rerun') }}
        </n-tag></ClientOnly
      >
      <DynamicImg
        :src="`/images/banners/${banner.bannerId}.webp`"
        :alt="banner.bannerId.toString()"
        class="w-full h-full object-cover"
        format="webp"
        width="600"
        height="300"
        fit="cover"
        :quality="100"
        loading="lazy"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
      />
    </n-carousel-item>
  </n-carousel>
</template>

<script setup lang="ts">
  import { HourglassHalf } from '@vicons/fa'
  import type { Banner } from '~/types/banner'

  const props = defineProps<{
    banners: Banner[]
    formattedTime: string
  }>()

  const emit = defineEmits<{
    (e: 'update:currentIndex', value: number): void
  }>()

  const currentIndex = computed({
    get: () => props.currentIndex,
    set: (value) => emit('update:currentIndex', value),
  })
</script>
