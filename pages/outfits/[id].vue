<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <!-- Loading State -->
    <n-card
      v-if="loading"
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="!p-2 sm:p-4"
    >
      <div class="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-4 lg:gap-6">
        <!-- Image Skeleton -->
        <div class="flex justify-center lg:justify-start">
          <div
            class="relative aspect-[2/3] w-full max-w-[180px] rounded-lg overflow-hidden"
          >
            <n-skeleton
              :sharp="false"
              class="h-full w-full"
            />
            <div class="absolute top-1.5 right-1.5">
              <n-skeleton
                width="68px"
                height="28px"
                :sharp="false"
                class="rounded-full"
              />
            </div>
          </div>
        </div>

        <!-- Info Skeleton -->
        <div class="space-y-3">
          <div class="space-y-2">
            <n-skeleton
              text
              width="60%"
              height="32px"
            />
            <n-skeleton
              width="60px"
              height="24px"
              :sharp="false"
              class="rounded-full"
            />
          </div>
          <n-skeleton
            text
            :repeat="2"
          />

          <!-- Items Skeleton -->
          <div class="space-y-2">
            <n-skeleton
              text
              width="60px"
              height="20px"
            />
            <div
              class="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-10 gap-2"
            >
              <div
                v-for="i in 10"
                :key="i"
                class="aspect-square"
              >
                <n-skeleton
                  :sharp="false"
                  class="h-full w-full rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </n-card>

    <!-- Error State -->
    <n-card
      v-else-if="error"
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="!p-2 sm:p-4"
    >
      <n-result
        status="error"
        :title="t('compendium.error_title')"
        :description="t('compendium.error_description')"
      >
        <template #footer>
          <n-space>
            <n-button
              type="primary"
              @click="retryFetch"
            >
              {{ t('common.retry') }}
            </n-button>
            <n-button @click="navigateToList">
              {{ t('compendium.back_to_list') }}
            </n-button>
          </n-space>
        </template>
      </n-result>
    </n-card>

    <!-- Outfit Detail Content -->
    <template v-else-if="outfit">
      <!-- Outfit Header Card -->
      <n-card
        size="small"
        class="rounded-xl p-0 sm:p-2"
        content-class="!p-2 sm:p-4"
      >
        <div class="grid grid-cols-[180px_1fr] gap-4 lg:gap-6">
          <!-- Outfit Image -->
          <div class="flex justify-center lg:justify-start items-start">
            <div
              class="relative aspect-[2/3] w-full max-w-[180px] rounded-lg overflow-hidden shadow-lg"
              :class="getQualityGradient(outfit.quality)"
            >
              <NuxtImg
                :src="`/images/outfits/${outfit.id}.png`"
                :alt="outfitName"
                class="absolute inset-0 w-full h-full object-cover z-10"
                preset="tallMd"
                width="180"
                height="270"
                fit="cover"
                loading="eager"
                sizes="200px sm:240px"
                format="webp"
              />
              <div class="absolute top-1.5 right-1.5 z-20">
                <n-tag
                  round
                  size="small"
                  :bordered="false"
                  :type="getQualityType(outfit.quality)"
                >
                  <span class="align-top">{{ outfit.quality }}</span>
                  <span class="ml-0.5"
                    ><n-icon><Star /></n-icon
                  ></span>
                </n-tag>
              </div>
            </div>
          </div>

          <!-- Outfit Info and Items -->
          <div class="space-y-3">
            <!-- Title and Description -->
            <div class="space-y-1.5">
              <h1 class="text-xl sm:text-2xl font-bold leading-tight">
                {{ outfitName }}
              </h1>
              <n-tag
                :type="getQualityType(outfit.quality)"
                :bordered="false"
                round
                size="small"
              >
                <span class="align-top">{{ outfit.quality }}</span
                ><span class="ml-0.5"
                  ><n-icon class="text-xs"><Star /></n-icon
                ></span>
              </n-tag>
            </div>

            <!-- Description -->
            <div
              v-if="outfitDescription"
              class="text-xs sm:text-sm opacity-80 leading-relaxed"
            >
              <p class="whitespace-pre-wrap">{{ outfitDescription }}</p>
            </div>

            <!-- Component Items Section -->
            <div v-if="componentItems.length > 0">
              <h3 class="text-sm sm:text-base font-semibold mb-2">
                {{ t('common.items') }}
              </h3>
              <div
                class="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-10 gap-2"
              >
                <ItemPreviewCard
                  v-for="item in componentItems"
                  :key="item.id"
                  :item-id="item.id"
                  :quality="item.quality"
                  :type="item.type"
                  :name="t(`item.${item.id}.name`)"
                  :clickable="true"
                  size="sm"
                />
              </div>
            </div>

            <!-- Makeup Items Section -->
            <div v-if="makeupItems.length > 0">
              <h3 class="text-sm sm:text-base font-semibold mb-2">
                {{ t('common.makeup') }}
              </h3>
              <div
                class="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-10 gap-2"
              >
                <ItemPreviewCard
                  v-for="item in makeupItems"
                  :key="item.id"
                  :item-id="item.id"
                  :quality="item.quality"
                  :type="item.type"
                  :name="t(`item.${item.id}.name`)"
                  :clickable="true"
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>
      </n-card>

      <!-- Variations and Banner Grid (side by side on desktop) -->
      <div
        class="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4 lg:items-stretch"
      >
        <!-- Outfit Variations Section -->
        <n-card
          v-if="outfitVariations.length > 1"
          size="small"
          class="rounded-xl p-0 sm:p-2 h-full"
          content-class="!p-2 sm:p-4"
        >
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-lg font-bold">
              {{ t('common.variations') }}
            </h2>
          </div>
          <div
            class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-4 xl:grid-cols-5 gap-2"
          >
            <NuxtLink
              v-for="variation in outfitVariations"
              :key="variation.id"
              :to="localePath(`/outfits/${variation.id}`)"
              class="block group"
            >
              <div
                class="relative aspect-[2/3] rounded-lg overflow-hidden transition-all duration-200 ease-in-out shadow-md"
                :class="[
                  getQualityGradient(variation.quality),
                  variation.id === outfitId
                    ? 'ring-2 ring-primary/60 dark:ring-primary/40'
                    : 'group-hover:scale-105',
                ]"
              >
                <NuxtImg
                  :src="`/images/outfits/${variation.id}.png`"
                  :alt="t(`outfit.${variation.id}.name`)"
                  class="absolute inset-0 w-full h-full object-cover z-10"
                  preset="tallSm"
                  width="120"
                  height="180"
                  fit="cover"
                  loading="lazy"
                  sizes="120px"
                  format="webp"
                />
              </div>
              <div class="mt-1 text-center">
                <p class="text-xs font-medium opacity-80">
                  {{ variation.label }}
                </p>
              </div>
            </NuxtLink>
          </div>
        </n-card>

        <!-- Banner Section -->
        <n-card
          v-if="inBanner"
          size="small"
          class="rounded-xl p-0 sm:p-2 h-full flex flex-col"
          content-class="!p-2 sm:p-4 flex flex-col h-full"
        >
          <h2 class="text-lg font-bold mb-3">
            {{ t('common.banner') }}
          </h2>
          <NuxtLink
            :to="localePath(`/banners/${inBanner.bannerId}`)"
            class="block group"
          >
            <div
              class="relative aspect-[2/1] max-h-[150px] rounded-lg overflow-hidden transition-all duration-200 ease-in-out shadow-md group-hover:scale-[1.02]"
            >
              <NuxtImg
                :src="`/images/banners/${inBanner.bannerId}.png`"
                :alt="t(`banner.${inBanner.bannerId}.name`)"
                class="w-full h-full object-cover"
                preset="bannerThumb"
                width="200"
                height="100"
                fit="cover"
                loading="lazy"
                sizes="200px"
                format="webp"
              />
            </div>
            <div class="mt-2">
              <p class="font-medium text-sm line-clamp-2">
                {{ t(`banner.${inBanner.bannerId}.name`) }}
              </p>
            </div>
          </NuxtLink>
        </n-card>
      </div>
    </template>

    <!-- Not Found State -->
    <n-card
      v-else
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="!p-2 sm:p-4"
    >
      <n-result
        status="404"
        :title="t('compendium.not_found_title')"
        :description="t('compendium.not_found_description')"
      >
        <template #icon>
          <div class="flex justify-center">
            <NuxtImg
              src="/images/404.webp"
              alt="Not Found"
              class="w-48 h-48 object-cover"
              width="400"
              height="400"
              loading="lazy"
            />
          </div>
        </template>
        <template #footer>
          <n-button
            type="primary"
            @click="navigateToList"
          >
            {{ t('compendium.back_to_list') }}
          </n-button>
        </template>
      </n-result>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import { NIcon } from 'naive-ui'
  import { Star } from '@vicons/fa'
  import type { OutfitWithItems } from '~/types/supabase'
  import type { ItemType } from '~/utils/itemType'

  const { t } = useI18n()
  const localePath = useLocalePath()
  const router = useRouter()
  const route = useRoute()

  // Get outfit ID from route
  const outfitId = computed(() => Number(route.params.id))

  // State
  const outfit = ref<OutfitWithItems | null>(null)
  const loading = ref(true)
  const error = ref<Error | null>(null)

  // Composable
  const { fetchOutfitById } = useSupabaseOutfits()
  const { getImageUrl } = useImageProvider()

  // Makeup types
  const makeupTypes: ItemType[] = [
    'baseMakeup',
    'eyebrows',
    'eyelashes',
    'contactLenses',
    'lips',
  ]

  // Computed component items (excluding makeup) sorted by category order
  const componentItems = computed(() => {
    if (!outfit.value?.outfit_items) return []
    const items = outfit.value.outfit_items
      .map((oi) => oi.items)
      .filter((item) => !makeupTypes.includes(getItemType(item.id)))
    return sortItemsByCategory(items)
  })

  // Computed makeup items sorted by category order
  const makeupItems = computed(() => {
    if (!outfit.value?.outfit_items) return []
    const items = outfit.value.outfit_items
      .map((oi) => oi.items)
      .filter((item) => makeupTypes.includes(getItemType(item.id)))
    return sortItemsByCategory(items)
  })

  // Computed outfit variations with labels
  const outfitVariations = computed(() => {
    if (!outfit.value?.variations) return []
    return outfit.value.variations.map((v) => {
      // Map type to existing translation key
      let levelKey = '1' // base
      if (v.type === 'glowup') {
        levelKey = 'glow'
      } else if (v.type === 'evo1') {
        levelKey = '2'
      } else if (v.type === 'evo2') {
        levelKey = '3'
      } else if (v.type === 'evo3') {
        levelKey = '4'
      }

      return {
        id: v.id,
        quality: v.quality,
        label: t(`banner.outfit.level.${levelKey}`),
      }
    })
  })

  // Find banner for this outfit
  const inBanner = computed(() => {
    if (!outfit.value) return null

    // Check current outfit ID
    let banner = getBannerForOutfit(String(outfit.value.id))
    if (banner) return banner

    // Check all variation IDs
    if (outfit.value.variations) {
      for (const variation of outfit.value.variations) {
        banner = getBannerForOutfit(String(variation.id))
        if (banner) return banner
      }
    }

    return null
  })

  // Get outfit name from i18n (names are stored in i18n files, not database)
  const outfitName = computed(() => {
    if (!outfit.value) return ''
    return t(`outfit.${outfit.value.id}.name`)
  })

  // Get outfit description from database (if available in outfit_translations)
  const outfitDescription = computed(() => {
    if (!outfit.value) return ''
    // Description comes from database outfit_translations table
    // The fetchOutfitById composable should fetch this
    return (
      (outfit.value as OutfitWithItems & { description?: string })
        .description || ''
    )
  })

  // Fetch outfit data
  const loadOutfit = async () => {
    loading.value = true
    error.value = null

    try {
      const { locale } = useI18n()
      const data = await fetchOutfitById(outfitId.value, locale.value)
      outfit.value = data
    } catch (e) {
      error.value = e as Error
      console.error('Failed to load outfit:', e)
    } finally {
      loading.value = false
    }
  }

  // Retry fetch
  const retryFetch = () => {
    loadOutfit()
  }

  // Navigate to list
  const navigateToList = () => {
    router.push(localePath('/outfits'))
  }

  // Get quality gradient class
  const getQualityGradient = (quality: number) => {
    switch (quality) {
      case 5:
        return 'bg-gradient-to-br from-[#fff8e1] to-[#ffcc80] dark:from-[#713f12] dark:to-[#451a03]'
      case 4:
        return 'bg-gradient-to-br from-[#e3f2fd] to-[#bbdefb] dark:from-[#334155] dark:to-[#1e293b]'
      case 3:
        return 'bg-gradient-to-br from-[#e0f2f1] to-[#80cbc4] dark:from-[#134e4a] dark:to-[#0f766e]'
      default:
        return 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800'
    }
  }

  // Get quality type for tag
  const getQualityType = (quality: number) => {
    switch (quality) {
      case 5:
        return 'warning'
      case 4:
        return 'info'
      case 3:
        return 'success'
      default:
        return 'default'
    }
  }

  // Load outfit on mount
  onMounted(() => {
    loadOutfit()
  })

  // SEO Meta Tags
  const siteUrl = useRuntimeConfig().public.siteUrl
  const ogOutfitImage = computed(() =>
    outfit.value
      ? getImageUrl(`/images/outfits/${outfit.value.id}.png`, {
          width: 300,
          height: 450,
          quality: 80,
          format: 'webp',
        })
      : undefined
  )

  useSeoMeta({
    title: () =>
      outfit.value
        ? `${outfitName.value} - ${t('common.outfits')} - ${t('navigation.subtitle')}`
        : `${t('common.outfits')} - ${t('navigation.subtitle')}`,
    description: () =>
      outfitDescription.value ||
      t('meta.description.outfit_detail', { name: outfitName.value || '' }),
    ogTitle: () =>
      outfit.value
        ? `${outfitName.value} - ${t('common.outfits')}`
        : t('common.outfits'),
    ogDescription: () =>
      outfitDescription.value ||
      t('meta.description.outfit_detail', { name: outfitName.value || '' }),
    ogImage: () => ogOutfitImage.value,
    ogType: 'website',
    twitterTitle: () =>
      outfit.value
        ? `${outfitName.value} - ${t('common.outfits')}`
        : t('common.outfits'),
    twitterDescription: () =>
      outfitDescription.value ||
      t('meta.description.outfit_detail', { name: outfitName.value || '' }),
    twitterImage: () => ogOutfitImage.value,
  })

  useHead(() => ({
    link: [
      {
        rel: 'canonical',
        href: `${siteUrl}${localePath(`/outfits/${outfitId.value}`)}`,
      },
    ],
    script: outfit.value
      ? [
          {
            type: 'application/ld+json',
            children: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: outfitName.value,
              description:
                outfitDescription.value ||
                `${outfitName.value} - Infinity Nikki Outfit`,
              image: ogOutfitImage.value,
              brand: {
                '@type': 'Brand',
                name: 'Infinity Nikki',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: outfit.value.quality,
                bestRating: 5,
                worstRating: 1,
              },
            }),
          },
        ]
      : [],
  }))
</script>
