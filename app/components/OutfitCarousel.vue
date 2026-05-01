<template>
  <div class="space-y-3">
    <div class="flex items-center gap-2">
      <NuxtLinkLocale
        no-prefetch
        :to="`/outfits/${outfitId}`"
        class="cursor-pointer transition-opacity hover:opacity-80"
      >
        <n-tag
          :color="getQualityTextTheme(quality)"
          :bordered="false"
          round
          class="cursor-pointer"
        >
          <span class="flex items-center gap-1">
            {{ $t(`outfit.${outfitId}.name`) }} {{ quality }}
            <n-icon>
              <Star />
            </n-icon>
          </span>
        </n-tag>
      </NuxtLinkLocale>
    </div>

    <!-- Outfit Images Carousel with Items Grid -->
    <div class="flex flex-col gap-4 lg:flex-row">
      <!-- Carousel Container -->
      <div class="w-full shrink-0 lg:w-auto">
        <n-carousel
          :ref="`carousel${quality}Star`"
          v-model:current-index="activeSlide"
          effect="card"
          show-dots
          dot-placement="left"
          :centered-slides="false"
          :slides-per-view="2"
          draggable
          class="aspect-4/3 w-full rounded-lg sm:w-100"
        >
          <n-carousel-item
            v-for="(image, index) in outfitImages"
            :key="index"
          >
            <NuxtLinkLocale
              no-prefetch
              :to="`/outfits/${image.outfitId}`"
              class="group relative block aspect-2/3 cursor-pointer overflow-hidden rounded-lg transition-all duration-300 ease-in-out"
            >
              <div
                class="absolute inset-0 bg-slate-100 bg-[url('/images/bg.webp')] bg-cover bg-center dark:bg-slate-300"
              ></div>
              <!-- Tint overlay -->
              <div
                class="absolute inset-0"
                :style="getQualityOverlayStyle(quality)"
              ></div>
              <NuxtImg
                :src="image.src"
                :alt="image.alt"
                class="absolute inset-0 z-10 h-full w-full object-cover"
                preset="tallLg"
                fit="cover"
                loading="lazy"
                sizes="200px"
              />
              <div
                class="pointer-events-none absolute inset-0 z-30 flex items-center px-6 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                :class="
                  index === activeSlide ? 'justify-center' : 'justify-between'
                "
              >
                <template v-if="index === activeSlide">
                  <span
                    class="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-black/40 text-white opacity-50 shadow-sm"
                  >
                    <n-icon size="16"><ExternalLinkAlt /></n-icon>
                  </span>
                </template>
                <template v-else>
                  <span
                    class="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white shadow-sm"
                  >
                    <n-icon size="16"><ChevronLeft /></n-icon>
                  </span>
                  <span
                    class="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white shadow-sm"
                  >
                    <n-icon size="16"><ChevronRight /></n-icon>
                  </span>
                </template>
              </div>
              <div
                class="absolute top-1 z-20 scale-90 sm:scale-100"
                :class="[
                  image.level === 'glow'
                    ? 'left-1 origin-top-left'
                    : 'right-1 origin-top-right',
                ]"
              >
                <n-tag
                  round
                  size="small"
                  :bordered="false"
                  :color="getQualityTagTheme(quality)"
                  ><span class="flex items-center gap-1">
                    {{
                      t(
                        `banner.outfit.level.${image.level === 0 ? '1' : image.level}`
                      )
                    }}
                    <n-icon
                      v-if="completionLevels.includes(image.level.toString())"
                      ><CheckCircle /></n-icon
                  ></span>
                </n-tag>
              </div>
            </NuxtLinkLocale>
          </n-carousel-item>
        </n-carousel>
      </div>

      <!-- Outfit Items Grid -->
      <div class="min-w-0 flex-1">
        <div class="grid grid-cols-5 gap-2">
          <ItemCard
            v-for="item in outfitItems"
            :key="item.itemId"
            :item-id="Number(item.itemId)"
            :quality="item.quality"
            :type="getItemType(Number(item.itemId))"
            :name="t(`item.${item.itemId}.name`)"
            size="sm"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import {
    Star,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    ExternalLinkAlt,
  } from '@vicons/fa'
  import OUTFIT_DATA, { type OutfitKey } from '~~/data/outfits'

  interface Props {
    outfitId: string
    quality: number
    bannerId: number
    completionLevels: string[]
  }

  const props = defineProps<Props>()
  const { t } = useI18n()
  const { getImageSrc } = imageProvider()

  const activeSlide = ref(0)

  // Helper function to get outfit images for carousel
  const outfitImages = computed(() => {
    const images = []
    images.push({
      src: getImageSrc('outfit', props.outfitId),
      alt: `${t(`outfit.${props.outfitId}.name`)}`,
      level: 0,
      outfitId: props.outfitId,
    })

    // Add level variants based on quality
    const maxLevel = props.quality === 5 ? 4 : 2
    for (let i = 2; i <= maxLevel; i++) {
      const levelNum = i.toString().padStart(2, '0')
      const evoOutfitId = `${props.outfitId}${levelNum}`
      images.push({
        src: getImageSrc('outfit', evoOutfitId),
        alt: `${t(`outfit.${props.outfitId}.name`)}`,
        level: i,
        outfitId: evoOutfitId,
      })
    }

    // Add 01 (glowed up) image
    const glowOutfitId = `${props.outfitId}01`
    images.push({
      src: getImageSrc('outfit', glowOutfitId),
      alt: `${t(`outfit.${props.outfitId}.name`)} 01`,
      level: 'glow',
      outfitId: glowOutfitId,
    })

    return images
  })

  const currentOutfitId = computed(
    () => outfitImages.value[activeSlide.value]?.outfitId || props.outfitId
  )

  const outfitItems = computed((): PullItem[] => {
    const outfit = OUTFIT_DATA[props.outfitId as OutfitKey]
    if (!outfit) return []

    const itemPrefix = getItemPrefixForOutfitId(currentOutfitId.value)

    return outfit.items.map((itemId) => {
      const itemIdStr = itemId.toString()
      const baseDigits = itemIdStr.slice(4)
      const variationItemId =
        itemIdStr.length > 4 ? `${itemPrefix}${baseDigits}` : itemId
      return {
        itemId: variationItemId,
        outfitId: currentOutfitId.value,
        quality: props.quality,
        count: 1,
        pullIndex: 0,
        pullsToObtain: 0,
        obtainedAt: '',
        bannerId: props.bannerId,
      }
    })
  })

  watch(
    () => props.outfitId,
    () => {
      activeSlide.value = 0
    }
  )
</script>
