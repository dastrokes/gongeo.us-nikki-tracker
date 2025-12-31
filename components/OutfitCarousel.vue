<template>
  <div class="space-y-3">
    <div class="flex items-center gap-2">
      <n-tag
        :type="rarity === 5 ? 'warning' : 'info'"
        :bordered="false"
        round
      >
        {{ t(`outfit.${outfitId}.name`) }} {{ rarity
        }}<n-icon class="ml-1"><Star /></n-icon>
      </n-tag>
    </div>

    <!-- Outfit Images Carousel with Items Grid -->
    <div class="flex flex-col lg:flex-row gap-4">
      <!-- Carousel Container -->
      <div class="w-full lg:w-auto flex-shrink-0">
        <n-carousel
          :ref="`carousel${rarity}Star`"
          effect="card"
          show-dots
          dot-placement="left"
          :centered-slides="false"
          :slides-per-view="2"
          draggable
          class="rounded-lg w-full sm:w-[400px] aspect-[4/3]"
        >
          <n-carousel-item
            v-for="(image, index) in outfitImages"
            :key="index"
            :class="rarity === 5 ? 'w-[60%]' : 'w-[40%]'"
          >
            <div
              class="relative aspect-[2/3] rounded-lg overflow-hidden transition-all duration-300 ease-in-out"
              :class="cardGradient"
            >
              <NuxtImg
                :src="image.src"
                :alt="image.alt"
                class="absolute inset-0 w-full h-full object-contain z-10"
                width="400"
                height="600"
                fit="cover"
                loading="lazy"
                sizes="300px"
              />
              <div
                class="absolute top-1 scale-90 sm:scale-100 z-20"
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
                  :type="rarity === 5 ? 'warning' : 'info'"
                >
                  {{
                    t(
                      `banner.outfit.level.${image.level === 0 ? '1' : image.level}`
                    )
                  }}
                  <span
                    v-if="completionLevels.includes(image.level.toString())"
                  >
                    <n-icon><CheckCircle /></n-icon>
                  </span>
                </n-tag>
              </div>
            </div>
          </n-carousel-item>
        </n-carousel>
      </div>

      <!-- Outfit Items Grid -->
      <div class="flex-1 min-w-0">
        <div class="grid grid-cols-5 gap-2">
          <ItemCard
            v-for="item in outfitItems"
            :key="item.itemId"
            :item="item"
            :info="false"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Star, CheckCircle } from '@vicons/fa'
  import OUTFIT_DATA, { type OutfitKey } from '~/data/outfits'
  import type { PullItem } from '~/types/pull'

  interface Props {
    outfitId: string
    rarity: number
    bannerId: number
    completionLevels: string[]
  }

  const props = defineProps<Props>()
  const { t } = useI18n()
  const OUTFIT_CARD_GRADIENTS = {
    fiveStar:
      'bg-gradient-to-br from-[#fff8e1] to-[#ffcc80] hover:brightness-105 dark:from-[#713f12] dark:to-[#451a03]',
    fourStar:
      'bg-gradient-to-br from-[#e3f2fd] to-[#bbdefb] hover:brightness-105 dark:from-[#334155] dark:to-[#1e293b]',
  } as const
  const cardGradient = computed(() =>
    props.rarity === 5
      ? OUTFIT_CARD_GRADIENTS.fiveStar
      : OUTFIT_CARD_GRADIENTS.fourStar
  )

  // Helper function to get outfit images for carousel
  const outfitImages = computed(() => {
    const images = []
    images.push({
      src: `/images/outfits/${props.outfitId}.png`,
      alt: `${t(`outfit.${props.outfitId}.name`)} Base`,
      level: 0,
    })

    // Add level variants based on rarity
    const maxLevel = props.rarity === 5 ? 4 : 2
    for (let i = 2; i <= maxLevel; i++) {
      images.push({
        src: `/images/outfits/${props.outfitId}_LV${i}.png`,
        alt: `${t(`outfit.${props.outfitId}.name`)} LV${i}`,
        level: i,
      })
    }

    // Add LV1 (glowed up) image
    images.push({
      src: `/images/outfits/${props.outfitId}_LV1.png`,
      alt: `${t(`outfit.${props.outfitId}.name`)} LV1`,
      level: 'glow',
    })

    return images
  })

  // Helper function to get outfit items for ItemCard display
  const outfitItems = computed((): PullItem[] => {
    const outfit = OUTFIT_DATA[props.outfitId as OutfitKey]

    return outfit.items.map((itemId) => {
      return {
        itemId: itemId,
        outfitId: props.outfitId,
        rarity: props.rarity,
        count: 1,
        pullIndex: 0,
        pullsToObtain: 0,
        obtainedAt: '',
        bannerId: props.bannerId,
      }
    })
  })
</script>
