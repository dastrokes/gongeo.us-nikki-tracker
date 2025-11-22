<template>
  <n-carousel
    v-model:current-index="currentIndex"
    :show-arrow="false"
    show-dots
    trigger="hover"
    :space-between="20"
    loop
    effect="fade"
    draggable
    :transition-style="{
      transitionDuration: '1000ms',
      transitionTimingFunction: 'ease-in-out',
    }"
  >
    <template #dots="{ total, currentIndex: current, to }">
      <div class="flex absolute bottom-2 left-2 gap-2 p-1 rounded-full">
        <button
          v-for="i in total"
          :key="i"
          :class="[
            'w-2 h-2 rounded-full transition-all duration-300',
            current === i - 1
              ? 'bg-slate-50 scale-125'
              : 'bg-slate-400 hover:bg-slate-200',
          ]"
          @click="to(i - 1)"
        ></button>
      </div>
    </template>
    <n-carousel-item
      v-for="(banner, index) in banners"
      :key="banner.bannerId"
      class="rounded-xl aspect-[2/1]"
    >
      <NuxtLink
        no-prefetch
        :to="localePath(`/banner/${banner.bannerId}`)"
        class="hover:opacity-95 transition-opacity relative"
        ><ClientOnly>
          <n-tooltip
            overlap
            placement="top-end"
            class="!rounded-lg !m-2 p-1 text-xs cursor-pointer"
            :z-index="10"
            @click.stop.prevent="
              $router.push(localePath(`/banner/${banner.bannerId}`))
            "
          >
            <template #trigger>
              <div class="absolute inset-0"></div>
            </template>
            <span class="inline-flex items-center gap-2">
              {{ t('navigation.banner_detail') }}
              <n-icon><ExternalLinkAlt /></n-icon>
            </span>
          </n-tooltip>
          <n-tag
            round
            :bordered="false"
            size="small"
            class="absolute opacity-80 bottom-2 right-2 scale-90 sm:scale-100 origin-bottom-right"
          >
            {{ formattedTime }}
            <template #icon>
              <n-icon
                class="ml-1"
                size="12"
              >
                <HourglassHalf />
              </n-icon>
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

        <NuxtImg
          v-if="index === 0"
          :src="`/images/banners/${banner.bannerId}.webp`"
          :alt="t(`banner.${banner.bannerId}.name`)"
          class="w-full h-full object-cover"
          width="800"
          height="400"
          fit="cover"
          loading="eager"
          :preload="{ fetchPriority: 'high' }"
          fetchpriority="high"
          sizes="400px sm:800px"
        />
        <NuxtImg
          v-else
          :src="`/images/banners/${banner.bannerId}.webp`"
          :alt="t(`banner.${banner.bannerId}.name`)"
          class="w-full h-full object-cover"
          width="800"
          height="400"
          fit="cover"
          loading="lazy"
          sizes="400px sm:800px"
        />
      </NuxtLink>
    </n-carousel-item>
  </n-carousel>
</template>

<script setup lang="ts">
  import { HourglassHalf, ExternalLinkAlt } from '@vicons/fa'
  import type { Banner } from '~/types/banner'

  const { t } = useI18n()
  const localePath = useLocalePath()

  const props = defineProps<{
    banners: Banner[]
    formattedTime: string
    currentIndex: number
  }>()

  const emit = defineEmits<{
    (e: 'update:currentIndex', value: number): void
  }>()

  const currentIndex = computed({
    get: () => props.currentIndex,
    set: (value) => emit('update:currentIndex', value),
  })
</script>
